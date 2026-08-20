import express from "express";
import http from "http";
import { Server } from "socket.io";
import path from "path";
import { fileURLToPath } from "url";
import { MongoClient } from "mongodb";

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

const PORT = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.get("/", (req, res) => res.sendFile(path.join(__dirname, "index.html")));
app.get("/chat.js", (req, res) => res.sendFile(path.join(__dirname, "chat.js")));

// ===== MongoDB接続 =====
if (!process.env.MONGODB_URI) {
  console.error("❌ MONGODB_URIが設定されていません");
  process.exit(1);
}
const client = new MongoClient(process.env.MONGODB_URI);
let db;
let messagesCol;
let boardsCol;

// メモリ上のキャッシュ(既存コードとの互換のため維持)
let messages = {};   // { room: [msgObj, ...] }
let boards = {};     // { name: { tags, createdAt, lastActive, messageCount } }
const anonymousCounters = {};

async function loadFromDB() {
  const boardDocs = await boardsCol.find({}).toArray();
  boardDocs.forEach(doc => {
    boards[doc._id] = {
      tags: doc.tags || [],
      createdAt: doc.createdAt,
      lastActive: doc.lastActive,
      messageCount: doc.messageCount || 0,
    };
  });

  const messageDocs = await messagesCol.find({}).toArray();
  messageDocs.forEach(doc => {
    messages[doc._id] = doc.messages || [];
  });

  console.log(`✅ 読み込み完了: 板${boardDocs.length}件, メッセージ${messageDocs.length}部屋分`);
}

function saveBoard(name) {
  boardsCol.updateOne(
    { _id: name },
    { $set: boards[name] },
    { upsert: true }
  ).catch(err => console.error("board保存失敗:", err));
}

function saveMessages(room) {
  messagesCol.updateOne(
    { _id: room },
    { $set: { messages: messages[room] } },
    { upsert: true }
  ).catch(err => console.error("messages保存失敗:", err));
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
    saveBoard(name);
    saveMessages(name);
    socket.emit("createBoardResult", { ok: true, name });
    broadcastBoards();
  });

  // 板を削除する
  socket.on("deleteBoard", (name) => {
    name = (name || "").trim();
    if (!name || !boards[name]) return;

    delete boards[name];
    delete messages[name];
    delete anonymousCounters[name];

    boardsCol.deleteOne({ _id: name }).catch(err => console.error("board削除失敗:", err));
    messagesCol.deleteOne({ _id: name }).catch(err => console.error("messages削除失敗:", err));

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
    saveBoard(room);

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
    saveMessages(room);

    ensureBoard(room);
    boards[room].messageCount = messages[room].length;
    boards[room].lastActive = Date.now();
    saveBoard(room);

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

// ===== 起動 =====
async function main() {
  await client.connect();
  db = client.db(); // 接続文字列内のDB名(sanngokudoumei)を使用
  messagesCol = db.collection("messages");
  boardsCol = db.collection("boards");
  console.log("✅ MongoDB接続成功");

  await loadFromDB();

  server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
}

main().catch(err => {
  console.error("❌ 起動失敗:", err);
  process.exit(1);
});
