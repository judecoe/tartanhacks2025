let socket = null;

function cleanText(text) {
  return text.replace(/\s+/g, " ").trim();
}

function connectWebSocket() {
  //Check if websocket server already running
  if (socket?.readyState === WebSocket.CONNECTING) return;

  //Initialize websocket on port 8765
  socket = new WebSocket("ws://localhost:8765");

  //Defining socket callback functions
  socket.onopen = () => {
    console.log("WebSocket connected");
  };

  socket.onclose = () => {
    socket = null;
  };

  socket.onerror = (error) => {
    console.error("WebSocket error:", error);
  };

  //This onmessage function listens for messages from websocket server with the proper question and answer type
  socket.onmessage = async (event) => {
    try {
      //Parse into javascript object
      const response = JSON.parse(event.data);
      if (response.error) {
        console.error("Server error:", response.error);
        return;
      }

      //Then we get the currently active tab from chrome
      const tabs = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      //Finally, send a message back to server content.js with right answer for the question type for a specific tab. 
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

//Creates the websocket connection when first running script
connectWebSocket();


async function sendToServer(message) {
  //Check if websocket is open first. 
  if (!socket || socket.readyState !== WebSocket.OPEN) {
    //If socket not open, await a new Promise that is resolved and waits 500 ms before moving on
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

    //Send data through websocket to servergpt
    socket.send(JSON.stringify(data));
    
  } catch (error) {
    console.error("Error sending to server:", error);
  }
}

//Receives message from content.js to send to servergpt.py
chrome.runtime.onMessage.addListener((message) => {
  if (message.url?.includes("tophat.com")) {
    sendToServer(message);
  }
});

// Thit event listener detects if a tab is fully loaded and is tophat.com
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url?.includes("tophat.com")) {
    chrome.tabs.sendMessage(tabId, { action: "reinitialize" }).catch(() => {});
  }
});
