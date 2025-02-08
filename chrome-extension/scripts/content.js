function extractTopHatContent() {
  const url = window.location.href;

  // Only proceed if we're on a TopHat page
  if (!url.includes("tophat.com")) return;

  // Find question by looking for a pattern in class names
  function findQuestion() {
    const possibleQuestions = document.querySelectorAll(
      '[class*="OverrideText"]'
    );
    for (const element of possibleQuestions) {
      const text = element.innerText.trim();
      if (text && text.length > 0) {
        return text;
      }
    }
    return null;
  }

  // Find answers using the known pattern
  function findAnswers() {
    const answerElements = document.querySelectorAll(
      '[class*="Listsstyles__ListItem"]'
    );
    return Array.from(answerElements)
      .map((element, index) => ({
        option: String.fromCharCode(65 + index), // A, B, C, etc.
        text: element.innerText.trim(),
      }))
      .filter((answer) => answer.text.length > 0); // Filter out empty answers
  }

  // Extract and send data
  const questionText = findQuestion();
  const answers = findAnswers();

  if (questionText || answers.length > 0) {
    const data = {
      url,
      question: questionText,
      answers,
      timestamp: new Date().toISOString(),
    };

    // Send extracted data to the background script
    chrome.runtime.sendMessage(data, (response) => {
      if (chrome.runtime.lastError) {
        console.warn("Error sending message:", chrome.runtime.lastError);
      } else {
        console.log("Data sent to background script:", response);
      }
    });

    return true;
  }
  return false;
}

// More efficient initialization
let extractionInterval;
function initializeExtraction() {
  // Clear any existing interval
  if (extractionInterval) {
    clearInterval(extractionInterval);
  }

  // Try extraction immediately
  if (extractTopHatContent()) {
    // If successful, set up a lighter monitoring system
    const observer = new MutationObserver(() => {
      extractTopHatContent();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: false,
      characterData: false,
    });
  } else {
    // If not successful, try every second for 5 seconds
    let attempts = 0;
    extractionInterval = setInterval(() => {
      if (extractTopHatContent() || attempts >= 5) {
        clearInterval(extractionInterval);
      }
      attempts++;
    }, 1000);
  }
}

// Start the process
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeExtraction);
} else {
  initializeExtraction();
}
