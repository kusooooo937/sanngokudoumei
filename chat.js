// RenderにデプロイしたサーバーURLに差し替える
const socket = io("https://sanngokudoumei.onrender.com");

const joinBtn = document.getElementById("joinBtn");
const homeRoomInput = document.getElementById("homeRoomInput");
const nameInput = document.getElementById("nameInput");
const messageInput = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");
const fileInput = document.getElementById("fileInput");
const chatArea = document.getElementById("chat");
const recentRoomsContainer = document.getElementById("recentRooms");

let userId = Math.floor(Math.random() * 1000); // 仮ID
let currentRoom = "";
let recentRooms = [];

// メッセージ表示
function renderMessage(data) {
  const div = document.createElement("div");
  div.className = "message";

  let content = "";
  if (data.type === "system") {
    content = `<i>${data.msg}</i>`;
    div.style.color = "gray";
  } else if (data.file) {
    if (data.fileType.startsWith("image")) {
      content = `<b>${data.name}#${data.id}</b> [${data.time}]:<br>
                 <img src="${data.file}" style="max-width:200px; display:block; margin-top:5px;">`;
    } else {
      content = `<b>${data.name}#${data.id}</b> [${data.time}]:<br>Unsupported file`;
    }
  } else {
    content = `<b>${data.name}#${data.id}</b> [${data.time}]: ${data.msg}`;
  }

  div.innerHTML = content;
  chatArea.appendChild(div);
  chatArea.scrollTop = chatArea.scrollHeight;
}

// 最近使った部屋更新
function updateRecentRooms() {
  if (!recentRoomsContainer) return;
  recentRoomsContainer.innerHTML = "";
  recentRooms.forEach(room => {
    const btn = document.createElement("button");
    btn.textContent = room;
    btn.onclick = () => {
      homeRoomInput.value = room;
    };
    recentRoomsContainer.appendChild(btn);
  });
}

// 部屋入室
joinBtn.addEventListener("click", () => {
  const room = homeRoomInput.value.trim();
  if (!room) return alert("部屋名を入力してください");
  currentRoom = room;

  // 最近使った部屋に追加
  if (!recentRooms.includes(room)) {
    recentRooms.unshift(room);
    if (recentRooms.length > 10) recentRooms.pop();
    updateRecentRooms();
  }

  socket.emit("joinRoom", room);
  document.getElementById("home").style.display = "none";
  document.getElementById("chatContainer").style.display = "block";
});

// メッセージ送信
sendBtn.addEventListener("click", () => {
  const msg = messageInput.value.trim();
  const name = nameInput.value.trim() || "名無しさん";
  const file = fileInput.files[0];

  if (!msg && !file) return;

  if (file) {
    const reader = new FileReader();
    reader.onload = () => {
      socket.emit("message", {
        room: currentRoom,
        id: userId,
        name,
        file: reader.result,
        fileType: file.type,
        type: "file",
        time: new Date().toLocaleTimeString()
      });
    };
    reader.readAsDataURL(file);
  } else {
    socket.emit("message", {
      room: currentRoom,
      id: userId,
      name,
      msg,
      type: "text",
      time: new Date().toLocaleTimeString()
    });
  }

  messageInput.value = "";
  fileInput.value = "";
});

// 過去メッセージ受信
socket.on("history", msgs => msgs.forEach(renderMessage));

// 新規メッセージ受信
socket.on("message", renderMessage);

// システムメッセージ受信
socket.on("system", renderMessage);
