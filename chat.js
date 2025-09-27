const socket = io('https://sanngokudoumei.onrender.com');

let room = '';
let userId = Math.floor(Math.random()*1000);
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

// メッセージ表示
function addMessage(data) {
    const id = data.id ? `#${data.id}` : '';
    const div = document.createElement('div');
    div.className = 'message';
    let content = '';

    if (data.type === 'system') {
        content = `<i>${data.msg}</i>`;
    } else if (data.type === 'image' && data.file) {
        content = `<b>${data.name}${id}</b> [${data.time}]:<br>
                   <img src="${data.file}" style="max-width:200px;">`;
    } else {
        content = `<b>${data.name}${id}</b> [${data.time}]: ${data.msg}`;
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
    home.style.display = 'none';
    chatContainer.style.display = 'block';
    socket.emit('joinRoom', room);
});

// 送信
sendBtn.addEventListener('click', () => {
    const msg = messageInput.value.trim();
    if (!msg && !fileInput.files[0]) return;
    let name = nameInput.value.trim() || userName;
    const file = fileInput.files[0];

    if (file) {
        const reader = new FileReader();
        reader.onload = () => {
            socket.emit('message', {
                room,
                name,
                file: reader.result,
                type: 'image'
            });
        };
        reader.readAsDataURL(file);
    } else {
        socket.emit('message', {
            room,
            name,
            msg,
            type: 'text'
        });
    }

    messageInput.value = '';
    fileInput.value = '';
});

// 過去メッセージ受信
socket.on('history', msgs => msgs.forEach(addMessage));

// 新規メッセージ受信
socket.on('message', addMessage);
