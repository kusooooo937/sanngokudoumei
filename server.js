const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" }
});

app.use(express.static("public"));

// 📝 部屋ごとの履歴を保存するオブジェクト
const chatHistory = {}; // { roomName: [ { name, msg, time }, ... ] }

io.on("connection", (socket) => {
  console.log("✅ ユーザー接続");

  socket.on("join room", (room) => {
    socket.join(room);
    console.log(`➡️ ${socket.id} joined room: ${room}`);

    // 入室したユーザーに履歴を送信
    if (chatHistory[room]) {
      socket.emit("chat history", chatHistory[room]);
    }
  });

  socket.on("chat message", ({ room, name, msg }) => {
    const time = new Date().toISOString();

    // 履歴に保存（100件まで）
    if (!chatHistory[room]) chatHistory[room] = [];
    chatHistory[room].push({ name, msg, time });
    if (chatHistory[room].length > 100) {
      chatHistory[room].shift(); // 古いものから削除
    }

    // 部屋のみんなに送信
    io.to(room).emit("chat message", { name, msg, time });
  });

  socket.on("disconnect", () => {
    console.log("❌ ユーザー切断");
  });
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
