import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: '*' } });

const messages = {}; // { roomName: [msgObj,...] }
const anonymousCounters = {}; // { roomName: lastAnonymousId }

io.on('connection', (socket) => {
  let currentRoom = null;

  socket.on('join', ({ room, name, id }) => {
    if (currentRoom) socket.leave(currentRoom);
    currentRoom = room;
    socket.join(room);

    if (!messages[room]) messages[room] = [];
    if (!anonymousCounters[room]) anonymousCounters[room] = 1;

    // 入室メッセージ
    const joinMsg = {
      id: null,
      name: 'システム',
      msg: `【${socket.id.substring(0,4)}】さんが入室しました`,
      type: 'system',
      time: new Date().toLocaleTimeString()
    };
    io.to(room).emit('message', joinMsg);

    // 過去メッセージ送信
    socket.emit('history', messages[room]);
  });

  socket.on('message', (data) => {
    if (!currentRoom) return;

    // 名前未設定なら名無しさん＋ID
    let name = data.name?.trim();
    if (!name) name = `名無しさん#${anonymousCounters[currentRoom]++}`;

    const msgObj = {
      id: socket.id.substring(0,4),
      name,
      msg: data.msg || data.file || '',
      file: data.file || null,
      fileType: data.fileType || null,
      type: data.type,
      time: new Date().toLocaleTimeString()
    };

    messages[currentRoom].push(msgObj);
    if (messages[currentRoom].length > 100) messages[currentRoom].shift();

    io.to(currentRoom).emit('message', msgObj);
  });
});

const PORT = process.env.PORT || 10000;
httpServer.listen(PORT, () => console.log(`Server running on port ${PORT}`));
