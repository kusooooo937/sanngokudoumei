// Render にデプロイしたサーバーURLに差し替える
const socket = io("https://sanngokudoumei.onrender.com");

const joinBtn = document.getElementById("joinBtn");
const roomInput = document.getElementById("roomInput");
const nameInput = document.getElementById("nameInput");
const msgInput = document.getElementById("msgInput");
const sendBtn = document.getElementById("sendBtn");
const chatArea = document.getElementById("chat");

joinBtn.onclick = () => {
  const room = roomInput.value.trim();
  if (!room) return alert("部屋名を入力してください");
  socket.emit("joinRoom", room);
};

sendBtn.onclick = () => {
  const msg = msgInput.value.trim();
  if (!msg) return;
  socket.emit("message", { name: nameInput.value, msg });
  msgInput.value = "";
};

// 画像送信
function sendImage(base64) {
  socket.emit("image", { name: nameInput.value, url: base64 });
}

// 動画送信
function sendVideo(url) {
  socket.emit("video", { name: nameInput.value, url });
}

// 履歴表示
socket.on("history", (msgs) => {
  chatArea.innerHTML = "";
  msgs.forEach(renderMessage);
});

// 新着メッセージ表示
socket.on("message", renderMessage);

function renderMessage(msg) {
  const div = document.createElement("div");
  div.innerHTML = `<b>${msg.name}</b> [${msg.time}] : `;

  if (msg.type === "text") {
    div.innerHTML += msg.msg;
  } else if (msg.type === "image") {
    div.innerHTML += `<br><img src="${msg.msg}" style="max-width:200px;">`;
  } else if (msg.type === "video") {
    div.innerHTML += `<br><video src="${msg.msg}" controls style="max-width:200px;"></video>`;
  } else if (msg.type === "system") {
    div.style.color = "gray";
    div.innerHTML = msg.msg;
  }

  chatArea.appendChild(div);
}
