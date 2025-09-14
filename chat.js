// 🌍 Render が発行したURLをここに書く！ (例: https://my-chat-app.onrender.com)
const socket = io("https://sanngokudoumei.onrender.com/");

const chatDiv = document.getElementById("chat");
const nameInput = document.getElementById("nameInput");
const messageInput = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");

let messageCount = 0;

sendBtn.addEventListener("click", () => {
  const name = nameInput.value.trim() || "名無しさん";
  const msg = messageInput.value.trim();
  if (msg !== "") {
    socket.emit("chat message", { name, msg });
    messageInput.value = "";
  }
});

socket.on("chat message", (data) => {
  messageCount++;
  const div = document.createElement("div");
  div.className = "message";
  const now = new Date();
  const time = `${now.getHours()}:${String(now.getMinutes()).padStart(2,'0')}`;
  div.innerHTML = `<span class="number">No.${messageCount}</span>
                   <span class="name">${data.name}</span>
                   ${data.msg}
                   <span class="time">(${time})</span>`;
  chatDiv.appendChild(div);
  chatDiv.scrollTop = chatDiv.scrollHeight;
});
