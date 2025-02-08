document.addEventListener("DOMContentLoaded", function () {
  const toggleSwitch = document.getElementById("toggle");

  chrome.storage.sync.get("autoAnswerEnabled", function (data) {
    toggleSwitch.checked = data.autoAnswerEnabled ?? false;
  });

  toggleSwitch.addEventListener("change", function () {
    const isEnabled = toggleSwitch.checked;

    chrome.storage.sync.set({ autoAnswerEnabled: isEnabled });

    chrome.runtime.sendMessage(
      { type: "toggle_auto_answer", enabled: isEnabled },
      function (response) {
        console.log("Message sent to background.js:", isEnabled);
      }
    );

    console.log("Toggle switched:", isEnabled);
  });
});
