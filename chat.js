const socket = io("https://sanngokudoumei.onrender.com"); // Render URLに置き換え

let room = "";
let userId = Math.floor(Math.random() * 1000);
let userName = "名無しさん";

const chat = document.getElementById("chat");
const home = document.getElementById("home");
const chatContainer = document.getElementById("chatContainer");
const joinBtn = document.getElementById("joinBtn");
const homeRoomInput = document.getElementById("homeRoomInput");
const nameInput = document.getElementById("nameInput");
const messageInput = document.getElementById("messageInput");
const fileInput = document.getElementById("fileInput");
const sendBtn = document.getElementById("sendBtn");

// メッセージ表示
function addMessage(data) {
  const id = data.id ? `#${data.id}` : "";
  const div = document.createElement("div");
  div.className = "message";
  let content = "";

  if (data.type === "system") {
    content = `<i>${data.msg}</i>`;
  } else if (data.file) {
    if (data.fileType.startsWith("image")) {
      content = `<b>${data.name}${id}</b> [${data.time}]:<br>
                 <img src="${data.file}" style="max-width:200px;">`;
    }
  } else {
    content = `<b>${data.name}${id}</b> [${data.time}]: ${data.msg}`;
  }

  div.innerHTML = content;
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
}

// 部屋入室
joinBtn.addEventListener("click", () => {
  const r = homeRoomInput.value.trim();
  if (!r) return alert("部屋名を入力してください");
  room = r;
  home.style.display = "none";
  chatContainer.style.display = "block";
  socket.emit("joinRoom", room);
});

// メッセージ送信
sendBtn.addEventListener("click", () => {
  const msg = messageInput.value.trim();
  const file = fileInput.files[0];
  let name = nameInput.value.trim() || userName;

  if (file) {
    const reader = new FileReader();
    reader.onload = () => {
      socket.emit("message", {
        room,
        id: userId,
        name,
        file: reader.result,
        fileType: file.type,
        type: "file",
        time: new Date().toLocaleTimeString(),
      });
    };
    reader.readAsDataURL(file);
  } else if (msg) {
    socket.emit("message", {
      room,
      id: userId,
      name,
      msg,
      type: "text",
      time: new Date().toLocaleTimeString(),
    });
  }

  messageInput.value = "";
  fileInput.value = "";
});

// 過去メッセージ受信
socket.on("history", (msgs) => msgs.forEach(addMessage));

// 新規メッセージ受信
socket.on("message", addMessage);
