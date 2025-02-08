let lastProcessedQuestion = null;

function clickSubmit() {
  // Try different known TopHat button classes and attributes
  const possibleSelectors = [
    'button[type="submit"]',
    'button[class*="submit"]',
    'button[class*="Submit"]',
    'button[class*="ButtonNext"]',
    'button[class*="NextButton"]',
    '[class*="SubmitButton"]',
    '[class*="submitButton"]',
  ];

  // Try each selector
  for (const selector of possibleSelectors) {
    const button = document.querySelector(selector);
    if (button) {
      setTimeout(() => {
        button.click();
        console.log("Clicked submit button with selector:", selector);
      }, 500);
      return true;
    }
  }

  // If no button found, try finding by button text content
  const allButtons = document.querySelectorAll("button");
  for (const button of allButtons) {
    if (
      button.textContent.toLowerCase().includes("submit") ||
      button.textContent.toLowerCase().includes("next")
    ) {
      setTimeout(() => {
        button.click();
        console.log("Clicked submit button by text content");
      }, 500);
      return true;
    }
  }

  console.warn("Submit button not found");
  return false;
}

function clickOpenButton() {
  // Try multiple approaches to find the Open button
  const selectors = [
    // Look for Open text with unanswered questions
    'button[class*="Button"]:not([disabled])',
    'a[class*="Button"]:not([disabled])',
    '[role="button"]:not([disabled])',
    '[class*="notification"]:not([disabled]) button',
    '[class*="toast"]:not([disabled]) button',
  ];

  for (const selector of selectors) {
    const elements = document.querySelectorAll(selector);
    for (const element of elements) {
      // Check if the element or its parent contains both "Open" and "unanswered"
      const elementText = (element.textContent || "").toLowerCase();
      const parentText = (
        element.parentElement?.textContent || ""
      ).toLowerCase();
      const containerText = elementText + " " + parentText;

      if (
        (elementText.includes("open") || parentText.includes("open")) &&
        containerText.includes("unanswered")
      ) {
        console.log("Found Open button:", element);
        setTimeout(() => {
          element.click();
          console.log("Clicked Open button");
        }, 1000);
        return true;
      }
    }
  }

  // Additional fallback: look for any element containing both texts
  const allElements = document.querySelectorAll("*");
  for (const element of allElements) {
    const text = element.textContent?.toLowerCase() || "";
    if (text.includes("open") && text.includes("unanswered")) {
      const buttons = element.querySelectorAll(
        'button, a[role="button"], [class*="Button"]'
      );
      if (buttons.length > 0) {
        console.log("Found Open button (fallback):", buttons[0]);
        setTimeout(() => {
          buttons[0].click();
          console.log("Clicked Open button (fallback)");
        }, 1000);
        return true;
      }
    }
  }

  return false;
}

function clickAnswer(answer) {
  const answerElements = document.querySelectorAll(
    '[class*="Listsstyles__ListItem"]'
  );
  const answerArray = Array.from(answerElements);

  // For multiple choice, answer will be a letter (a, b, c, etc.)
  if (typeof answer === "string" && answer.length === 1) {
    const index = answer.toLowerCase().charCodeAt(0) - 97; // Convert 'a' to 0, 'b' to 1, etc.
    if (index >= 0 && index < answerArray.length) {
      answerArray[index].click();
      console.log(`Clicked answer ${answer}`);
      clickSubmit();
      return true;
    }
  }

  // For text/numeric answers, find input field and fill it
  const inputField = document.querySelector(
    'input[type="text"], input[type="number"]'
  );
  if (inputField) {
    inputField.value = answer;
    // Trigger input event to ensure TopHat registers the change
    inputField.dispatchEvent(new Event("input", { bubbles: true }));
    console.log(`Filled in answer: ${answer}`);
    clickSubmit();
    return true;
  }

  return false;
}

function clickUnansweredQuestion() {
  // Try to find elements with "Unanswered" text
  const selectors = [
    '[class*="Question"]:not([class*="Answered"])',
    '[class*="QuestionList"] [class*="Item"]',
    '[role="listitem"]',
  ];

  for (const selector of selectors) {
    const elements = document.querySelectorAll(selector);
    for (const element of elements) {
      const text = element.textContent?.toLowerCase() || "";
      if (text.includes("unanswered")) {
        console.log("Found unanswered question element:", element);
        setTimeout(() => {
          element.click();
          console.log("Clicked unanswered question");
        }, 500);
        return true;
      }
    }
  }

  // Fallback: Look for any clickable element containing "Unanswered"
  const allElements = document.querySelectorAll("div, button, a, li");
  for (const element of allElements) {
    if (element.textContent?.toLowerCase().includes("unanswered")) {
      const clickableParent = element.closest(
        '[role="button"], button, a, [class*="clickable"]'
      );
      if (clickableParent) {
        console.log("Found unanswered question (fallback):", clickableParent);
        setTimeout(() => {
          clickableParent.click();
          console.log("Clicked unanswered question (fallback)");
        }, 500);
        return true;
      }
    }
  }

  return false;
}

// Debug helper function
function debugNotificationElements() {
  console.log("Debugging notification elements:");
  const allElements = document.querySelectorAll("*");
  allElements.forEach((el) => {
    if (el.textContent?.toLowerCase().includes("unanswered")) {
      console.log("Found element with unanswered:", el);
      console.log("Element HTML:", el.outerHTML);
      console.log("Parent HTML:", el.parentElement?.outerHTML);
    }
  });
}

function extractTopHatContent() {
  const url = window.location.href;
  if (!url.includes("tophat.com")) return;

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

  function findAnswers() {
    const answerElements = document.querySelectorAll(
      '[class*="Listsstyles__ListItem"]'
    );
    return Array.from(answerElements)
      .map((element, index) => ({
        option: String.fromCharCode(65 + index),
        text: element.innerText.trim(),
      }))
      .filter((answer) => answer.text.length > 0);
  }

  const questionText = findQuestion();

  if (questionText && questionText !== lastProcessedQuestion) {
    lastProcessedQuestion = questionText;
    const answers = findAnswers();

    const data = {
      url,
      question: questionText,
      answers,
      timestamp: new Date().toISOString(),
    };

    chrome.runtime.sendMessage(data, (response) => {
      if (chrome.runtime.lastError) {
        console.warn("Error sending message:", chrome.runtime.lastError);
      } else {
        console.log("Question data sent for GPT processing");
      }
    });

    return true;
  }
  return false;
}

// Watch for DOM changes
const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    if (mutation.type === "childList") {
      extractTopHatContent();
      clickOpenButton();
      clickUnansweredQuestion();
      debugNotificationElements();
    }
  }
});

// Add to initialization
function initializeExtraction() {
  extractTopHatContent();
  clickOpenButton();
  clickUnansweredQuestion();
  debugNotificationElements();

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true,
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeExtraction);
} else {
  initializeExtraction();
}

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "fillAnswer") {
    console.log("Received GPT answer:", message.answer);
    if (clickAnswer(message.answer)) {
      console.log("Successfully handled answer");
    } else {
      console.warn("Could not handle answer:", message.answer);
    }
  }
  if (message.action === "reinitialize") {
    lastProcessedQuestion = null;
    extractTopHatContent();
  }
});

window.addEventListener("unload", () => {
  observer.disconnect();
});
