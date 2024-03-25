import puppeteer from "puppeteer";

const RESET = "\x1b[0m";
const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const BLUE = "\x1b[34m";

const URL = "https://docs.phantom.app"; // URL to browse
const IMG_DIR = "images/"; // Directory to save screenshots
const TIMEOUT = 4000; // Webpage timeout in milliseconds
const DEBUG = true; // Sets puppeteer to show browser window

/**
 * This function waits for a specific event to occur on the page.
 * @param {Page} page - The Puppeteer page object.
 * @param {string} event - The name of the event to wait for.
 * @returns {Promise<void>} - A promise that resolves when the event occurs.
 */
async function waitForEvent(page, event) {
  return page.evaluate((event) => {
    return new Promise((resolve, _) => {
      document.addEventListener(event, function () {
        resolve();
      });
    });
  }, event);
}

/**
 * Asynchronously pauses the execution for the specified number of milliseconds.
 * @param {number} milliseconds - The number of milliseconds to pause the execution.
 * @returns {Promise<void>} - A promise that resolves after the specified number of milliseconds.
 */
async function sleep(milliseconds) {
  return await new Promise((resolve, _) => {
    setTimeout(() => {
      resolve();
    }, milliseconds);
  });
}

/**
 * Initializes the agent by launching a puppeteer browser and creating a new page.
 * @async
 * @returns {Promise<Page>} The newly created page.
 */
const agentInit = async () => {
  const browser = await puppeteer.launch({
    headless: DEBUG,
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 1200, deviceScaleFactor: 1 });

  console.log(GREEN + "Agent initialized successfully!" + RESET);
  return page;
};

const browseURL = async (page, URL) => {
  console.log(GREEN + "Browsing URL: " + BLUE + URL + RESET);

  await page.goto(URL, {
    waitUntil: "domcontentloaded",
  });

  await Promise.race([waitForEvent(page, "load"), sleep(TIMEOUT)]);

  await page.screenshot({ path: IMG_DIR + "screenshot.png" });
  console.log(GREEN + "Screenshot saved!" + RESET);
};

const agent = async () => {
  var page = await agentInit();

  await browseURL(page, URL);
};

agent();
