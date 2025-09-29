const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// 部屋ごとの履歴保存用
const roomMessages = {};

io.on("connection", (socket) => {
  console.log("a user connected");

  socket.on("joinRoom", (room) => {
    socket.join(room);

    // 過去ログがあれば送信
    if (roomMessages[room]) {
      socket.emit("history", roomMessages[room]);
    }

    // システムメッセージ
    io.to(room).emit("system", {
      type: "system",
      msg: `誰かが部屋「${room}」に入りました`,
      time: new Date().toLocaleTimeString()
    });
  });

  socket.on("message", (data) => {
    const room = data.room;
    if (!roomMessages[room]) roomMessages[room] = [];
    roomMessages[room].push(data);

    // 履歴の件数制限（最新50件だけ保持）
    if (roomMessages[room].length > 50) {
      roomMessages[room].shift();
    }

    io.to(room).emit("message", data);
  });

  socket.on("disconnect", () => {
    console.log("user disconnected");
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
