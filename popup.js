// Lấy các phần tử từ popup.html
const tokenInput = document.getElementById("tokenInput");
const storeIdInput = document.getElementById("storeIdInput");
const timerInput = document.getElementById("timerInput");
const startButton = document.getElementById("startButton");
const finishButton = document.getElementById("finishButton");

// Lấy giá trị từ localStorage nếu có
tokenInput.value = localStorage.getItem("token") || "";
storeIdInput.value = localStorage.getItem("storeId") || "";
timerInput.value = localStorage.getItem("timer") || "";

startButton.addEventListener("click", () => {
  if(tokenInput.value) {
    localStorage.setItem("token", tokenInput.value);
  }
  if(storeIdInput.value) {
    localStorage.setItem("storeId", storeIdInput.value);
  }
  if(timerInput.value) {
    localStorage.setItem("timer", timerInput.value);
  }

  const token = tokenInput.value || localStorage.getItem("token");
  const storeId = storeIdInput.value || localStorage.getItem("storeId");
  const timer = parseInt(timerInput.value || localStorage.getItem("timer"));

  // Gửi message cho background
  setTimeout(() => {
    const csrfNonce = document.querySelector('meta[name="csrf_nonce"]')?.content;
    chrome.runtime.sendMessage({
      action: "startCookieExtractor",
      token: token,
      storeId: storeId,
      timer: timer,
      csrfNonce: csrfNonce
    });
  }, 2000);
});

// Bạn có thể xử lý sự kiện cho finishButton tương tự
finishButton.addEventListener("click", () => {
  // Xử lý logic cho nút Finish nếu cần
});
