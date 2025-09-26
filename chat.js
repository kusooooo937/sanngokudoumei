const socket = io("https://sanngokudoumei.onrender.com/"); // サーバーURL

const homeDiv = document.getElementById("home");
const joinBtn = document.getElementById("joinBtn");
const chatContainer = document.getElementById("chatContainer");

const chatDiv = document.getElementById("chat");
const nameInput = document.getElementById("nameInput");
const messageInput = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");

let currentRoom = "main";
let messageCount = 0;

// ホーム画面の入室ボタン
joinBtn.addEventListener("click", () => {
  const room = document.getElementById("homeRoomInput").value.trim() || "main";
  currentRoom = room;

  homeDiv.style.display = "none";
  chatContainer.style.display = "block";

  joinRoom();
});

// 部屋に入る処理
function joinRoom() {
  chatDiv.innerHTML = "";
  messageCount = 0;
  socket.emit("join room", currentRoom);

  const div = document.createElement("div");
  div.innerHTML = `<em>▶ 部屋「${currentRoom}」に入室しました</em>`;
  chatDiv.appendChild(div);
}

const fileInput = document.getElementById("fileInput");

// メッセージ送信
sendBtn.addEventListener("click", async () => {
  const name = nameInput.value.trim() || "名無しさん";
  const msg = messageInput.value.trim();

  let fileUrl = null;

  // ファイルが選択されていたらアップロード
  if (fileInput.files.length > 0) {
    const formData = new FormData();
    formData.append("file", fileInput.files[0]);

    const res = await fetch("/upload", { method: "POST", body: formData });
    const data = await res.json();
    fileUrl = data.url;

    fileInput.value = ""; // 選択をクリア
  }

  socket.emit("chat message", { room: currentRoom, name, msg, fileUrl });
  messageInput.value = "";
});

// メッセージ表示
function addMessage(data) {
  messageCount++;
  const div = document.createElement("div");
  div.className = "message";

  const date = new Date(data.time || Date.now());
  const time = `${date.getHours()}:${String(date.getMinutes()).padStart(2,'0')}`;

  div.innerHTML = `<span class="number">No.${messageCount}</span>
                   <span class="name">${data.name}</span>
                   ${data.msg}
                   <span class="time">(${time})</span>`;

  // ファイルがある場合は表示
  if (data.fileUrl) {
    if (data.fileUrl.match(/\.(mp4|webm|ogg)$/)) {
      div.innerHTML += `<br><video src="${data.fileUrl}" controls width="300"></video>`;
    } else {
      div.innerHTML += `<br><img src="${data.fileUrl}" style="max-width:300px;">`;
    }
  }

  chatDiv.appendChild(div);
  chatDiv.scrollTop = chatDiv.scrollHeight;
}
