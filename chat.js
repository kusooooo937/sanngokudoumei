// chat.js

const socket = io("https://sanngokudoumei.onrender.com"); // RenderデプロイURL

let room = '';
let userId = Math.floor(Math.random() * 1000); // 仮ID
let userName = '名無しさん';

const chat = document.getElementById('chat');
const home = document.getElementById('home');
const chatContainer = document.getElementById('chatContainer');
const joinBtn = document.getElementById('joinBtn');
const homeRoomInput = document.getElementById('homeRoomInput');
const nameInput = document.getElementById('nameInput');
const messageInput = document.getElementById('messageInput');
const fileInput = document.getElementById('fileInput');
const sendBtn = document.getElementById('sendBtn');
const recentRoomsDiv = document.getElementById('recentRooms');

// 最近使った部屋をLocalStorageで管理
function getRecentRooms() {
  return JSON.parse(localStorage.getItem('recentRooms') || '[]');
}

function addRecentRoom(r) {
  let rooms = getRecentRooms();
  rooms = rooms.filter(x => x !== r); // 重複削除
  rooms.unshift(r); // 先頭に追加
  if (rooms.length > 5) rooms.pop(); // 最大5件
  localStorage.setItem('recentRooms', JSON.stringify(rooms));
  updateRecentRooms();
}

function updateRecentRooms() {
  if (!recentRoomsDiv) return;
  const rooms = getRecentRooms();
  recentRoomsDiv.innerHTML = '';
  rooms.forEach(r => {
    const btn = document.createElement('button');
    btn.textContent = r;
    btn.style.margin = '2px';
    btn.onclick = () => {
      homeRoomInput.value = r;
    };
    recentRoomsDiv.appendChild(btn);
  });
}

// メッセージ表示
function addMessage(data) {
  const id = data.id ? `#${data.id}` : '';
  const div = document.createElement('div');
  div.className = 'message';
  let content = '';
  if (data.type === 'system') {
    content = `<span class="text"><i>${data.msg}</i></span>`;
  } else if (data.file) {
    if (data.fileType.startsWith('image')) {
      content = `<span class="text">${data.name}${id}:</span> 
                 <img src="${data.file}" style="max-width:200px; display:block; margin-top:5px;">`;
    }
  } else {
    content = `<span class="name">${data.name}${id}</span>
               <span class="time">${data.time}</span>: 
               <span class="text">${data.msg}</span>`;
  }
  div.innerHTML = content;
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
}

// 部屋入室
joinBtn.addEventListener('click', () => {
  const r = homeRoomInput.value.trim();
  if (!r) return alert('部屋名を入力してください');
  room = r;
  home.style.display = 'none';
  chatContainer.style.display = 'block';
  addRecentRoom(r);

  socket.emit('join', { room, name: nameInput.value || userName, id: userId });
});

// 送信
sendBtn.addEventListener('click', () => {
  const msg = messageInput.value.trim();
  if (!msg && !fileInput.files[0]) return;
  let name = nameInput.value.trim() || userName;
  const file = fileInput.files[0];

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
});

// 過去メッセージ受信
socket.on('history', msgs => {
  msgs.forEach(addMessage);
});

// 新規メッセージ受信
socket.on('message', addMessage);

// 入室メッセージ
socket.on('system', addMessage);

// 初期化
updateRecentRooms();
