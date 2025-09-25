// 🌍 Render の URLにする
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

sendBtn.addEventListener("click", () => {
  const name = nameInput.value.trim() || "名無しさん";
  const msg = messageInput.value.trim();
  if (msg !== "") {
    // ✅ サーバーと同じ形式で送る
    socket.emit("chat message", { room: currentRoom, name, msg });
    messageInput.value = "";
  }
});

// サーバーから受信
socket.on("chat message", (data) => {
  messageCount++;
  const div = document.createElement("div");
  div.className = "message";
  const now = new Date();
  const time = `${now.getHours()}:${String(now.getMinutes()).padStart(2,'0')}`;
  div.innerHTML = `<span class="number">No.${messageCount}</span>
                   <span class="name">${data.name}</span>
                   ${data.msg}
                   <span class="time">(${time})</span>`;
  chatDiv.appendChild(div);
  chatDiv.scrollTop = chatDiv.scrollHeight;
});

// 最初はmain部屋に入る
joinRoom();
