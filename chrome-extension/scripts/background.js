// FOR MATT/KIERAN
// targetTab.url is the url you guys need

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "findTopHatTab") {
    chrome.tabs.query({}, (tabs) => {
      let targetTab = tabs.find(
        (tab) => tab.url && tab.url.startsWith("https://app.tophat.com")
      );

      if (targetTab) {
        // Activate the tab if it's found
        chrome.tabs.update(targetTab.id, { active: true });

        // Establish WebSocket connection to the server
        let socket = new WebSocket('ws://localhost:8765');

        socket.onopen = () => {
          console.log('WebSocket connection established');

          // Send the URL to the WebSocket server
          const url = targetTab.url;
          const message = JSON.stringify({ url: url });
          socket.send(message);

          // Send response back once URL is sent
          sendResponse({ success: true });
        };

        // Listen for messages from the WebSocket server
        socket.onmessage = (event) => {
          const response = JSON.parse(event.data);
          console.log("Response from server:", response.status);
        };

        // Handle WebSocket errors
        socket.onerror = (error) => {
          console.error('WebSocket Error:', error);
        };

        // Handle WebSocket connection close
        socket.onclose = () => {
          console.log('WebSocket connection closed');
        };
      } else {
        sendResponse({ error: "TopHat tab not found. Make sure you have TopHat open!" });
      }
    });
    return true; // Keep the message channel open for asynchronous response
  }

  if (message.action === "getTopHatUrl") {
    chrome.storage.local.get("tophatUrl", (data) => {
      sendResponse({ url: data.tophatUrl || "No URL stored yet" });
    });

    return true;
  }
});
