import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: { origin: '*' } // CORS対応
});

const messages = {};         // { roomName: [{id,msg,name,type,file,time},...] }
const anonymousCounters = {}; // { roomName: lastAnonymousId }

io.on('connection', (socket) => {
    let currentRoom = null;

    // 部屋入室
    socket.on('joinRoom', (room) => {
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

    // メッセージ受信
    socket.on('message', (data) => {
        if (!currentRoom) return;

        // 名前未設定なら名無しさん＋ID
        let name = data.name?.trim();
        if (!name) {
            const id = anonymousCounters[currentRoom]++;
            name = `名無しさん#${id}`;
        }

        const msgObj = {
            id: socket.id.substring(0,4),
            name,
            msg: data.msg || '',
            file: data.file || null,
            type: data.type || 'text',
            time: new Date().toLocaleTimeString()
        };

        messages[currentRoom].push(msgObj);
        if (messages[currentRoom].length > 100) messages[currentRoom].shift(); // 100件まで保持

        io.to(currentRoom).emit('message', msgObj);
    });
});

const PORT = process.env.PORT || 10000;
httpServer.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
