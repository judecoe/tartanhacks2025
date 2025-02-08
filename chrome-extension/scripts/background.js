console.log("Background script loaded!");

async function fetchGPTAnswer(questionText, choices) {
  console.log("Sending question to GPT:", questionText, "Choices:", choices);

  await new Promise((resolve) => setTimeout(resolve, 1000));

  const fakeAnswer =
    choices.length > 0 ? choices[0] : "This is a test answer from AutoHat.";
  console.log("Mocked answer:", fakeAnswer);
  return fakeAnswer;
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Message received in background.js:", message);

  if (message.type === "questionDetected") {
    console.log("Detected question:", message.question);
    console.log("Answer choices:", message.choices);

    fetchGPTAnswer(message.question, message.choices).then((answer) => {
      if (answer) {
        console.log("Sending answer to Selenium:", answer);
        sendToSelenium(answer);
      } else {
        console.error("Failed to get an answer from GPT.");
      }
    });

    sendResponse({ status: "received" });
  }
});

function sendToSelenium(answer) {
  fetch("http://localhost:5000/submit-answer", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ answer: answer }),
  })
    .then((response) => response.json())
    .then((data) => console.log("Selenium response:", data))
    .catch((error) =>
      console.error("Error sending answer to Selenium:", error)
    );
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url.includes("tophat.com")) {
    chrome.scripting.executeScript(
      {
        target: { tabId: tabId },
        files: ["scripts/content.js"],
      },
      () => {
        if (chrome.runtime.lastError) {
          console.warn(
            "Error injecting content script:",
            chrome.runtime.lastError.message
          );
        } else {
          console.log("Content script successfully injected.");
          chrome.tabs.sendMessage(tabId, { type: "content_script_ready" });
        }
      }
    );
  }
});

chrome.runtime.onInstalled.addListener(() => {
  console.log("Extension installed or updated.");
});

chrome.runtime.onStartup.addListener(() => {
  console.log("Chrome started, background script reloaded.");
  chrome.tabs.query({}, function (tabs) {
    tabs.forEach((tab) => {
      if (tab.url && tab.url.includes("tophat.com")) {
        chrome.scripting.executeScript(
          {
            target: { tabId: tab.id },
            files: ["scripts/content.js"],
          },
          () => {
            if (chrome.runtime.lastError) {
              console.warn(
                "Error injecting content script:",
                chrome.runtime.lastError.message
              );
            } else {
              console.log("Content script successfully injected.");
              chrome.tabs.sendMessage(tab.id, { type: "content_script_ready" });
            }
          }
        );
      }
    });
  });
});
