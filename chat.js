const socket = io("https://sanngokudoumei.onrender.com/");

const chatDiv = document.getElementById("chat");
const roomInput = document.getElementById("roomInput");
const nameInput = document.getElementById("nameInput");
const messageInput = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");

let currentRoom = "main";
let messageCount = 0;

// 部屋に入る
function joinRoom() {
  chatDiv.innerHTML = "";
  messageCount = 0;
  currentRoom = roomInput.value.trim() || "main";
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

// サーバーから過去ログ受信
socket.on("chat history", (history) => {
  chatDiv.innerHTML = "";
  messageCount = 0;
  history.forEach(data => addMessage(data));
});

// サーバーから新規メッセージ受信
socket.on("chat message", (data) => {
  addMessage(data);
});

// メッセージを表示する共通処理
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

// 最初はmain部屋に入る
joinRoom();
