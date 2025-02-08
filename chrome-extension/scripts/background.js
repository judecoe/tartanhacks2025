let socket = null;

function cleanText(text) {
  return text.replace(/\s+/g, " ").trim();
}

function connectWebSocket() {
  if (socket?.readyState === WebSocket.CONNECTING) return;

  socket = new WebSocket("ws://localhost:8765");

  socket.onopen = () => {
    console.log("WebSocket connected");
  };

  socket.onclose = () => {
    socket = null;
  };

  socket.onerror = (error) => {
    console.error("WebSocket error:", error);
  };

  socket.onmessage = async (event) => {
    try {
      const response = JSON.parse(event.data);
      if (response.error) {
        console.error("Server error:", response.error);
        return;
      }

      const tabs = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      if (tabs[0]) {
        await chrome.tabs.sendMessage(tabs[0].id, {
          action: "fillAnswer",
          answer: response.answer,
          questionType: response.questionType,
        });
      }
    } catch (error) {
      console.error("Error processing message:", error);
    }
  };

  return socket;
}

connectWebSocket();

async function sendToServer(message) {
  if (!socket || socket.readyState !== WebSocket.OPEN) {
    socket = connectWebSocket();
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  try {
    // Clean the question and answers
    const cleanAnswers = message.answers.map((answer) => ({
      option: answer.option,
      text: cleanText(answer.text),
    }));

    const data = {
      url: message.url,
      question: cleanText(message.question),
      answers: cleanAnswers,
      questionType:
        message.answers?.length > 0
          ? "Multiple Choice (Single Answer)"
          : "Word Answer",
    };
    socket.send(JSON.stringify(data));
  } catch (error) {
    console.error("Error sending to server:", error);
  }
}

chrome.runtime.onMessage.addListener((message) => {
  if (message.url?.includes("tophat.com")) {
    sendToServer(message);
  }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url?.includes("tophat.com")) {
    chrome.tabs.sendMessage(tabId, { action: "reinitialize" }).catch(() => {});
  }
});
