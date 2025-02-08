let lastProcessedData = null;
let socket = null;

function connectWebSocket() {
  socket = new WebSocket("ws://localhost:8765");

  socket.onopen = () => {
    console.log("✅ WebSocket connected successfully.");
  };

  socket.onerror = (error) => {
    console.error("❌ WebSocket error:", error);
  };

  socket.onclose = () => {
    console.warn("⚠️ WebSocket closed. Attempting to reconnect...");
    setTimeout(connectWebSocket, 2000); // Reconnect after 2 seconds
  };
}

// Initialize WebSocket connection
connectWebSocket();

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const messageKey = `${message.url}-${message.question}-${message.answers?.length}`;
  if (lastProcessedData === messageKey) return;
  lastProcessedData = messageKey;

  if (message.url) {
    console.group("📚 TopHat Content Extracted");
    console.log("🔗 URL:", message.url);

    if (message.question) {
      console.log("❓ Question:", message.question);
    }

    if (message.answers?.length > 0) {
      console.group("📝 Answer Choices:");
      message.answers.forEach((answer) => {
        console.log(`${answer.option}. ${answer.text}`);
      });
      console.groupEnd();
    }
    console.groupEnd();

    // Ensure WebSocket is open before sending data
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ url: message.url }));
      console.log("📤 Sent URL to WebSocket server:", message.url);
    } else {
      console.warn("⚠️ WebSocket not ready, will retry sending...");
      socket.onopen = () => {
        socket.send(JSON.stringify({ url: message.url }));
        console.log("📤 Sent URL after reconnect:", message.url);
      };
    }
  }
});
