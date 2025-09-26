const socket = io('https://sanngokudoumei.onrender.com'); // サーバーURL
let currentRoom = '';

// 入室
document.getElementById('joinBtn').addEventListener('click', () => {
  const room = document.getElementById('homeRoomInput').value.trim();
  if (!room) return alert('部屋名を入力してください');
  currentRoom = room;
  socket.emit('joinRoom', room);
  document.getElementById('home').style.display = 'none';
  document.getElementById('chatContainer').style.display = 'block';
});

// ホームへ戻る
document.getElementById('backHome').addEventListener('click', () => {
  document.getElementById('chatContainer').style.display = 'none';
  document.getElementById('home').style.display = 'block';
  currentRoom = '';
});

// メッセージ送信
document.getElementById('sendBtn').addEventListener('click', async () => {
  const name = document.getElementById('nameInput').value.trim();
  const text = document.getElementById('messageInput').value.trim();
  const fileInput = document.getElementById('fileInput');
  let fileUrl = '';

  if (fileInput.files.length > 0) {
    const formData = new FormData();
    formData.append('file', fileInput.files[0]);
    const res = await fetch('https://sanngokudoumei.onrender.com/upload', { method: 'POST', body: formData });
    const data = await res.json();
    fileUrl = 'https://sanngokudoumei.onrender.com' + data.url;
    fileInput.value = '';
  }

  if (!name && !text && !fileUrl) return alert('何か入力してください');

  socket.emit('chatMessage', { room: currentRoom, name, text, fileUrl });
  document.getElementById('messageInput').value = '';
});

// メッセージ受信
socket.on('chatMessage', data => {
  const chat = document.getElementById('chat');
  const div = document.createElement('div');
  div.classList.add('message');

  let content = '';
  if (data.text) content += `<span class="name">${data.name}:</span> ${data.text} `;
  if (data.fileUrl) {
    if (data.fileUrl.match(/\.(jpg|jpeg|png|gif)$/i)) content += `<br><img src="${data.fileUrl}" style="max-width:200px;">`;
    if (data.fileUrl.match(/\.(mp4|webm)$/i)) content += `<br><video src="${data.fileUrl}" controls style="max-width:300px;"></video>`;
  }

  div.innerHTML = content;
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
});
