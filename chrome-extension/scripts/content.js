/* 
This file contains that functions and components responsible for interacting with the webpage. 
It can extract things like questions and answers from the tophat page and send it to the backend server 
to be processed by OpenAI model and also receive from that server to interact with the right components accordingly
  Two-way interaction:
    1. Can receive information and get elements from webpage to be processed in background.js and by OpenAI through the websocket server.
    2. Can also get responses back from websocket server and use those to interact with the webpage (clicking and submitting correct
    answer choice)

*/

//Keeps track of already processed questions
let lastProcessedQuestion = null;

console.log("✅ content.js is running...")
//

// DOM Interaction Functions-------------------------------------------------------

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

  // Try each selector and see if its the right submit button
  for (const selector of possibleSelectors) {
    const button = document.querySelector(selector);
    if (button) {
      //This function just delays it by 500ms before executing code inside it. 
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

//This function finds all the answer options on the page a clicks the one corresponding to answer argument
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
// function debugNotificationElements() {
//   console.log("Debugging notification elements:");
//   const allElements = document.querySelectorAll("*");
//   allElements.forEach((el) => {
//     if (el.textContent?.toLowerCase().includes("unanswered")) {
//       console.log("Found element with unanswered:", el);
//       console.log("Element HTML:", el.outerHTML);
//       console.log("Parent HTML:", el.parentElement?.outerHTML);
//     }
//   });
// }



//Data Extraction and Processing Functions-------------------------------------------------------------------------------------------

// This function handles extracting the questions and answers initially
function extractTopHatContent() {
  //Do nothing if not on tophat tab
  const url = window.location.href;
  if (!url.includes("tophat.com")) return;

  //Page crawler functions for finding and extracting questions and answers. 
  function findQuestion() {
    const possibleQuestions = document.querySelectorAll(
      '[class*="OverrideText"]'
    );
    for (const element of possibleQuestions) {
      const text = element.innerText.trim();
      //console.log(text);
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

    // This return statement first converts the Node List to javascript Array and maps for each element and element index,
    // the associated answer optiona and text while filtering out any answers that have no text. 
    return Array.from(answerElements)
      .map((element, index) => ({
        option: String.fromCharCode(65 + index),
        text: element.innerText.trim(),
      }))
      .filter((answer) => answer.text.length > 0);

  }

  //Before initializing and checking observer, first check if this question had been processed already.
  //This is also where the data is also extracted and sent to background.js for server processing
  const questionText = findQuestion();
  console.log(questionText);
  

  if (questionText && questionText !== lastProcessedQuestion) {
    lastProcessedQuestion = questionText;
    const answers = findAnswers();

    //Formats all the extraced webpage data in a dictionary 
    const data = {
      url,
      question: questionText,
      answers,
      timestamp: new Date().toISOString(),
    };

    //Sends the message with the data to the backend (background.js) to be processed 
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



// Listen for messages from background script  
// This event listener listens for messages sent via chrome.runtime.sendMessage() from other parts 
// of your Chrome extension (like the background script or popup, or through the websocket server).
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  //This handles the case where you switch to this tab from another tab and reinitialize content.js to still work.
  if (message.action === "reinitialize") {
    lastProcessedQuestion = null;
    
    console.log("Reinitializing content script...");
    initializeExtraction();  // Restart everything properly
    
    console.log("Content script reinitialized.");
  }
  
  if (message.action === "fillAnswer") {
    console.log("Received GPT answer:", message.answer);
    if (clickAnswer(message.answer)) {
      console.log("Successfully handled answer");
    } else {
      console.warn("Could not handle answer:", message.answer);
    }
  }
});


// Watch for DOM changes by instantiating Document Object Model Observer
const observer = new MutationObserver((mutations) => {
  // This is callback function which checks if the mutation is of type "childList", 
  // which means that child nodes (elements) were added or removed from the DOM. Most common type 
  // for detecting when new content (like questions, answers, or the open button) are added to the page. 
  for (const mutation of mutations) {
    if (mutation.type === "childList") {
      // Then call all necessary functions when something is detected 
      console.log("Observer running functions");
      extractTopHatContent(); 
      clickOpenButton();
      clickUnansweredQuestion();
      //debugNotificationElements();
    }
  }
});


//Initialization Procedures (when page in first loaded this setups up everything in the script)---------------------------------------

// Add to initialization 
function initializeExtraction() {
  console.log("Initializing content script...");

  //Starts observing Dom by calling MutationObserver Object .observe and specifying which elements to observe.
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true,
  });

  //Delay the element search for DOM to load
  setTimeout(() => {
    console.log("Running extraction functions...");
    extractTopHatContent();
    clickOpenButton();
    clickUnansweredQuestion();
    //debugNotificationElements(); 
  }, 500)
}

//Checks current loading state of document and initializes the observer and immediately updates 
// everything in either case (if document already loaded or is loading)
if (document.readyState === "loading") {
  console.log("Page loading, waiting for DOMContentLoaded...");
  document.addEventListener("DOMContentLoaded", initializeExtraction);
} else {
  console.log("Page already loaded, running initialization now.");
  initializeExtraction();
}



//After window is unloaded, disconnect the observer--------------------------------------
window.addEventListener("unload", () => {
  observer.disconnect();
});
