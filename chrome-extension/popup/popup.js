//When instantiating popup.html, this script runs and initializes an event listener for when the document is loaded.

//This event listeners retrieves the observer state and depending on if its active will send message to content.js
//for activating the observer. 
document.addEventListener("DOMContentLoaded", () => {
    const toggleButton = document.getElementById("toggleObserver");

    // Get the current observer state
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs.length === 0) return;
        chrome.tabs.sendMessage(tabs[0].id, { action: "toggleObservation" }, (response) => {
            if (chrome.runtime.lastError) {
                console.warn("Error communicating with content script:", chrome.runtime.lastError);
                return;
            }
            updateButton(response?.observerActive);
        });
    });

    // Toggle observer on button click
    toggleButton.addEventListener("click", () => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs.length === 0) return;
            chrome.tabs.sendMessage(tabs[0].id, { action: "toggleObservation" }, (response) => {
                if (chrome.runtime.lastError) {
                    console.warn("Error communicating with content script:", chrome.runtime.lastError);
                    return;
                }
                updateButton(response?.observerActive);
            });
        });
    });

    function updateButton(isActive) {
        toggleButton.textContent = isActive ? "Connect to Tophat Tab" : "Disconnect";
    }
});
