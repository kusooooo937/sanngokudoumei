import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: { origin: '*' } // CORS対応
});

app.use(express.static('public')); // 静的ファイル配信（HTML/JS用）

const messages = {};           // { roomName: [{id,msg,name,time,file,type}, ...] }
const anonymousCounters = {};  // { roomName: lastAnonymousId }

io.on('connection', (socket) => {
    let currentRoom = null;

    // 部屋入室
    socket.on('joinRoom', ({ room, name, id }) => {
        if (currentRoom) socket.leave(currentRoom);
        currentRoom = room;
        socket.join(room);

        if (!messages[room]) messages[room] = [];
        if (!anonymousCounters[room]) anonymousCounters[room] = 1;

        // 入室メッセージ
        const joinMsg = {
            id: null,
            name: 'システム',
            msg: `【${name || '名無しさん'}#${id || socket.id.substring(0,4)}】が入室しました`,
            type: 'system',
            time: new Date().toLocaleTimeString()
        };
        io.to(room).emit('message', joinMsg);

        // 履歴送信
        socket.emit('history', messages[room]);
    });

    // メッセージ受信
    socket.on('message', (data) => {
        const room = currentRoom;
        if (!room) return;

        // 名前未設定なら名無しさん＋連番
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
            type: data.type || 'text',
            time: new Date().toLocaleTimeString()
        };

        // メモリに保存（最大100件）
        messages[room].push(msgObj);
        if (messages[room].length > 100) messages[room].shift();

        io.to(room).emit('message', msgObj);
    });
});

const PORT = process.env.PORT || 10000;
httpServer.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
