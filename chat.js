const socket = io("https://sanngokudoumei.onrender.com");

const joinBtn = document.getElementById("joinBtn");
const homeRoomInput = document.getElementById("homeRoomInput");
const nameInput = document.getElementById("nameInput");
const messageInput = document.getElementById("messageInput");
const fileInput = document.getElementById("fileInput");
const sendBtn = document.getElementById("sendBtn");
const chat = document.getElementById("chat");
const home = document.getElementById("home");
const chatContainer = document.getElementById("chatContainer");

let room = "";
let userId = Math.floor(Math.random() * 1000);
let userName = "名無しさん";

function addMessage(data) {
  const id = data.id ? `#${data.id}` : "";
  const div = document.createElement("div");
  div.className = "message";

  let content = "";
  if (data.type === "system") {
    content = `<i>${data.msg}</i>`;
  } else if (data.type === "image" && data.file) {
    content = `<b>${data.name}${id}</b> [${data.time}]<br>
               <img src="${data.file}" style="max-width:200px;">`;
  } else {
    content = `<b>${data.name}${id}</b> [${data.time}]: ${data.msg}`;
  }

  div.innerHTML = content;
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
}

joinBtn.onclick = () => {
  const r = homeRoomInput.value.trim();
  if (!r) return alert("部屋名を入力してください");
  room = r;
  home.style.display = "none";
  chatContainer.style.display = "block";
  socket.emit("joinRoom", room);
};

sendBtn.onclick = () => {
  const msg = messageInput.value.trim();
  const file = fileInput.files[0];

  if (!msg && !file) return;

  let name = nameInput.value.trim() || userName;

  if (file) {
    const reader = new FileReader();
    reader.onload = () => {
      socket.emit("message", {
        room,
        name,
        file: reader.result,
        fileType: file.type,
      });
    };
    reader.readAsDataURL(file);
  } else {
    socket.emit("message", { room, name, msg });
  }

  messageInput.value = "";
  fileInput.value = "";
};

socket.on("history", (msgs) => msgs.forEach(addMessage));
socket.on("message", addMessage);
