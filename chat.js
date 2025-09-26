// chat.js
const socket = io('https://sanngokudoumei.onrender.com');

let room = '';
let userId = Math.floor(Math.random() * 1000);
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

// メッセージを表示
function addMessage(data) {
  const div = document.createElement('div');
  div.className = 'message';

  if (data.type === 'system') {
    div.innerHTML = `<i>${data.msg}</i>`;
  } else if (data.file) {
    if (data.fileType.startsWith('image')) {
      div.innerHTML = `<span class="name">${data.name}#${data.id}</span> 
        <span class="time">${data.time}</span><br>
        <img src="${data.file}" style="max-width:200px;">`;
    } else if (data.fileType.startsWith('video')) {
      div.innerHTML = `<span class="name">${data.name}#${data.id}</span> 
        <span class="time">${data.time}</span><br>
        <video src="${data.file}" controls style="max-width:200px;"></video>`;
    }
  } else {
    div.innerHTML = `<span class="name">${data.name}#${data.id}</span> 
      <span class="time">${data.time}</span>: 
      ${data.msg}`;
  }

  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
}

// 入室
joinBtn.addEventListener('click', () => {
  const r = homeRoomInput.value.trim();
  if (!r) return alert('部屋名を入力してください');
  room = r;

  home.style.display = 'none';
  chatContainer.style.display = 'block';

  socket.emit('join', { room, name: nameInput.value || userName, id: userId });
});

// 送信
sendBtn.addEventListener('click', () => {
  const msg = messageInput.value.trim();
  const file = fileInput.files[0];
  let name = nameInput.value.trim() || userName;

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

// サーバーから受信
socket.on('history', msgs => msgs.forEach(addMessage));
socket.on('message', addMessage);
