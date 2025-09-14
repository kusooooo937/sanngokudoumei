const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" }
});

app.use(express.static("public")); // public フォルダを公開

io.on("connection", (socket) => {
  console.log("✅ ユーザー接続");

  socket.on("chat message", (msg) => {
    io.emit("chat message", msg);
  });

  socket.on("disconnect", () => {
    console.log("❌ ユーザー切断");
  });
});

const PORT = process.env.PORT || 10000; 
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
