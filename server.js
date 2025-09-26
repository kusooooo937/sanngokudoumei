import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: { origin: '*' }
});

app.use(express.static('public'));

const messages = {};
const anonymousCounters = {};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/', 'video/'];

io.on('connection', (socket) => {
    let currentRoom = null;

    socket.on('joinRoom', (room) => {
        if (currentRoom) socket.leave(currentRoom);
        currentRoom = room;
        socket.join(room);

        if (!messages[room]) messages[room] = [];
        if (!anonymousCounters[room]) anonymousCounters[room] = 1;

        const joinMsg = {
            id: null,
            name: 'システム',
            msg: `【${socket.id.substring(0,4)}】さんが入室しました`,
            time: new Date().toLocaleTimeString(),
            type: 'system'
        };
        io.to(room).emit('message', joinMsg);

        socket.emit('history', messages[room]);
    });

    socket.on('message', (data) => {
        const room = currentRoom;
        if (!room) return;

        let name = data.name?.trim();
        if (!name) {
            const id = anonymousCounters[room]++;
            name = `名無しさん#${id}`;
        }

        // ファイルチェック
        if (data.file && data.fileType) {
            const base64Length = data.file.length - data.file.indexOf(',') - 1;
            const fileSize = (base64Length * 3 / 4); // approx bytes
            if (fileSize > MAX_FILE_SIZE) {
                socket.emit('message', {
                    id: null,
                    name: 'システム',
                    msg: '⚠ ファイルサイズが10MBを超えています',
                    time: new Date().toLocaleTimeString(),
                    type: 'system'
                });
                return;
            }
            if (!ALLOWED_TYPES.some(t => data.fileType.startsWith(t))) {
                socket.emit('message', {
                    id: null,
                    name: 'システム',
                    msg: '⚠ 許可されていないファイル形式です',
                    time: new Date().toLocaleTimeString(),
                    type: 'system'
                });
                return;
            }
        }

        const msgObj = {
            id: socket.id.substring(0,4),
            name,
            msg: data.msg || '',
            time: new Date().toLocaleTimeString(),
            type: data.type,
            file: data.file || null,
            fileType: data.fileType || null
        };

        messages[room].push(msgObj);
        if (messages[room].length > 100) messages[room].shift();

        io.to(room).emit('message', msgObj);
    });
});

const PORT = process.env.PORT || 10000;
httpServer.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
