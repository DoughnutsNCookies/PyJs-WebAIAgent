import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import OpenAI from "openai";
import dotenv from "dotenv";
import fs from "fs";

import {
  waitForEvent,
  sleep,
  imageToBase64,
  promptInput,
  log,
  getCurrentTime,
} from "./utils.js";
import drawBoundingBox from "./drawBoundingBox.js";

dotenv.config();

const RESET = "\x1b[0m";
const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const BLUE = "\x1b[34m";
const PURPLE = "\x1b[35m";

const TIMEOUT = 4000; // Webpage timeout in milliseconds
const DEBUG = false; // Sets puppeteer to show browser window
const OPENAI = new OpenAI();
const CURRENT_TIME = getCurrentTime();

// Directory to save screenshots
const IMG_DIR = "images/";
if (!fs.existsSync(IMG_DIR)) {
  fs.mkdirSync(IMG_DIR);
}
const IMG_FILE = `${IMG_DIR}screenshot.jpg`;

// Using date and time in the log file name
const LOG_DIR = "logs/";
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR);
}
const LOG_FILE = `${LOG_DIR}log-${CURRENT_TIME}.txt`;
fs.writeFileSync(LOG_FILE, "");

const AI_SYSTEM = {
  role: "system",
  content: `You're a website crawler. You'll be given instructions on what to do by browsing. You're connected to a web browser and you'll be given the screenshot of the website you're currently on. All links on the website will be highlighted in red in the screenshot. Always read what's in the screenshot. Don't guess link names.

	You can go to a specific URL by answering with the following JSON format:
	{"url": "url goes here"}

	You can click links on the website by referencing the text inside of the link/button, by answering in the following JSON format:
	{"click": "Text in link"}

	Once you're on a URL and you have found the answer to the user's question, you can answer with a regular message.

	Use google search by set a sub-page like 'https://google.com/search?q=search' if applicable. Prefer to use Google for simple queries. If the user provides a direct URL, go to that one. Do not make up links`,
};
const AI_SCREENSHOT =
  'Here\'s the screenshot of the website you\'re on right now. You can click on links with {"click": "Link text"} or you can crawl to another URL if this one is incorrect. If you find the answer to the user\'s question, you can respond normally.';

/**
 * Initializes the agent.
 *
 * @returns {Promise<Object>} An object containing the initialized page, browser, messages, url, and screenshotTaken properties.
 */
const agentInit = async () => {
  log(LOG_FILE, BLUE + "Initializing agent..." + RESET);

  puppeteer.use(StealthPlugin());
  const browser = await puppeteer.launch({
    headless: !DEBUG,
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 1200, deviceScaleFactor: 1 });

  log(LOG_FILE, GREEN + "Agent initialized successfully!" + RESET);
  return {
    page: page,
    browser: browser,
    messages: [AI_SYSTEM],
    url: null,
    screenshotTaken: false,
  };
};

/**
 * Browse the specified URL and take a screenshot of the page.
 *
 * @param {Object} agentObj - The agent object containing the URL and other properties.
 * @returns {Promise<void>} - A promise that resolves when the screenshot is saved.
 */
const browseURL = async (agentObj) => {
  log(LOG_FILE, PURPLE + "Browsing url: " + BLUE + agentObj.url + RESET);

  await agentObj.page.goto(agentObj.url, {
    waitUntil: "domcontentloaded",
    timeout: TIMEOUT,
  });

  await Promise.race([waitForEvent(agentObj.page, "load"), sleep(TIMEOUT)]);

  await drawBoundingBox(agentObj.page);

  await agentObj.page.screenshot({
    path: IMG_FILE,
    quality: 100,
  });

  agentObj.screenshotTaken = true;
  agentObj.url = null;

  log(LOG_FILE, GREEN + "Screenshot saved!" + RESET);
};

/**
 * Processes the screenshot and adds it to the agent's messages.
 *
 * @param {object} agentObj - The agent object.
 * @returns {Promise<void>} - A promise that resolves when the screenshot is processed.
 */
const processScreenshot = async (agentObj) => {
  log(LOG_FILE, PURPLE + "Processing screenshot..." + RESET);

  const base64 = await imageToBase64(IMG_DIR + "screenshot.jpg");
  agentObj.messages.push({
    role: "user",
    content: [
      {
        type: "image_url",
        image_url: base64,
      },
      {
        type: "text",
        text: AI_SCREENSHOT,
      },
    ],
  });
  agentObj.screenshotTaken = false;
};

/**
 * Handles the click event on a web page.
 *
 * @param {Object} agentObj - The agent object.
 * @param {string} message - The message containing the click event details.
 * @returns {Promise<void>} - A promise that resolves when the click event is handled.
 * @throws {Error} - If the link cannot be found.
 */
const handleClick = async (agentObj, message) => {
  let parts = message.split('{"click": "');
  parts = parts[1].split('"}');
  const linkText = parts[0].replace(/[^a-zA-Z0-9 ]/g, "");

  log(LOG_FILE, PURPLE + "Clicking on " + linkText + RESET);

  try {
    const elements = await agentObj.page.$$("[gpt-link-text]");

    let partial;
    let exact;

    for (const element of elements) {
      const attributeValue = await element.evaluate((el) =>
        el.getAttribute("gpt-link-text")
      );

      if (attributeValue.includes(linkText)) {
        log(
          LOG_FILE,
          PURPLE + "Partial match found: " + attributeValue + RESET
        );
        partial = element;
      }

      if (attributeValue === linkText) {
        log(LOG_FILE, PURPLE + "Exact match found: " + attributeValue + RESET);
        exact = element;
      }
    }

    if (exact || partial) {
      const [response] = await Promise.all([
        agentObj.page
          .waitForNavigation({ waitUntil: "domcontentloaded" })
          .catch((e) =>
            log(
              LOG_FILE,
              RED + "Navigation timeout/error: " + e.message + RESET
            )
          ),
        (exact || partial).click(),
      ]);

      // Additional checks can be done here, like validating the response or URL
      await Promise.race([waitForEvent(agentObj.page, "load"), sleep(TIMEOUT)]);

      await drawBoundingBox(agentObj.page);

      await agentObj.page.screenshot({
        path: IMG_FILE,
        quality: 100,
      });

      agentObj.screenshotTaken = true;
      log(LOG_FILE, GREEN + "Screenshot saved!" + RESET);
    } else {
      throw new Error("Cannot find link");
    }
  } catch (error) {
    log(LOG_FILE, RED + "ERROR: Clicking failed " + error + RESET);

    agentObj.messages.push({
      role: "user",
      content: "ERROR: I was unable to click that element",
    });
  }
};

/**
 * Sets the URL property of the agentObj based on the provided message.
 *
 * @param {object} agentObj - The agent object to update.
 * @param {string} message - The message containing the URL.
 * @returns {Promise<void>} - A promise that resolves once the URL is set.
 */
const getURL = async (agentObj, message) => {
  log(LOG_FILE, PURPLE + "Parsing URL..." + RESET);

  let parts = message.split('{"url": "');
  parts = parts[1].split('"}');
  agentObj.url = parts[0];

  log(LOG_FILE, PURPLE + "URL set to: " + BLUE + agentObj.url + RESET);
};

/**
 * Represents the main agent function.
 * The agent interacts with the user by sending and receiving messages.
 * It can browse URLs, take screenshots, click on links, and provide answers to the user's questions using OpenAI's GPT-4 Vision model.
 * The agent logs all interactions to a log file.
 *
 * @returns {Promise<void>} A promise that resolves when the agent finishes its execution.
 */
const agent = async () => {
  var agentObj = await agentInit();

  log(LOG_FILE, YELLOW + "Agent: How can I assist you today?" + RESET);
  const prompt = await promptInput("You: ");
  log(LOG_FILE, "You: " + prompt + "\n");

  agentObj.messages.push({ role: "user", content: prompt });

  while (true) {
    if (agentObj.url) await browseURL(agentObj);

    if (agentObj.screenshotTaken) await processScreenshot(agentObj);

    const response = await OPENAI.chat.completions.create({
      model: "gpt-4-vision-preview",
      max_tokens: 1024,
      messages: agentObj.messages,
    });

    const message = response.choices[0].message.content;

    agentObj.messages.push({
      role: "assistant",
      content: message,
    });

    log(LOG_FILE, YELLOW + "Agent: " + message + RESET);

    if (message.indexOf('{"click": "') !== -1) {
      await handleClick(agentObj, message);
      continue;
    } else if (message.indexOf('{"url": "') !== -1) {
      await getURL(agentObj, message);
      continue;
    }

    const prompt = await promptInput("You: ");
    log(LOG_FILE, "You: " + prompt + "\n");

    agentObj.messages.push({ role: "user", content: prompt });
  }
};

agent();
