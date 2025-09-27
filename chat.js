const socket = io("https://sanngokudoumei.onrender.com");

const joinBtn = document.getElementById("joinBtn");
const homeRoomInput = document.getElementById("homeRoomInput");
const nameInput = document.getElementById("nameInput");
const messageInput = document.getElementById("messageInput");
const fileInput = document.getElementById("fileInput");
const sendBtn = document.getElementById("sendBtn");
const home = document.getElementById("home");
const chatContainer = document.getElementById("chatContainer");
const chat = document.getElementById("chat");

let room = '';
let userName = '名無しさん';

// メッセージ表示
function addMessage(data) {
  const div = document.createElement("div");
  div.className = 'message';
  if (data.type === 'system') {
    div.innerHTML = `<i style="color:gray;">${data.msg}</i>`;
  } else if (data.type === 'image') {
    div.innerHTML = `<b>${data.name}</b> [${data.time}]:<br>
                     <img src="${data.msg}" style="max-width:200px;">`;
  } else {
    div.innerHTML = `<b>${data.name}</b> [${data.time}]: ${data.msg}`;
  }
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
}

// 部屋入室
joinBtn.addEventListener("click", () => {
  const r = homeRoomInput.value.trim();
  if (!r) return alert("部屋名を入力してください");
  room = r;
  userName = nameInput.value.trim() || userName;
  socket.emit("joinRoom", { room, name: userName });
  home.style.display = "none";
  chatContainer.style.display = "block";
});

// 送信
sendBtn.addEventListener("click", async () => {
  const msg = messageInput.value.trim();
  const file = fileInput.files[0];
  if (!msg && !file) return;

  if (file) {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("https://sanngokudoumei.onrender.com/upload", {
      method: "POST",
      body: formData
    });
    const data = await res.json();
    socket.emit("message", { name: userName, msg: data.url, type: "image" });
  } else {
    socket.emit("message", { name: userName, msg, type: "text" });
  }

  messageInput.value = "";
  fileInput.value = "";
});

// 過去メッセージ
socket.on("history", (msgs) => msgs.forEach(addMessage));
// 新規メッセージ
socket.on("message", addMessage);
