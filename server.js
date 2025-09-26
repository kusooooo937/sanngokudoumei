const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);

// CORS対応
app.use(cors({
  origin: '*', // GitHub Pagesや他のクライアントからアクセス可能に
  methods: ['GET','POST']
}));

// 静的ファイルの配信（アップロード画像/動画用）
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Multer設定
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// 画像/動画アップロードAPI
app.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'ファイルなし' });
  res.json({ url: `/uploads/${req.file.filename}` });
});

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET','POST']
  }
});

// 部屋ごとの接続
io.on('connection', (socket) => {
  console.log('ユーザー接続');

  socket.on('joinRoom', (room) => {
    socket.join(room);
    console.log(`${socket.id} joined ${room}`);
  });

  socket.on('chatMessage', (data) => {
    // data: { room, name, text, fileUrl }
    io.to(data.room).emit('chatMessage', data);
  });

  socket.on('disconnect', () => {
    console.log('ユーザー切断');
  });
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
