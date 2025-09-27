// Renderのデプロイ先に合わせてURL変更
const socket = io("https://sanngokudoumei.onrender.com");

const joinBtn = document.getElementById("joinBtn");
const roomInput = document.getElementById("homeRoomInput"); // ← HTMLと一致させる
const nameInput = document.getElementById("nameInput");
const msgInput = document.getElementById("msgInput");
const sendBtn = document.getElementById("sendBtn");
const chatArea = document.getElementById("chat");
const fileInput = document.getElementById("fileInput");

let currentRoom = "";

// メッセージ表示
function renderMessage(msg) {
  const div = document.createElement("div");
  div.className = "message";

  if (msg.type === "system") {
    div.style.color = "gray";
    div.textContent = msg.msg;
  } else if (msg.type === "text") {
    div.innerHTML = `<span class="name">${msg.name}</span>
                     <span class="time">${msg.time}</span>: ${msg.msg}`;
  } else if (msg.type === "image") {
    div.innerHTML = `<span class="name">${msg.name}</span>
                     <span class="time">${msg.time}</span>:<br>
                     <img src="${msg.msg}" style="max-width:200px;">`;
  }
  chatArea.appendChild(div);
  chatArea.scrollTop = chatArea.scrollHeight;
}

// 履歴
socket.on("history", (msgs) => {
  chatArea.innerHTML = "";
  msgs.forEach(renderMessage);
});

// 新規メッセージ
socket.on("message", renderMessage);

// 入室
joinBtn.onclick = () => {
  const room = roomInput.value.trim();
  if (!room) return alert("部屋名を入力してください");
  currentRoom = room;
  socket.emit("joinRoom", room);
  document.getElementById("home").style.display = "none";
  document.getElementById("chatContainer").style.display = "block";
};

// 送信
sendBtn.onclick = () => {
  const text = msgInput.value.trim();
  const name = nameInput.value.trim() || "名無しさん";
  const file = fileInput.files[0];

  if (file) {
    const reader = new FileReader();
    reader.onload = () => {
      socket.emit("message", {
        type: "image",
        name,
        msg: reader.result
      });
    };
    reader.readAsDataURL(file);
  } else if (text) {
    socket.emit("message", {
      type: "text",
      name,
      msg: text
    });
  }

  msgInput.value = "";
  fileInput.value = "";
};
