import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import OpenAI from "openai";
import process from "process";
import dotenv from "dotenv";
dotenv.config();

import { waitForEvent, sleep, imageToBase64 } from "./utils.js";
import drawBoundingBox from "./drawBoundingBox.js";

const RESET = "\x1b[0m";
const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const BLUE = "\x1b[34m";

const URL = "https://docs.phantom.app"; // URL to browse
const IMG_DIR = "images/"; // Directory to save screenshots
const TIMEOUT = 4000; // Webpage timeout in milliseconds
const DEBUG = true; // Sets puppeteer to show browser window

/**
 * Initializes the agent by launching a puppeteer browser and creating a new page.
 *
 * @returns {Promise<Page>} The newly created page.
 */
const agentInit = async () => {
  console.log(BLUE + "Initializing agent..." + RESET);

  puppeteer.use(StealthPlugin());
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
  var page = await agentInit();

  await browseURL(page, URL);

  process.exit(0);
};

agent();
