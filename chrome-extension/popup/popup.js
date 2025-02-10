// document.getElementById("findTab").addEventListener("click", () => {
//   chrome.runtime.sendMessage({ action: "findTopHatTab" }, (response) => {
//     if (response.error) {
//       document.getElementById("output").textContent = response.error;
//     } else {
//       document.getElementById(
//         "output"
//       ).textContent = `TopHat found: ${response.url}`;
//       chrome.tabs.update(response.tabId, { active: true }); // Bring tab into focus
//     }
//   });
// });
