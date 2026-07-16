// chat.js
const socket = io("https://sanngokudoumei.onrender.com");

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
const homeLink = document.getElementById('backHome'); // ホーム戻るリンク

// 画像をリサイズしてBase64にする関数
function resizeImage(file, maxWidth = 800, maxHeight = 800, quality = 0.7) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// 最近使った部屋
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
joinBtn.addEventListener('click', () => {
  const r = homeRoomInput.value.trim();
  if (!r) return alert('部屋名を入力してください');
  room = r;
  userName = nameInput.value.trim() || userName;
  localStorage.setItem('chatUserName', userName);
  addRecentRoom(r);

  home.style.display = 'none';
  chatContainer.style.display = 'block';
  socket.emit('joinRoom', room);
});

// メッセージ送信
sendBtn.addEventListener('click', async () => {
  const msg = messageInput.value.trim();
  const name = nameInput.value.trim() || userName;
  localStorage.setItem('chatUserName', name);
  const file = fileInput.files[0];

  if (!msg && !file) return;

  if (file) {
    // 画像ファイルならリサイズ、それ以外(PDF等)はそのまま
    let fileData;
    if (file.type.startsWith('image')) {
      fileData = await resizeImage(file, 800, 800, 0.7);
    } else {
      fileData = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.readAsDataURL(file);
      });
    }

    socket.emit('message', {
      room,
      id: userId,
      name,
      file: fileData,
      fileType: file.type,
      time: new Date().toLocaleTimeString()
    });
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

// 過去メッセージ受信
socket.on('history', msgs => msgs.forEach(addMessage));
socket.on('message', addMessage);
socket.on('system', addMessage);

// ホームに戻るリンク
homeLink.addEventListener('click', (e) => {
  e.preventDefault(); // aタグのリンク動作を防ぐ
  chat.innerHTML = ''; // チャット画面リセット
  messageInput.value = '';
  fileInput.value = '';
  chatContainer.style.display = 'none';
  home.style.display = 'block';
});

// 初期化
updateRecentRooms();
