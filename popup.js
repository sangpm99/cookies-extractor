// Lấy các phần tử từ popup.html
const tokenInput = document.getElementById("tokenInput");
const storeIdInput = document.getElementById("storeIdInput");
const timerInput = document.getElementById("timerInput");
const startButton = document.getElementById("startButton");
const finishButton = document.getElementById("finishButton");
const production = document.getElementById("production");
const development = document.getElementById("development");
const btnRunning = document.getElementById("btnRunning");
const btnError= document.getElementById("btnError");
const btnNotStarted = document.getElementById("btnNotStarted");
const cookies = document.getElementById("cookies");
const copyCookies = document.getElementById("copyCookies");
const userAgent = document.getElementById("userAgent");
const copyUserAgent = document.getElementById("copyUserAgent");
const csrfNonce = document.getElementById("csrfNonce");
const copyCsrfNonce = document.getElementById("copyCsrfNonce");


// Lấy giá trị từ localStorage nếu có
tokenInput.value = localStorage.getItem("token") || "";
storeIdInput.value = localStorage.getItem("storeId") || "";
timerInput.value = localStorage.getItem("timer") || "";

if(localStorage.getItem("server") === "development"){
  development.checked = true;
  production.checked = false;
} else {
  production.checked = true;
  development.checked = false;
}

copyCookies.addEventListener("click", () => {
  navigator.clipboard.writeText(cookies.value);
});

copyUserAgent.addEventListener("click", () => {
  navigator.clipboard.writeText(userAgent.value);
});

copyCsrfNonce.addEventListener("click", () => {
  navigator.clipboard.writeText(csrfNonce.value);
});

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

  if(development.checked) {
    localStorage.setItem("server", "development");
  } else {
    localStorage.setItem("server", "production");
  }

  const token = tokenInput.value || localStorage.getItem("token");
  const storeId = storeIdInput.value || localStorage.getItem("storeId");
  const timer = parseInt(timerInput.value || localStorage.getItem("timer"));
  let server = "production";
  if(development.checked) {
    server = "development";
  }

  // Gửi message cho background
  setTimeout(() => {
    const csrfMeta = document.querySelector('meta[name="csrf_nonce"]');
    chrome.runtime.sendMessage({
      action: "startCookieExtractor",
      token: token,
      storeId: storeId,
      timer: timer,
      csrfNonce: csrfMeta.content,
      server: server,
    });
  }, 5000);
});


chrome.runtime.onMessage.addListener((message) => {
  if (message.action === "updatePopupData") {
    if (message.cookies) {
      cookies.value = message.cookies;
    }
    if (message.userAgent) {
      userAgent.value = message.userAgent;
    }
    if (message.csrfNonce) {
      csrfNonce.value = message.csrfNonce;
    }
  }
});


// Bạn có thể xử lý sự kiện cho finishButton tương tự
finishButton.addEventListener("click", () => {
  chrome.runtime.sendMessage({
    action: "finishCookieExtractor",
  });
});
