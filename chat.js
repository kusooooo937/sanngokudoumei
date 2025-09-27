const socket = io('https://sanngokudoumei.onrender.com');

let room = '';
let userId = Math.floor(Math.random() * 1000);

const chat = document.getElementById('chat');
const home = document.getElementById('home');
const chatContainer = document.getElementById('chatContainer');
const joinBtn = document.getElementById('joinBtn');
const homeRoomInput = document.getElementById('homeRoomInput');
const nameInput = document.getElementById('nameInput');
const messageInput = document.getElementById('messageInput');
const fileInput = document.getElementById('fileInput');
const sendBtn = document.getElementById('sendBtn');

function addMessage(data) {
  const id = data.id ? `#${data.id}` : '';
  const div = document.createElement('div');
  div.className = 'message';
  let content = '';

  if (data.type === 'system') {
    content = `<i>${data.msg}</i>`;
  } else if (data.file) {
    if (data.fileType.startsWith('image')) {
      content = `<b>${data.name}${id}</b> [${data.time}]:<br>
                 <img src="${data.file}" style="max-width:200px;">`;
    } else if (data.fileType.startsWith('video')) {
      content = `<b>${data.name}${id}</b> [${data.time}]:<br>
                 <video src="${data.file}" controls style="max-width:200px;"></video>`;
    }
  } else {
    content = `<b>${data.name}${id}</b> [${data.time}]: ${data.msg}`;
  }

  div.innerHTML = content;
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
}

joinBtn.addEventListener('click', () => {
  const r = homeRoomInput.value.trim();
  if (!r) return alert('部屋名を入力してください');
  room = r;
  home.style.display = 'none';
  chatContainer.style.display = 'block';
  socket.emit('join', { room, name: nameInput.value || '名無しさん', id: userId });
});

sendBtn.addEventListener('click', () => {
  const name = nameInput.value.trim() || '名無しさん';
  const msg = messageInput.value.trim();
  const file = fileInput.files[0];

  if (!msg && !file) return;

  if (file) {
    const reader = new FileReader();
    reader.onload = () => {
      socket.emit('message', {
        room,
        name,
        file: reader.result,
        fileType: file.type,
        type: file.type.startsWith('image') ? 'image' : 'video'
      });
    };
    reader.readAsDataURL(file);
  } else {
    socket.emit('message', { room, name, msg, type: 'text' });
  }

  messageInput.value = '';
  fileInput.value = '';
});

socket.on('history', msgs => msgs.forEach(addMessage));
socket.on('message', addMessage);
