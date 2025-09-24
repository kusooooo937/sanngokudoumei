const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" }
});

app.use(express.static("public"));

io.on("connection", (socket) => {
  console.log("✅ ユーザー接続");

  // 部屋に参加
  socket.on("join room", (room) => {
    socket.join(room);
    console.log(`➡️ ${socket.id} joined room: ${room}`);
  });

  // 部屋ごとにメッセージ送信
  socket.on("chat message", ({ room, name, msg }) => {
    io.to(room).emit("chat message", { name, msg });
  });

  socket.on("disconnect", () => {
    console.log("❌ ユーザー切断");
  });
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
