const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const multer = require('multer');
const path = require('path');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

// CORS設定（GitHub Pages用）
app.use(cors({
  origin: 'https://kusooooo937.github.io',
  methods: ['GET','POST'],
  credentials: true
}));

// 静的ファイル
app.use(express.static('public'));

// ファイルアップロード設定
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'public/uploads'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// メッセージ保存用（部屋ごと）
const messages = {}; 
const MAX_MESSAGES = 100;

// ファイルアップロード用
app.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).send('No file uploaded.');
  res.json({ url: '/uploads/' + req.file.filename });
});

const io = new Server(server, {
  cors: {
    origin: 'https://kusooooo937.github.io',
    methods: ['GET','POST'],
    credentials: true
  }
});

io.on('connection', (socket) => {
  let currentRoom = null;

  socket.on('joinRoom', (room) => {
    if (currentRoom) socket.leave(currentRoom);
    currentRoom = room;
    socket.join(room);

    if (!messages[room]) messages[room] = [];
    socket.emit('history', messages[room]);
  });

  socket.on('message', (data) => {
    if (!currentRoom) return;
    const msg = {
      id: data.id || socket.id,
      name: data.name && data.name.trim() ? data.name : '名無しさん',
      type: data.type || 'text',
      content: data.content,
      time: new Date().toLocaleTimeString()
    };
    messages[currentRoom].push(msg);
    if (messages[currentRoom].length > MAX_MESSAGES) messages[currentRoom].shift();
    io.to(currentRoom).emit('message', msg);
  });
});

server.listen(10000, () => console.log('🚀 CORS対応サーバー起動中 port 10000'));
