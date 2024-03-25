import puppeteer from "puppeteer";

const url = "https://en.wikipedia.org/wiki/OpenAI";

const screen = async () => {
  const browser = await puppeteer.launch({
    headless: false,
  });
  const page = await browser.newPage();

  await page.setViewport({
    width: 640,
    height: 480,
    deviceScaleFactor: 1,
  });

  await page.goto(url, {
    waitUntil: "networkidle0",
  });

  await browser.close();
};

screen();
