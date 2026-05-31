//dataURLでないfaviconを取得してbase64で返す
chrome.runtime.onMessage.addListener(({ url }, sender, sendResponse) => {
  fetch(url)
    .then((r) => r.arrayBuffer())
    .then((buf) => {
      const base64 = btoa(String.fromCharCode(...new Uint8Array(buf)));
      sendResponse(base64);
    })
    .catch(() => sendResponse(null));
  return true;
});