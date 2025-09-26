const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const multer = require("multer");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// アップロード設定
const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// 静的ファイル公開
app.use("/uploads", express.static("uploads"));

// アップロードAPI
app.post("/upload", upload.single("file"), (req, res) => {
  res.json({ url: `/uploads/${req.file.filename}` });
});

// Socket.io チャット
io.on("connection", (socket) => {
  console.log("✅ ユーザー接続");

  socket.on("join room", (room) => {
    socket.join(room);
  });

  socket.on("chat message", (data) => {
    data.time = Date.now();
    io.to(data.room).emit("chat message", data);
  });

  socket.on("disconnect", () => {
    console.log("❌ ユーザー切断");
  });
});

server.listen(process.env.PORT || 10000, () => {
  console.log("🚀 Server running");
});
