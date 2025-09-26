const socket = io('https://sanngokudoumei.onrender.com');
let userId = Date.now();
let currentRoom = null;

const home = document.getElementById('home');
const joinBtn = document.getElementById('joinBtn');
const homeRoomInput = document.getElementById('homeRoomInput');
const chatContainer = document.getElementById('chatContainer');
const chat = document.getElementById('chat');
const nameInput = document.getElementById('nameInput');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const fileInput = document.getElementById('fileInput');

joinBtn.onclick = () => {
  const room = homeRoomInput.value.trim();
  if (!room) return alert('部屋名を入力してください');
  currentRoom = room;
  socket.emit('joinRoom', room);
  home.style.display = 'none';
  chatContainer.style.display = 'block';
  chat.innerHTML = '';
};

sendBtn.onclick = sendMessage;
messageInput.onkeydown = e => e.key === 'Enter' && sendMessage();

function sendMessage() {
  let content = messageInput.value.trim();
  let type = 'text';

  if (fileInput.files.length > 0) {
    const file = fileInput.files[0];
    const form = new FormData();
    form.append('file', file);
    fetch('/upload', { method: 'POST', body: form })
      .then(res => res.json())
      .then(data => {
        socket.emit('message', { id: userId, name: nameInput.value, type: file.type.startsWith('image') ? 'image' : 'video', content: data.url });
      });
    fileInput.value = '';
  }

  if (content) {
    socket.emit('message', { id: userId, name: nameInput.value, type, content });
    messageInput.value = '';
  }
}

socket.on('history', msgs => msgs.forEach(addMessage));
socket.on('message', addMessage);

function addMessage(msg) {
  const div = document.createElement('div');
  div.className = 'message';
  div.innerHTML = `<span class="number">${msg.id}</span><span class="name">${msg.name}</span><span class="time">${msg.time}</span>: `;
  if (msg.type === 'text') div.innerHTML += msg.content;
  else if (msg.type === 'image') div.innerHTML += `<br><img src="${msg.content}" style="max-width:200px;">`;
  else if (msg.type === 'video') div.innerHTML += `<br><video src="${msg.content}" controls style="max-width:200px;"></video>`;
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
}
