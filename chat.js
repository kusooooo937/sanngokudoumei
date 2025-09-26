let socket = io('https://sanngokudoumei.onrender.com');
let chat = document.getElementById('chat');
let sendBtn = document.getElementById('sendBtn');
let messageInput = document.getElementById('messageInput');
let nameInput = document.getElementById('nameInput');
let fileInput = document.getElementById('fileInput');
let home = document.getElementById('home');
let chatContainer = document.getElementById('chatContainer');
let homeRoomInput = document.getElementById('homeRoomInput');
let joinBtn = document.getElementById('joinBtn');

let currentRoom = '';
let anonymousCount = 0;

// 部屋に入る
joinBtn.onclick = () => {
  let room = homeRoomInput.value.trim();
  if(!room) room = 'main';
  currentRoom = room;
  socket.emit('joinRoom', room);
  home.style.display = 'none';
  chatContainer.style.display = 'block';
};

// メッセージ追加
function appendMessage(msg) {
  let div = document.createElement('div');
  div.className = 'message';
  let content = '';
  if(msg.file){
    if(msg.file.type.startsWith('image')){
      content = `<strong class="name">${msg.name}</strong> <span class="time">${msg.time}</span><br>
                 <img src="${msg.file.url}" style="max-width:200px;">`;
    } else if(msg.file.type.startsWith('video')){
      content = `<strong class="name">${msg.name}</strong> <span class="time">${msg.time}</span><br>
                 <video src="${msg.file.url}" controls style="max-width:200px;"></video>`;
    }
  } else {
    content = `<span class="number">${msg.num}</span><strong class="name">${msg.name}</strong>: ${msg.text} <span class="time">${msg.time}</span>`;
  }
  div.innerHTML = content;
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
}

// メッセージ送信
sendBtn.onclick = () => {
  let text = messageInput.value.trim();
  if(!text && !fileInput.files.length) return;

  let name = nameInput.value.trim();
  if(!name){
    anonymousCount++;
    name = `名無しさん#${anonymousCount}`;
  }

  let file = fileInput.files[0];
  if(file){
    let reader = new FileReader();
    reader.onload = () => {
      socket.emit('chatMessage', {
        room: currentRoom,
        name,
        text,
        file: { url: reader.result, type: file.type }
      });
    };
    reader.readAsDataURL(file);
  } else {
    socket.emit('chatMessage', { room: currentRoom, name, text });
  }

  messageInput.value = '';
  fileInput.value = '';
};

// 受信
socket.on('chatMessage', msg => appendMessage(msg));
