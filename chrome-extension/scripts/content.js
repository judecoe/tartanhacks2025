if (!window.autoHatInitialized) {
  window.autoHatInitialized = true;
  console.log("AutoHat content script loaded.");

  function detectQuestion() {
    let questionElement = document.querySelector(
      "legend.QuestionWrapperstyles__Legend-sc-g4w8f0-4"
    );
    let options = document.querySelectorAll(
      "div.MultipleChoiceQuestionAnswerableItemstyles__StyledContainer-sc-6bz3d1-0"
    );

    if (questionElement) {
      let questionText = questionElement.innerText.trim();
      let choices = [];

      options.forEach((option) => {
        if (option.innerText.trim()) {
          choices.push(option.innerText.trim());
        }
      });

      if (questionText && choices.length > 0) {
        console.log("Detected Question:", questionText);
        console.log("Detected Choices:", choices);

        chrome.runtime.sendMessage({
          type: "questionDetected",
          question: questionText,
          choices: choices,
        });
      }
    }
  }

  const observer = new MutationObserver(() => detectQuestion());
  observer.observe(document.body, { childList: true, subtree: true });

  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === "content_script_ready") {
      detectQuestion();
    }
  });

  detectQuestion();
}
