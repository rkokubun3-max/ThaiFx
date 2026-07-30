document.addEventListener("DOMContentLoaded", () => {
  const socket = io();

  const userIdInput = document.getElementById("id");
  const currentUserId = userIdInput ? userIdInput.value : null;

  socket.emit("join_user_room", currentUserId);

  socket.on("topup_success", (data) => {
    alert(data.message + " Received: THB" + data.amount);
    window.location.href = "/dashboard";
  });
});

const topupForm = document.getElementById("topupForm");
const qrResult = document.getElementById("qrcode");
const qrcodeCanvas = document.getElementById("qrcodeCanvas");
const qrAmountText = document.getElementById("qrAmountText");

topupForm.addEventListener("submit", function (e) {
  e.preventDefault();

  const userId = document.getElementById("id").value;
  const amount = document.getElementById("amount").value;

  if (!amount || amount <= 0) return;

  const ipAddress = "192.168.0.200";
  const port = "3000";
  const domain = window.location.origin;
  const targetUrl = `${domain}/topup/confirm?userId=${userId}&amount=${amount}`;

  QRCode.toCanvas(qrcodeCanvas, targetUrl, function (error) {
    if (error) {
      console.error(error);
      alert("Cannot create qrcode");
      return;
    }
    qrResult.style.display = "block";
  });
});
