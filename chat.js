const socket = io("https://sanngokudoumei.onrender.com/"); // サーバーURL

const homeDiv = document.getElementById("home");
const joinBtn = document.getElementById("joinBtn");
const chatContainer = document.getElementById("chatContainer");

const chatDiv = document.getElementById("chat");
const nameInput = document.getElementById("nameInput");
const messageInput = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");

let currentRoom = "main";
let messageCount = 0;

// ホーム画面の入室ボタン
joinBtn.addEventListener("click", () => {
  const room = document.getElementById("homeRoomInput").value.trim() || "main";
  currentRoom = room;

  homeDiv.style.display = "none";
  chatContainer.style.display = "block";

  joinRoom();
});

// 部屋に入る処理
function joinRoom() {
  chatDiv.innerHTML = "";
  messageCount = 0;
  socket.emit("join room", currentRoom);

  const div = document.createElement("div");
  div.innerHTML = `<em>▶ 部屋「${currentRoom}」に入室しました</em>`;
  chatDiv.appendChild(div);
}

// メッセージ送信
sendBtn.addEventListener("click", () => {
  const name = nameInput.value.trim() || "名無しさん";
  const msg = messageInput.value.trim();
  if (msg !== "") {
    socket.emit("chat message", { room: currentRoom, name, msg });
    messageInput.value = "";
  }
});

// 過去ログ受信
socket.on("chat history", (history) => {
  chatDiv.innerHTML = "";
  messageCount = 0;
  history.forEach(data => addMessage(data));
});

// 新規メッセージ受信
socket.on("chat message", (data) => {
  addMessage(data);
});

// メッセージ表示
function addMessage(data) {
  messageCount++;
  const div = document.createElement("div");
  div.className = "message";

  const date = new Date(data.time || Date.now());
  const time = `${date.getHours()}:${String(date.getMinutes()).padStart(2,'0')}`;

  div.innerHTML = `<span class="number">No.${messageCount}</span>
                   <span class="name">${data.name}</span>
                   ${data.msg}
                   <span class="time">(${time})</span>`;
  chatDiv.appendChild(div);
  chatDiv.scrollTop = chatDiv.scrollHeight;
}
