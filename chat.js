// 🌍 Render が発行したURLをここに書く！ (例: https://my-chat-app.onrender.com)
const socket = io("https://sanngokudoumei.onrender.com/");

const chatDiv = document.getElementById("chat");
const input = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");

sendBtn.addEventListener("click", () => {
  const msg = input.value;
  if (msg.trim() !== "") {
    socket.emit("chat message", msg);
    input.value = "";
  }
});

socket.on("chat message", (msg) => {
  const p = document.createElement("p");
  p.textContent = msg;
  chatDiv.appendChild(p);
  chatDiv.scrollTop = chatDiv.scrollHeight;
});
