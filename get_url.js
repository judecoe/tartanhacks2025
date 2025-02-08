const puppeteer = require("puppeteer");
const fs = require("fs");

(async () => {
    const browser = await puppeteer.launch({
        headless: false, // Set to true for silent automation
        args: ["--disable-extensions-except=<EXTENSION_PATH>", "--load-extension=<EXTENSION_PATH>"]
    });

    const page = await browser.newPage();

    // Open Chrome extension's background page
    await page.goto("chrome://extensions");

    // Extract stored TopHat URL from Chrome Storage API
    const tophatUrl = await page.evaluate(() => {
        return new Promise((resolve) => {
            chrome.storage.local.get("tophatUrl", (data) => resolve(data.tophatUrl));
        });
    });

    console.log("Extracted URL:", tophatUrl);

    // Save to JSON file for Selenium
    fs.writeFileSync("tophat_url.json", JSON.stringify({ url: tophatUrl }, null, 4));

    await browser.close();
})();