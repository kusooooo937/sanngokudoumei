import express from "express";
import http from "http";
import { Server } from "socket.io";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

const PORT = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.get("/", (req, res) => res.sendFile(path.join(__dirname, "index.html")));
app.get("/chat.js", (req, res) => res.sendFile(path.join(__dirname, "chat.js")));

// 部屋ごとのメッセージ保持
const messages = {}; // { roomName: [{id, name, msg, type, time, fileType, file}] }
const anonymousCounters = {}; // { roomName: lastAnonymousId }

io.on("connection", (socket) => {
  let currentRoom = null;

  // 部屋入室
  socket.on("joinRoom", (room) => {
    if (currentRoom) socket.leave(currentRoom);
    currentRoom = room;
    socket.join(room);

    if (!messages[room]) messages[room] = [];
    if (!anonymousCounters[room]) anonymousCounters[room] = 1;

    // 入室メッセージ
    const joinMsg = {
      id: null,
      name: "system",
      msg: `【${socket.id.substring(0,4)}】さんが入室しました`,
      type: "system",
      time: new Date().toLocaleTimeString(),
    };
    io.to(room).emit("message", joinMsg);

    // 参加人数更新
    const users = io.sockets.adapter.rooms.get(room)?.size || 0;
    io.to(room).emit("roomUsers", { room, count: users });

    // 過去メッセージ送信
    socket.emit("history", messages[room]);
  });

  // メッセージ受信
  socket.on("message", (data) => {
    if (!currentRoom) return;
    const room = currentRoom;

    // 名前が空の場合
    let name = data.name?.trim();
    if (!name) {
      const id = anonymousCounters[room]++;
      name = `名無しさん#${id}`;
    }

    const msgObj = {
      id: socket.id.substring(0,4),
      name,
      msg: data.msg || "",
      type: data.file ? "image" : "text",
      file: data.file || null,
      fileType: data.fileType || null,
      time: new Date().toLocaleTimeString(),
    };

    messages[room].push(msgObj);
    if (messages[room].length > 50) messages[room].shift(); // 最新50件のみ保持

    io.to(room).emit("message", msgObj);
  });

  // 切断
  socket.on("disconnect", () => {
    if (currentRoom) {
      const users = io.sockets.adapter.rooms.get(currentRoom)?.size || 0;
      io.to(currentRoom).emit("roomUsers", { room: currentRoom, count: users });
    }
  });
});

server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
