let socket = io('https://sanngokudoumei.onrender.com'); // あなたのサーバーURL
let currentRoom = null;

const chat = document.getElementById('chat');
const home = document.getElementById('home');
const chatContainer = document.getElementById('chatContainer');
const joinBtn = document.getElementById('joinBtn');
const homeRoomInput = document.getElementById('homeRoomInput');
const nameInput = document.getElementById('nameInput');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const fileInput = document.getElementById('fileInput');

// 入室
joinBtn.addEventListener('click', () => {
  const room = homeRoomInput.value.trim();
  if (!room) return alert('部屋名を入力してください');
  currentRoom = room;
  socket.emit('joinRoom', currentRoom);
  home.style.display = 'none';
  chatContainer.style.display = 'block';
  chat.innerHTML = '';
});

// メッセージ送信
sendBtn.addEventListener('click', () => {
  const name = nameInput.value.trim();
  const text = messageInput.value.trim();
  if (!name || (!text && fileInput.files.length === 0)) return;

  const msgData = { room: currentRoom, name, text, time: new Date().toLocaleTimeString() };

  if (fileInput.files.length > 0) {
    const file = fileInput.files[0];
    const reader = new FileReader();
    reader.onload = () => {
      msgData.file = reader.result;
      socket.emit('chatMessage', msgData);
    };
    reader.readAsDataURL(file);
  } else {
    socket.emit('chatMessage', msgData);
  }

  messageInput.value = '';
  fileInput.value = '';
});

// メッセージ受信
function appendMessage(data) {
  const div = document.createElement('div');
  div.className = 'message';
  let content = `<span class="time">[${data.time}]</span> <span class="name">${data.name}:</span> `;
  if (data.text) content += data.text;
  if (data.file) {
    if (data.file.startsWith('data:image')) {
      content += `<br><img src="${data.file}" style="max-width:200px;">`;
    } else if (data.file.startsWith('data:video')) {
      content += `<br><video src="${data.file}" controls style="max-width:300px;"></video>`;
    }
  }
  div.innerHTML = content;
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
}

socket.on('chatMessage', appendMessage);
socket.on('chatHistory', (messages) => messages.forEach(appendMessage));
