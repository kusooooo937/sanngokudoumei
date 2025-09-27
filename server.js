import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*' }
});

// 画像保存設定
const upload = multer({ dest: path.join(__dirname, 'uploads/') });

app.use(express.static('public'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const messages = {}; // { roomName: [msgObj,...] }
const anonymousCounters = {};

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
      type: 'system',
      time: new Date().toLocaleTimeString()
    };
    io.to(room).emit('message', joinMsg);

    // 履歴送信
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

    const msgObj = {
      id: socket.id.substring(0,4),
      name,
      msg: data.msg,
      type: data.type || 'text',
      time: new Date().toLocaleTimeString()
    };

    messages[room].push(msgObj);
    if (messages[room].length > 100) messages[room].shift();

    io.to(room).emit('message', msgObj);
  });
});

// 画像アップロードAPI
app.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file' });

  const fileUrl = `/uploads/${req.file.filename}`;
  res.json({ url: fileUrl });
});

const PORT = process.env.PORT || 10000;
httpServer.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
