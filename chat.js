const socket = io();
let username = "";
let currentRoom = "";

const roomInput = document.getElementById("roomInput");
const joinBtn = document.getElementById("joinBtn");
const nameInput = document.getElementById("nameInput");
const messagesEl = document.getElementById("messages");
const form = document.getElementById("form");
const input = document.getElementById("input");
const fileInput = document.getElementById("fileInput");

// 履歴受信
socket.on("history", (history) => {
  messagesEl.innerHTML = "";
  history.forEach(renderMessage);
});

// 新規メッセージ受信
socket.on("chat message", renderMessage);

// 部屋入室
joinBtn.onclick = () => {
  const room = roomInput.value.trim();
  if (!room) return alert("部屋名を入力してください");
  currentRoom = room;
  username = nameInput.value.trim();
  socket.emit("joinRoom", room);
  messagesEl.innerHTML = "";
};

// メッセージ送信
form.addEventListener("submit", (e) => {
  e.preventDefault();
  const text = input.value;
  if (!text && !fileInput.files[0]) return;

  const file = fileInput.files[0];

  if (file) {
    const reader = new FileReader();
    reader.onload = (ev) => {
      socket.emit("chat message", {
        name: username,
        msg: text,
        file: ev.target.result,
        fileType: file.type
      });
    };
    reader.readAsDataURL(file);
  } else {
    socket.emit("chat message", {
      name: username,
      msg: text
    });
  }

  input.value = "";
  fileInput.value = "";
});

// メッセージ描画
function renderMessage(data) {
  const li = document.createElement("li");
  let content = `<span class="name">${data.name || "???"}</span>
                 <span class="time">${data.time || ""}</span>`;
  if (data.msg) content += `: ${data.msg}`;
  if (data.file && data.fileType) {
    if (data.fileType.startsWith("image")) {
      content += `<br><img src="${data.file}" style="max-width:200px;">`;
    } else if (data.fileType.startsWith("video")) {
      content += `<br><video controls preload="metadata" style="max-width:300px; display:block; margin-top:5px;">
                    <source src="${data.file}" type="${data.fileType}">
                  </video>`;
    }
  }
  li.innerHTML = content;
  messagesEl.appendChild(li);
}
