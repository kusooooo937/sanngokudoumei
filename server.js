const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const multer = require("multer");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const upload = multer({ dest: "uploads/" });

// 静的ファイル公開
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ファイルアップロードAPI
app.post("/upload", upload.single("file"), (req, res) => {
  const fileUrl = `/uploads/${req.file.filename}`;
  res.json({ url: fileUrl });
});

// メモリ上で過去ログ保持（簡易）
const rooms = {};

// Socket.IO処理
io.on("connection", (socket) => {
  console.log("✅ ユーザー接続");

  socket.on("join room", (room) => {
    socket.join(room);
    if (!rooms[room]) rooms[room] = [];
    socket.emit("chat history", rooms[room]);
    console.log(`➡️ ${socket.id} joined room: ${room}`);
  });

  socket.on("chat message", (data) => {
    data.time = Date.now();
    if (!rooms[data.room]) rooms[data.room] = [];
    rooms[data.room].push(data);
    io.to(data.room).emit("chat message", data);
  });

  socket.on("disconnect", () => console.log("❌ ユーザー切断"));
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
