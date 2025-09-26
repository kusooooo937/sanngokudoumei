import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: { origin: '*' } // クロスオリジン対応
});

app.use(express.static('public'));

const messages = {}; // { roomName: [{id,msg,name,file,fileType,time},...] }
const anonymousCounters = {}; // { roomName: lastAnonymousId }

io.on('connection', (socket) => {
    let currentRoom = null;

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
            time: new Date().toLocaleTimeString()
        };
        io.to(room).emit('message', joinMsg);

        // 過去履歴を送信
        socket.emit('history', messages[room]);
    });

    socket.on('message', (data) => {
        const room = currentRoom;
        if (!room) return;

        // 名前未設定なら名無しさん＋ID
        let name = data.name?.trim();
        if (!name) {
            const id = anonymousCounters[room]++;
            name = `名無しさん#${id}`;
        }

        const msgObj = {
            id: socket.id.substring(0,4),
            name,
            msg: data.msg || '',
            file: data.file || null,
            fileType: data.fileType || null,
            time: new Date().toLocaleTimeString()
        };

        messages[room].push(msgObj);
        if (messages[room].length > 100) messages[room].shift();

        io.to(room).emit('message', msgObj);
    });
});

const PORT = process.env.PORT || 10000;
httpServer.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
