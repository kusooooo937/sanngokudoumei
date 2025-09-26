const socket = io("https://sanngokudoumei.onrender.com/");

const chatDiv = document.getElementById("chat");
const roomInput = document.getElementById("roomInput");
const nameInput = document.getElementById("nameInput");
const messageInput = document.getElementById("messageInput");
const fileInput = document.getElementById("fileInput");
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

  if (fileInput.files.length > 0) {
    // ファイル送信
    const formData = new FormData();
    formData.append("file", fileInput.files[0]);
    formData.append("name", name);
    formData.append("room", currentRoom);

    fetch("/upload", { method: "POST", body: formData })
      .then(res => res.json())
      .then(data => {
        socket.emit("chat message", {
          room: currentRoom,
          name,
          msg,
          file: data.url
        });
      });

    fileInput.value = "";
  } else if (msg !== "") {
    // テキストのみ送信
    socket.emit("chat message", {
      room: currentRoom,
      name,
      msg,
      file: null
    });
  }

  messageInput.value = "";
});

// サーバーから過去ログ受信
socket.on("chat history", (history) => {
  chatDiv.innerHTML = "";
  messageCount = 0;
  history.forEach(data => addMessage(data));
});

// サーバーから新規メッセージ受信
socket.on("chat message", (data) => addMessage(data));

// メッセージを表示する共通処理
function addMessage(data) {
  messageCount++;
  const div = document.createElement("div");
  div.className = "message";

  let content = data.msg;

  if (data.file) {
    if (data.file.match(/\.(jpg|jpeg|png|gif)$/i)) {
      content += `<br><img src="${data.file}" style="max-width:200px;">`;
    } else if (data.file.match(/\.(mp4|webm|ogg)$/i)) {
      content += `<br><video src="${data.file}" controls style="max-width:200px;"></video>`;
    }
  }

  const date = new Date(data.time || Date.now());
  const time = `${date.getHours()}:${String(date.getMinutes()).padStart(2,'0')}`;

  div.innerHTML = `<span class="number">No.${messageCount}</span>
                   <span class="name">${data.name}</span>
                   ${content}
                   <span class="time">(${time})</span>`;
  chatDiv.appendChild(div);
  chatDiv.scrollTop = chatDiv.scrollHeight;
}

// 最初は main 部屋に入る
joinRoom();
