const socket = io("https://sanngokudoumei.onrender.com");

const joinBtn = document.getElementById("joinBtn");
const homeRoomInput = document.getElementById("homeRoomInput");
const chatContainer = document.getElementById("chatContainer");
const nameInput = document.getElementById("nameInput");
const messageInput = document.getElementById("messageInput");
const fileInput = document.getElementById("fileInput");
const sendBtn = document.getElementById("sendBtn");
const chatArea = document.getElementById("chat");

let room = '';
let userId = Math.floor(Math.random() * 1000);
let userName = '名無しさん';

joinBtn.addEventListener('click', () => {
  const r = homeRoomInput.value.trim();
  if (!r) return alert('部屋名を入力してください');
  room = r;
  home.style.display = 'none';
  chatContainer.style.display = 'block';
  socket.emit('joinRoom', room);
});

sendBtn.addEventListener('click', async () => {
  const msg = messageInput.value.trim();
  const file = fileInput.files[0];
  let name = nameInput.value.trim() || userName;

  if (file) {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('https://sanngokudoumei.onrender.com/upload', {
      method: 'POST',
      body: formData
    });
    const data = await res.json();
    socket.emit('message', { name, msg: data.url, type: 'image' });
  } else if (msg) {
    socket.emit('message', { name, msg, type: 'text' });
  }

  messageInput.value = '';
  fileInput.value = '';
});

socket.on('history', msgs => msgs.forEach(addMessage));
socket.on('message', addMessage);

function addMessage(data) {
  const id = data.id ? `#${data.id}` : '';
  const div = document.createElement('div');
  div.className = 'message';

  if (data.type === 'system') {
    div.innerHTML = `<i>${data.msg}</i>`;
  } else if (data.type === 'image') {
    div.innerHTML = `<span class="name">${data.name}${id}</span>
                     <span class="time">${data.time}</span><br>
                     <img src="${data.msg}" style="max-width:200px;">`;
  } else {
    div.innerHTML = `<span class="name">${data.name}${id}</span>
                     <span class="time">${data.time}</span>: 
                     <span class="text">${data.msg}</span>`;
  }

  chatArea.appendChild(div);
  chatArea.scrollTop = chatArea.scrollHeight;
}
