// background.js
let lastProcessedData = null;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Avoid duplicate messages
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
  }
});
