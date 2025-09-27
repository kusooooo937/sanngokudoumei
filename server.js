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

const messages = {}; // { roomName: [{id, name, msg, type, time, fileType, file}] }
const anonymousCounters = {}; // { roomName: lastAnonymousId }

io.on("connection", (socket) => {
  let currentRoom = null;

  socket.on("joinRoom", (room) => {
    if (currentRoom) socket.leave(currentRoom);
    currentRoom = room;
    socket.join(room);

    if (!messages[room]) messages[room] = [];
    if (!anonymousCounters[room]) anonymousCounters[room] = 1;

    const joinMsg = {
      id: null,
      name: "system",
      msg: `【${socket.id.substring(0, 4)}】さんが入室しました`,
      type: "system",
      time: new Date().toLocaleTimeString(),
    };
    io.to(room).emit("message", joinMsg);

    socket.emit("history", messages[room]);
  });

  socket.on("message", (data) => {
    const room = currentRoom;
    if (!room) return;

    let name = data.name?.trim();
    if (!name) {
      const id = anonymousCounters[room]++;
      name = `名無しさん#${id}`;
    }

    const msgObj = {
      id: socket.id.substring(0, 4),
      name,
      msg: data.msg || "",
      type: data.file ? "image" : "text",
      file: data.file || null,
      fileType: data.fileType || null,
      time: new Date().toLocaleTimeString(),
    };

    messages[room].push(msgObj);
    if (messages[room].length > 100) messages[room].shift();

    io.to(room).emit("message", msgObj);
  });
});

server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
