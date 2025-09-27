import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import multer from 'multer';
import path from 'path';
import cors from 'cors';
import fs from 'fs';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: '*' } });

// CORS対応
app.use(cors());

// uploadsフォルダ作成
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

// Multer設定
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// 静的ファイル配信
app.use('/uploads', express.static(uploadDir));
app.use(express.static('public'));

// 画像アップロード
app.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file' });
  const fileUrl = `/uploads/${req.file.filename}`;
  res.json({ url: fileUrl });
});

// メッセージ保存
const messages = {};         // { room: [{id,name,msg,type,time}] }
const anonymousCounters = {}; // { room: lastAnonymousId }

io.on('connection', (socket) => {
  let currentRoom = null;

  socket.on('joinRoom', ({ room, name }) => {
    if (currentRoom) socket.leave(currentRoom);
    currentRoom = room;
    socket.join(room);

    if (!messages[room]) messages[room] = [];
    if (!anonymousCounters[room]) anonymousCounters[room] = 1;

    // 名前未入力なら名無しさん
    let userName = name?.trim();
    if (!userName) {
      const id = anonymousCounters[room]++;
      userName = `名無しさん#${id}`;
    }

    // 入室メッセージ
    const joinMsg = {
      id: null,
      name: 'システム',
      msg: `${userName} が入室しました`,
      type: 'system',
      time: new Date().toLocaleTimeString()
    };
    io.to(room).emit('message', joinMsg);

    // 履歴送信
    socket.emit('history', messages[room]);

    // ユーザー情報保存
    socket.data.name = userName;
    socket.data.room = room;
  });

  socket.on('message', (data) => {
    const room = socket.data.room;
    if (!room) return;

    let name = data.name?.trim() || socket.data.name || '名無しさん';

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

const PORT = process.env.PORT || 10000;
httpServer.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
