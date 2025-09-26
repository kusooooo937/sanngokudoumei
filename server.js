// server.js
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",   // GitHub Pages からのアクセスを許可
    methods: ["GET", "POST"]
  }
});

// メッセージ保存（部屋ごとに最大100件）
const messages = {};            // { roomName: [{id,msg,name,time,type,...},...] }
const anonymousCounters = {};   // { roomName: lastAnonymousId }

io.on('connection', (socket) => {
  let currentRoom = null;

  // 部屋入室
  socket.on('join', ({ room, name, id }) => {
    if (currentRoom) socket.leave(currentRoom);
    currentRoom = room;
    socket.join(room);

    if (!messages[room]) messages[room] = [];
    if (!anonymousCounters[room]) anonymousCounters[room] = 1;

    // 入室メッセージ
    const joinMsg = {
      type: 'system',
      msg: `【${socket.id.substring(0,4)}】さんが入室しました`,
      time: new Date().toLocaleTimeString()
    };
    io.to(room).emit('message', joinMsg);

    // 履歴を送信
    socket.emit('history', messages[room]);
  });

  // メッセージ送信
  socket.on('message', (data) => {
    const room = currentRoom;
    if (!room) return;

    // 名前が未入力なら「名無しさん#番号」
    let name = data.name?.trim();
    if (!name) {
      const id = anonymousCounters[room]++;
      name = `名無しさん#${id}`;
    }

    const msgObj = {
      id: socket.id.substring(0,4),
      name,
      msg: data.msg || null,
      file: data.file || null,
      fileType: data.fileType || null,
      type: data.type || 'text',
      time: data.time || new Date().toLocaleTimeString()
    };

    // 保存（最大100件）
    messages[room].push(msgObj);
    if (messages[room].length > 100) messages[room].shift();

    io.to(room).emit('message', msgObj);
  });

  // 切断
  socket.on('disconnect', () => {
    if (currentRoom) {
      const leaveMsg = {
        type: 'system',
        msg: `【${socket.id.substring(0,4)}】さんが退出しました`,
        time: new Date().toLocaleTimeString()
      };
      io.to(currentRoom).emit('message', leaveMsg);
    }
  });
});

const PORT = process.env.PORT || 10000;
httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
