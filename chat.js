// chat.js（通知機能なし）

const socket = io("https://sanngokudoumei.onrender.com", {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000
});

let room = '';
let userId = Math.floor(Math.random() * 1000);
let userName = localStorage.getItem('chatUserName') || '名無しさん';

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

// 最近の部屋管理
function getRecentRooms() {
  return JSON.parse(localStorage.getItem('recentRooms') || '[]');
}
function addRecentRoom(r) {
  let rooms = getRecentRooms();
  rooms = rooms.filter(x => x !== r);
  rooms.unshift(r);
  if (rooms.length > 5) rooms.pop();
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
    btn.onclick = () => homeRoomInput.value = r;
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
    if (data.fileType && data.fileType.startsWith('image')) {
      content = `<span class="text">${data.name}${id}:</span>
                 <img src="${data.file}" style="max-width:200px; display:block; margin-top:5px;">`;
    } else {
      content = `<span class="text">${data.name}${id}:</span>
                 <a href="${data.file}" download>ファイルをダウンロード</a>`;
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
function joinRoom(r, name) {
  room = r;
  userName = name || userName;
  localStorage.setItem('chatUserName', userName);
  addRecentRoom(r);
  home.style.display = 'none';
  chatContainer.style.display = 'block';
  socket.emit('joinRoom', room);
}

// 自動復元
window.addEventListener('load', () => {
  const lastRoom = localStorage.getItem('chatLastRoom');
  const lastName = localStorage.getItem('chatUserName');
  if (lastRoom) {
    homeRoomInput.value = lastRoom;
    nameInput.value = lastName || '名無しさん';
    joinRoom(lastRoom, lastName);
  }
});

// 入室ボタン
joinBtn.addEventListener('click', () => {
  const r = homeRoomInput.value.trim();
  if (!r) return alert('部屋名を入力してください');
  joinRoom(r, nameInput.value);
});

// 送信ボタン
sendBtn.addEventListener('click', () => {
  const msg = messageInput.value.trim();
  const name = nameInput.value.trim() || userName;
  localStorage.setItem('chatUserName', name);
  const file = fileInput.files[0];

  if (!msg && !file) return;

  if (file) {
    const reader = new FileReader();
    reader.onload = () => {
      socket.emit('message', {
        room,
        id: userId,
        name,
        file: reader.result,
        fileType: file.type,
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
      time: new Date().toLocaleTimeString()
    });
  }

  messageInput.value = '';
  fileInput.value = '';
});

// 過去メッセージ
socket.on('history', msgs => msgs.forEach(addMessage));

// 新規メッセージ
socket.on('message', addMessage);

// 保存最後の部屋
socket.on('connect', () => {
  if (room) localStorage.setItem('chatLastRoom', room);
});

updateRecentRooms();
