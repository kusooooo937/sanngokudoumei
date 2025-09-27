const socket = io("https://sanngokudoumei.onrender.com"); // RenderサーバーURL

const home = document.getElementById("home");
const chatContainer = document.getElementById("chatContainer");
const joinBtn = document.getElementById("joinBtn");
const homeRoomInput = document.getElementById("homeRoomInput");
const recentRoomsDiv = document.getElementById("recentRooms");
const backHome = document.getElementById("backHome");

const chat = document.getElementById("chat");
const nameInput = document.getElementById("nameInput");
const messageInput = document.getElementById("messageInput");
const fileInput = document.getElementById("fileInput");
const sendBtn = document.getElementById("sendBtn");

let room = '';
let userId = Math.floor(Math.random() * 1000); // 仮ID
let userName = '名無しさん';

const recentRooms = JSON.parse(localStorage.getItem('recentRooms') || '[]');

// 最近入室した部屋ボタン表示
function updateRecentRooms() {
  recentRoomsDiv.innerHTML = '';
  recentRooms.forEach(r => {
    const btn = document.createElement('button');
    btn.textContent = r;
    btn.onclick = () => joinRoom(r);
    recentRoomsDiv.appendChild(btn);
  });
}
updateRecentRooms();

function addRecentRoom(r) {
  if (!recentRooms.includes(r)) recentRooms.unshift(r);
  if (recentRooms.length > 5) recentRooms.pop();
  localStorage.setItem('recentRooms', JSON.stringify(recentRooms));
  updateRecentRooms();
}

// メッセージ表示
function addMessage(data) {
  const id = data.id ? `#${data.id}` : '';
  const div = document.createElement('div');
  div.className = 'message';
  let content = '';
  if (data.type === 'system') {
    content = `<i>${data.msg}</i>`;
  } else if (data.file) {
    content = `<span class="name">${data.name}${id}:</span>
               <img src="${data.file}" style="max-width:200px; display:block; margin-top:5px;">`;
  } else {
    content = `<span class="name">${data.name}${id}</span>
               <span class="time">${data.time}</span>: 
               <span class="text">${data.msg}</span>`;
  }
  div.innerHTML = content;
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
}

// 部屋入室処理
function joinRoom(r) {
  room = r;
  home.style.display = 'none';
  chatContainer.style.display = 'block';
  socket.emit('join', { room, name: nameInput.value || userName, id: userId });
  addRecentRoom(r);
}

// 入室ボタン
joinBtn.onclick = () => {
  const r = homeRoomInput.value.trim();
  if (!r) return alert('部屋名を入力してください');
  joinRoom(r);
};

// メッセージ送信
sendBtn.onclick = () => {
  const msg = messageInput.value.trim();
  const file = fileInput.files[0];
  if (!msg && !file) return;

  let name = nameInput.value.trim() || userName;

  if (file) {
    const reader = new FileReader();
    reader.onload = () => {
      socket.emit('message', {
        room,
        id: userId,
        name,
        file: reader.result,
        fileType: file.type,
        type: 'file',
        time: new Date().toLocaleTimeString()
      });
    };
    reader.readAsDataURL(file);
  } else {
    socket.emit('message', {
      room,
      id: userId,
      name,
      msg,
      type: 'text',
      time: new Date().toLocaleTimeString()
    });
  }

  messageInput.value = '';
  fileInput.value = '';
};

// 戻るボタン
backHome.onclick = (e) => {
  e.preventDefault();
  chatContainer.style.display = 'none';
  home.style.display = 'flex';
};

// 履歴受信
socket.on('history', msgs => msgs.forEach(addMessage));
// 新規メッセージ受信
socket.on('message', addMessage);
// 入室メッセージ
socket.on('system', addMessage);
