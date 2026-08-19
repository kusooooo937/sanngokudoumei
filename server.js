import express from "express";
import http from "http";
import { Server } from "socket.io";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

const PORT = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.get("/", (req, res) => res.sendFile(path.join(__dirname, "index.html")));
app.get("/chat.js", (req, res) => res.sendFile(path.join(__dirname, "chat.js")));

// ===== データ永続化 =====
const MESSAGES_FILE = path.join(__dirname, "messages.json");
const BOARDS_FILE = path.join(__dirname, "boards.json");

let messages = {};
if (fs.existsSync(MESSAGES_FILE)) {
  try { messages = JSON.parse(fs.readFileSync(MESSAGES_FILE, "utf-8")); }
  catch (e) { console.error("messages.json読み込み失敗:", e); messages = {}; }
}

// boards: { 板名: { tags: [], createdAt, lastActive, messageCount } }
let boards = {};
if (fs.existsSync(BOARDS_FILE)) {
  try { boards = JSON.parse(fs.readFileSync(BOARDS_FILE, "utf-8")); }
  catch (e) { console.error("boards.json読み込み失敗:", e); boards = {}; }
}

const anonymousCounters = {};

function saveMessages() {
  fs.writeFile(MESSAGES_FILE, JSON.stringify(messages), (err) => {
    if (err) console.error("messages.json保存失敗:", err);
  });
}
function saveBoards() {
  fs.writeFile(BOARDS_FILE, JSON.stringify(boards), (err) => {
    if (err) console.error("boards.json保存失敗:", err);
  });
}

// 既存の部屋がboardsに未登録なら登録する(後方互換)
function ensureBoard(name) {
  if (!boards[name]) {
    boards[name] = {
      tags: [],
      createdAt: Date.now(),
      lastActive: Date.now(),
      messageCount: (messages[name] || []).length,
    };
  }
}
Object.keys(messages).forEach(ensureBoard);

// 現在の人数を付与した板一覧を作る
function getBoardList() {
  return Object.entries(boards).map(([name, info]) => ({
    name,
    tags: info.tags || [],
    createdAt: info.createdAt,
    lastActive: info.lastActive,
    messageCount: info.messageCount || 0,
    userCount: io.sockets.adapter.rooms.get(name)?.size || 0,
  }));
}

function broadcastBoards() {
  io.emit("boardsUpdated", getBoardList());
}

io.on("connection", (socket) => {
  let currentRoom = null;

  // 接続時に板一覧を送る
  socket.emit("boardsUpdated", getBoardList());

  // 板を作る
  socket.on("createBoard", ({ name, tags }) => {
    name = (name || "").trim();
    if (!name) {
      socket.emit("createBoardResult", { ok: false, message: "板名を入力してください" });
      return;
    }
    if (boards[name]) {
      socket.emit("createBoardResult", { ok: false, message: "その板名はすでに存在します" });
      return;
    }
    boards[name] = {
      tags: Array.isArray(tags) ? tags.slice(0, 10) : [],
      createdAt: Date.now(),
      lastActive: Date.now(),
      messageCount: 0,
    };
    if (!messages[name]) messages[name] = [];
    saveBoards();
    saveMessages();
    socket.emit("createBoardResult", { ok: true, name });
    broadcastBoards();
  });// 板を削除する
  socket.on("deleteBoard", (name) => {
    name = (name || "").trim();
    if (!name || !boards[name]) return;

    delete boards[name];
    delete messages[name];
    delete anonymousCounters[name];
    saveBoards();
    saveMessages();

    // その板に今いる人たちをホームに戻す
    io.to(name).emit("boardDeleted", { name });

    broadcastBoards();
  });

  // 部屋入室
  socket.on("joinRoom", (room) => {
    if (currentRoom) socket.leave(currentRoom);
    currentRoom = room;
    socket.join(room);

    if (!messages[room]) messages[room] = [];
    if (!anonymousCounters[room]) anonymousCounters[room] = 1;
    ensureBoard(room);
    boards[room].lastActive = Date.now();
    saveBoards();

    const joinMsg = {
      id: null,
      name: "system",
      msg: `【${socket.id.substring(0,4)}】さんが入室しました`,
      type: "system",
      time: new Date().toLocaleTimeString(),
    };
    io.to(room).emit("message", joinMsg);

    const users = io.sockets.adapter.rooms.get(room)?.size || 0;
    io.to(room).emit("roomUsers", { room, count: users });

    socket.emit("history", messages[room]);
    broadcastBoards();
  });

  // メッセージ受信
  socket.on("message", (data) => {
    if (!currentRoom) return;
    const room = currentRoom;

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
    if (messages[room].length > 200) messages[room].shift();
    saveMessages();

    ensureBoard(room);
    boards[room].messageCount = messages[room].length;
    boards[room].lastActive = Date.now();
    saveBoards();

    io.to(room).emit("message", msgObj);
    broadcastBoards();
  });

  socket.on("disconnect", () => {
    if (currentRoom) {
      const users = io.sockets.adapter.rooms.get(currentRoom)?.size || 0;
      io.to(currentRoom).emit("roomUsers", { room: currentRoom, count: users });
      broadcastBoards();
    }
  });
});

server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
