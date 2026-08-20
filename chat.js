// chat.js
const socket = io("https://sanngokudoumei.onrender.com");
let room = '';
let userId = Math.floor(Math.random() * 1000);
let userName = localStorage.getItem('chatUserName') || '名無しさん';
let allBoards = [];

const chat = document.getElementById('chat');
const home = document.getElementById('home');
const chatContainer = document.getElementById('chatContainer');
const nameInput = document.getElementById('nameInput');
const messageInput = document.getElementById('messageInput');
const fileInput = document.getElementById('fileInput');
const sendBtn = document.getElementById('sendBtn');
const homeLink = document.getElementById('backHome');

const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const searchResultsSection = document.getElementById('searchResultsSection');
const searchResults = document.getElementById('searchResults');
const newBoardName = document.getElementById('newBoardName');
const newBoardTags = document.getElementById('newBoardTags');
const createBtn = document.getElementById('createBtn');
const popularBoards = document.getElementById('popularBoards');
const recentRoomsDiv = document.getElementById('recentRooms');

// ===== 画像をリサイズしてBase64にする関数 =====
function resizeImage(file, maxWidth = 800, maxHeight = 800, quality = 0.7) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxWidth) { height *= maxWidth / width; width = maxWidth; }
        } else {
          if (height > maxHeight) { width *= maxHeight / height; height = maxHeight; }
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

// ===== 最近入った板(localStorage) =====
function getRecentRoomNames() {
  return JSON.parse(localStorage.getItem('recentRooms') || '[]');
}
function addRecentRoom(r) {
  let rooms = getRecentRoomNames();
  rooms = rooms.filter(x => x !== r);
  rooms.unshift(r);
  if (rooms.length > 5) rooms.pop();
  localStorage.setItem('recentRooms', JSON.stringify(rooms));
}

// ===== 板カードの描画まわり =====
function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, s => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[s]));
}
function tagsHtml(tags) {
  if (!tags || tags.length === 0) return '';
  return `<div class="boardTags">${tags.map(t => `<span class="tag">#${escapeHtml(t)}</span>`).join('')}</div>`;
}
function boardCardHtml(board) {
  return `
    <div class="boardCard" data-room="${escapeHtml(board.name)}">
      <button class="deleteBtn" data-room="${escapeHtml(board.name)}" title="この板を削除">×</button>
      <div class="boardName">${escapeHtml(board.name)}</div>
      <div class="boardMeta">👥${board.userCount ?? 0} 💬${board.messageCount ?? 0}</div>
      ${tagsHtml(board.tags)}
    </div>`;
}
function attachBoardCardHandlers(container) {
  container.querySelectorAll('.boardCard').forEach(card => {
    card.addEventListener('click', () => enterRoom(card.dataset.room));
  });
  container.querySelectorAll('.deleteBtn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation(); // カード自体のクリック(入室)を防ぐ
      const name = btn.dataset.room;
      if (confirm(`「${name}」を削除しますか？\nこの操作は取り消せません。`)) {
        socket.emit('deleteBoard', name);
      }
    });
  });
}

function renderPopularBoards() {
  const sorted = [...allBoards].sort((a, b) => {
    const scoreA = (a.userCount || 0) * 3 + (a.messageCount || 0);
    const scoreB = (b.userCount || 0) * 3 + (b.messageCount || 0);
    return scoreB - scoreA;
  }).slice(0, 10);

  popularBoards.innerHTML = sorted.length
    ? sorted.map(boardCardHtml).join('')
    : '<p class="emptyNote">まだ板がありません</p>';
  attachBoardCardHandlers(popularBoards);
}

function renderRecentRooms() {
  const names = getRecentRoomNames();
  const boardsMap = Object.fromEntries(allBoards.map(b => [b.name, b]));
  const list = names.map(n => boardsMap[n] || { name: n, tags: [], userCount: 0, messageCount: 0 });

  recentRoomsDiv.innerHTML = list.length
    ? list.map(boardCardHtml).join('')
    : '<p class="emptyNote">まだ入った板がありません</p>';
  attachBoardCardHandlers(recentRoomsDiv);
}

function renderSearchResults(query) {
  const q = query.trim().toLowerCase();
  const isTagSearch = q.startsWith('#');
  const qClean = isTagSearch ? q.slice(1) : q;

  const filtered = allBoards.filter(b => {
    if (!qClean) return true;
    const nameMatch = b.name.toLowerCase().includes(qClean);
    const tagMatch = (b.tags || []).some(t => t.toLowerCase().includes(qClean));
    return nameMatch || tagMatch;
  });

  searchResultsSection.style.display = 'block';
  searchResults.innerHTML = filtered.length
    ? filtered.map(boardCardHtml).join('')
    : '<p class="emptyNote">見つかりませんでした</p>';
  attachBoardCardHandlers(searchResults);
}

// ===== 入室 =====
function enterRoom(r) {
  r = (r || '').trim();
  if (!r) return;
  room = r;
  addRecentRoom(r);

  home.style.display = 'none';
  chatContainer.style.display = 'block';
  socket.emit('joinRoom', room);
}

// ===== 検索・作成イベント =====
searchBtn.addEventListener('click', () => renderSearchResults(searchInput.value));
searchInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') renderSearchResults(searchInput.value);
});

createBtn.addEventListener('click', () => {
  const name = newBoardName.value.trim();
  if (!name) { alert('板名を入力してください'); return; }
  const tags = newBoardTags.value
    .split(/\s+/)
    .map(t => t.replace(/^#/, '').trim())
    .filter(Boolean);
  socket.emit('createBoard', { name, tags });
});

socket.on('createBoardResult', (res) => {
  if (res.ok) {
    newBoardName.value = '';
    newBoardTags.value = '';
    enterRoom(res.name);
  } else {
    alert(res.message || '板の作成に失敗しました');
  }
});

socket.on('boardsUpdated', (boards) => {
  allBoards = boards;
  renderPopularBoards();
  renderRecentRooms();
  if (searchInput.value.trim()) renderSearchResults(searchInput.value);
});

socket.on('boardDeleted', ({ name }) => {
  if (room === name) {
    alert(`この板「${name}」は削除されました。`);
    chat.innerHTML = '';
    messageInput.value = '';
    fileInput.value = '';
    chatContainer.style.display = 'none';
    home.style.display = 'block';
    room = '';
  }
  // 最近入った板からも消す
  const rooms = getRecentRoomNames().filter(r => r !== name);
  localStorage.setItem('recentRooms', JSON.stringify(rooms));
});

// ===== メッセージ表示 =====
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

// ===== メッセージ送信 =====
sendBtn.addEventListener('click', async () => {
  const msg = messageInput.value.trim();
  const name = nameInput.value.trim() || userName;
  localStorage.setItem('chatUserName', name);
  const file = fileInput.files[0];

  if (!msg && !file) return;

  if (file) {
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
      room, id: userId, name, file: fileData, fileType: file.type,
      time: new Date().toLocaleTimeString()
    });
  } else {
    socket.emit('message', {
      room, id: userId, name, msg,
      time: new Date().toLocaleTimeString()
    });
  }

  messageInput.value = '';
  fileInput.value = '';
});

socket.on('history', msgs => msgs.forEach(addMessage));
socket.on('message', addMessage);
socket.on('system', addMessage);

// ===== ホームに戻る =====
homeLink.addEventListener('click', (e) => {
  e.preventDefault();
  chat.innerHTML = '';
  messageInput.value = '';
  fileInput.value = '';
  chatContainer.style.display = 'none';
  home.style.display = 'block';
});
