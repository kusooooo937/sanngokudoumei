const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const multer = require('multer'); // 画像/動画用
const path = require('path');
const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

// ファイル保存設定
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'public/uploads'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

const messages = {}; // { roomName: [{id,name,type,content,time}, ...] }
const MAX_MESSAGES = 100;

// 画像/動画アップロード用
app.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).send('No file uploaded.');
  res.json({ url: '/uploads/' + req.file.filename });
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

server.listen(10000, () => console.log('🚀 Server running on port 10000'));
