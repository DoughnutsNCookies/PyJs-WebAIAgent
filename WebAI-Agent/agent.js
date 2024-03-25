import puppeteer from "puppeteer";

const RESET = "\x1b[0m";
const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const BLUE = "\x1b[34m";

const URL = "https://docs.phantom.app";
const IMG_DIR = "images/";
const TIMEOUT = 4000;
const DEBUG = true; // Sets puppeteer to show browser window

async function waitForEvent(page, event) {
  return page.evaluate((event) => {
    return new Promise((r, _) => {
      document.addEventListener(event, function (e) {
        r();
      });
    });
  }, event);
}

async function sleep(milliseconds) {
  return await new Promise((r, _) => {
    setTimeout(() => {
      r();
    }, milliseconds);
  });
}

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
