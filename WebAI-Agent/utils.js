import fs from "fs";
import readline from "readline";

const RED = "\x1b[31m";

/**
 * This function waits for a specific event to occur on the page.
 *
 * @param {Page} page - The Puppeteer page object.
 * @param {string} event - The name of the event to wait for.
 * @returns {Promise<void>} - A promise that resolves when the event occurs.
 */
export async function waitForEvent(page, event) {
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
 *
 * @param {number} milliseconds - The number of milliseconds to pause the execution.
 * @returns {Promise<void>} - A promise that resolves after the specified number of milliseconds.
 */
export async function sleep(milliseconds) {
  return await new Promise((resolve, _) => {
    setTimeout(() => {
      resolve();
    }, milliseconds);
  });
}

/**
 * Converts an image file to a base64 data URI.
 *
 * @param {string} imageFile - The path to the image file.
 * @returns {Promise<string>} A promise that resolves with the base64 data URI of the image.
 */
export async function imageToBase64(imageFile) {
  return await new Promise((resolve, reject) => {
    fs.readFile(imageFile, (err, data) => {
      if (err) {
        console.error(RED + "Error reading file:" + err + RESET);
        reject(err);
        return;
      }
      const base64Data = data.toString("base64");
      const dataURI = `data:image/jpeg;base64,${base64Data}`;
      resolve(dataURI);
    });
  });
}

/**
 * Prompts the user for input and returns the entered value.
 *
 * @param {string} text - The text to display as the prompt.
 * @returns {Promise<string>} A promise that resolves with the user's input.
 */
export async function promptInput(text) {
  let returningPrompt;

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  await (async () => {
    return new Promise((resolve) => {
      rl.question(text, (prompt) => {
        returningPrompt = prompt;
        rl.close();
        resolve();
      });
    });
  })();

  return returningPrompt;
}
