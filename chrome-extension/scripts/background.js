// background.js
let lastProcessedData = null;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "findTopHatTab") {
    chrome.tabs.query({}, (tabs) => {
      let targetTab = tabs.find(
        (tab) => tab.url && tab.url.startsWith("https://app.tophat.com")
      );
      if (targetTab) {
        console.log("Found TopHat tab:", targetTab.url);
        chrome.tabs.update(targetTab.id, { active: true });
      }
    });
    return true;
  }

  if (message.action === "getTopHatUrl") {
    chrome.storage.local.get("tophatUrl", (data) => {
      sendResponse({ url: data.tophatUrl || "No URL stored yet" });
    });
    return true;
  }

  const messageKey = `${message.url}-${message.question}-${message.answers?.length}`;
  if (lastProcessedData === messageKey) return;
  lastProcessedData = messageKey;

  if (message.url) {
    console.log("🔗 URL:", message.url);
    chrome.storage.local.set({ urlData: { url: message.url } }, () => {
      console.log("URL saved:", message.url);
      console.log(chrome.storage.local);
    });
  }
});
