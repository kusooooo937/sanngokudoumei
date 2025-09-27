// Render のサーバーURLに接続
const socket = io("https://sanngokudoumei.onrender.com");

const roomInput = document.getElementById("roomInput");
const nameInput = document.getElementById("nameInput");
const messageInput = document.getElementById("messageInput");
const fileInput = document.getElementById("fileInput");
const joinBtn = document.getElementById("joinBtn");
const sendBtn = document.getElementById("sendBtn");
const chatContainer = document.getElementById("chatContainer");
const home = document.getElementById("home");
const chatArea = document.getElementById("chat");

let currentRoom = "";
let userId = Math.floor(Math.random() * 1000);

// メッセージ表示
function addMessage(data) {
  const id = data.id ? `#${data.id}` : "";
  const div = document.createElement("div");
  div.className = "message";
  let content = "";

  if (data.type === "system") {
    content = `<i>${data.msg}</i>`;
  } else if (data.type === "image" && data.msg) {
    content = `<b>${data.name}${id}</b> [${data.time}]: <br>
               <img src="${data.msg}" style="max-width:200px;">`;
  } else if (data.type === "video" && data.msg) {
    content = `<b>${data.name}${id}</b> [${data.time}]: <br>
               <video src="${data.msg}" controls style="max-width:200px;"></video>`;
  } else {
    content = `<b>${data.name}${id}</b> [${data.time}]: ${data.msg}`;
  }

  div.innerHTML = content;
  chatArea.appendChild(div);
  chatArea.scrollTop = chatArea.scrollHeight;
}

// 入室
joinBtn.onclick = () => {
  const room = roomInput.value.trim();
  if (!room) return alert("部屋名を入力してください");
  currentRoom = room;
  home.style.display = "none";
  chatContainer.style.display = "block";

  const name = nameInput.value.trim() || "名無しさん";
  socket.emit("joinRoom", { room, name });
};

// 送信
sendBtn.onclick = () => {
  const name = nameInput.value.trim() || "名無しさん";
  const msg = messageInput.value.trim();
  const file = fileInput.files[0];

  if (!msg && !file) return;

  if (file) {
    const reader = new FileReader();
    reader.onload = () => {
      const type = file.type.startsWith("image") ? "image" : "video";
      socket.emit("message", {
        room: currentRoom,
        name,
        file: reader.result,
        fileType: file.type,
        type
      });
    };
    reader.readAsDataURL(file);
  } else {
    socket.emit("message", { room: currentRoom, name, msg, type: "text" });
  }

  messageInput.value = "";
  fileInput.value = "";
};

// 過去メッセージ受信
socket.on("history", (msgs) => msgs.forEach(addMessage));
// 新規メッセージ受信
socket.on("message", addMessage);
