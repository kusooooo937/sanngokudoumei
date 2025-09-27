import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import multer from "multer";
import path from "path";
import fs from "fs";

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: "*" } });

const PORT = process.env.PORT || 10000;
const uploadDir = "uploads";

// アップロードフォルダ作成
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

// Multer設定（ファイル名をASCII化）
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const fname = Date.now() + "-" + Math.round(Math.random() * 1e9) + ext;
    cb(null, fname);
  },
});
const upload = multer({ storage });

app.use(express.static("public"));
app.use("/uploads", express.static(uploadDir));

// チャットメッセージ保存
const messages = {}; // { room: [{id,name,msg,type,time,file,fileType},...] }
const anonymousCounters = {};

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
      name: "システム",
      msg: `【${socket.id.substring(0, 4)}】さんが入室しました`,
      time: new Date().toLocaleTimeString(),
      type: "system",
    };
    io.to(room).emit("message", joinMsg);

    socket.emit("history", messages[room]);
  });

  socket.on("message", (data) => {
    if (!currentRoom) return;

    let name = data.name?.trim();
    if (!name) {
      const id = anonymousCounters[currentRoom]++;
      name = `名無しさん#${id}`;
    }

    const msgObj = {
      id: socket.id.substring(0, 4),
      name,
      msg: data.msg || "",
      type: data.type || "text",
      time: new Date().toLocaleTimeString(),
      file: data.file || null,
      fileType: data.fileType || null,
    };

    messages[currentRoom].push(msgObj);
    if (messages[currentRoom].length > 100) messages[currentRoom].shift();

    io.to(currentRoom).emit("message", msgObj);
  });
});

httpServer.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
