import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: "*" }
});

// 部屋ごとのメッセージ履歴を保持
const messages = {}; // { roomName: [ {type, name, msg, time}, ... ] }

io.on("connection", (socket) => {
  let currentRoom = null;

  // 部屋入室
  socket.on("joinRoom", (room) => {
    if (currentRoom) socket.leave(currentRoom);
    currentRoom = room;
    socket.join(room);

    if (!messages[room]) messages[room] = [];

    // 履歴送信
    socket.emit("history", messages[room]);

    // 入室メッセージ
    const joinMsg = {
      type: "system",
      name: "システム",
      msg: `【${socket.id.substring(0, 4)}】さんが入室しました`,
      time: new Date().toLocaleTimeString()
    };
    io.to(room).emit("message", joinMsg);
  });

  // メッセージ受信
  socket.on("message", (data) => {
    if (!currentRoom) return;

    const msgObj = {
      type: data.type || "text",
      name: data.name?.trim() || "名無しさん",
      msg: data.msg,
      time: new Date().toLocaleTimeString()
    };

    messages[currentRoom].push(msgObj);
    if (messages[currentRoom].length > 100) messages[currentRoom].shift();

    io.to(currentRoom).emit("message", msgObj);
  });
});

const PORT = process.env.PORT || 10000;
httpServer.listen(PORT, () =>
  console.log(`🚀 Server running on port ${PORT}`)
);
