// FOR MATT/KIERAN
// targetTab.url is the url you guys need

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "findTopHatTab") {
    chrome.tabs.query({}, (tabs) => {
      let targetTab = tabs.find(
        (tab) => tab.url && tab.url.startsWith("https://app.tophat.com")
      );

      if (targetTab) {
        chrome.tabs.update(targetTab.id, { active: true });

        chrome.storage.local.set({ tophatUrl: targetTab.url }, () => {
          console.log("Stored TopHat URL:", targetTab.url);
        });

        sendResponse({ success: true });
      } else {
        sendResponse({
          error: "TopHat tab not found. Make sure you have TopHat open!",
        });
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
});
