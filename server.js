const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

app.use(cors());
app.use(express.static('public')); // HTML, JS, CSSを置くフォルダ

// 各部屋ごとのメッセージ保存
const rooms = {}; // rooms[roomName] = [{name, text, file, time}, ...]

io.on('connection', (socket) => {
  console.log('ユーザー接続');

  socket.on('joinRoom', (room) => {
    socket.join(room);
    console.log(`${socket.id} joined ${room}`);
    
    if (!rooms[room]) rooms[room] = [];
    
    // 過去メッセージを送信
    socket.emit('chatHistory', rooms[room]);

    io.to(room).emit('chatMessage', {
      name: 'System',
      text: `ユーザーが ${room} に入室しました`,
      time: new Date().toLocaleTimeString()
    });
  });

  socket.on('chatMessage', (data) => {
    rooms[data.room].push(data); // 保存
    io.to(data.room).emit('chatMessage', data);
  });

  socket.on('disconnect', () => {
    console.log('ユーザー切断');
  });
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
