import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { waitForEvent, sleep } from "./utils.js";
import drawBoundingBox from "./drawBoundingBox.js";

const RESET = "\x1b[0m";
const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const BLUE = "\x1b[34m";

const URL = "https://xiaoxintv.net/index.php/vod/play/id/46220/sid/1/nid/50.html"; // URL to browse
const IMG_DIR = "images/"; // Directory to save screenshots
const TIMEOUT = 4000; // Webpage timeout in milliseconds
const DEBUG = true; // Sets puppeteer to show browser window

/**
 * Initializes the agent by launching a Puppeteer browser instance and creating a new page.
 * 
 * @returns {Promise<[Page, Browser]>} A promise that resolves to an array containing the created page and browser instances.
 */
const agentInit = async () => {
  puppeteer.use(StealthPlugin());

  const browser = await puppeteer.launch({
    headless: DEBUG,
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 1200, deviceScaleFactor: 1 });

  console.log(GREEN + "Agent initialized successfully!" + RESET);
  return [page, browser];
};

const browseURL = async (page, URL) => {
  console.log(GREEN + "Browsing URL: " + BLUE + URL + RESET);

  try {
    await page.goto(URL, {
      waitUntil: "domcontentloaded",
    });
  } catch (error) {
    console.log(RED + error + RESET);
  }

  await Promise.race([waitForEvent(page, "load"), sleep(TIMEOUT)]);

  await drawBoundingBox(page);

  await page.screenshot({ path: IMG_DIR + "screenshot.png", fullPage: true });
  console.log(GREEN + "Screenshot saved!" + RESET);
};

const agent = async () => {
  var puppet = await agentInit();

  const page = puppet[0];
  const browser = puppet[1];

  await browseURL(page, URL);

  browser.close();
};

agent();
