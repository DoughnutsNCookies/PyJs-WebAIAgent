import puppeteer from "puppeteer";

const url = "https://docs.phantom.app";

const screen = async () => {
  const browser = await puppeteer.launch({
    headless: true, // Set to false to view the browser for debugging
  });
  const page = await browser.newPage();

  await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });

  await page.goto(url, {
    waitUntil: "networkidle0",
  });

  await page.screenshot({ path: "images/screenshot.png", fullPage: true });

  await browser.close();
};

screen();
