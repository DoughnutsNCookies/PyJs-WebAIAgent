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
export const waitForEvent = async (page, event) => {
  return page.evaluate((event) => {
    return new Promise((resolve, _) => {
      document.addEventListener(event, function () {
        resolve();
      });
    });
  }, event);
};

/**
 * Asynchronously pauses the execution for the specified number of milliseconds.
 *
 * @param {number} milliseconds - The number of milliseconds to pause the execution.
 * @returns {Promise<void>} - A promise that resolves after the specified number of milliseconds.
 */
export const sleep = async (milliseconds) => {
  return await new Promise((resolve, _) => {
    setTimeout(() => {
      resolve();
    }, milliseconds);
  });
};

/**
 * Converts an image file to a base64 data URI.
 *
 * @param {string} imageFile - The path to the image file.
 * @returns {Promise<string>} A promise that resolves with the base64 data URI of the image.
 */
export const imageToBase64 = async (imageFile) => {
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
};

/**
 * Prompts the user for input and returns the entered value.
 *
 * @param {string} text - The text to display as the prompt.
 * @returns {Promise<string>} A promise that resolves with the user's input.
 */
export const promptInput = async (text) => {
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
};

/**
 * Logs a message to a log file and console.
 *
 * @param {string} logfile - The path to the log file.
 * @param {string} message - The message to be logged.
 * @returns {Promise<void>} - A promise that resolves when the message is logged.
 */
export const log = async (logfile, message) => {
  const rawMessage = message.replace(/\x1b\[\d{1,2}m/g, "");

  fs.appendFile(logfile, rawMessage + "\n", (err) => {
    if (err) {
      console.error(RED + "Error writing to log file:" + err + RESET);
    }
  });
  console.log(message);
};

/**
 * Returns the current time in the format: YYYYMMDD-HHmmss.
 *
 * @returns {string} The current time in the format: YYYYMMDD-HHmmss.
 */
export const getCurrentTime = () => {
  const padZero = (num) => (num < 10 ? "0" + num : num);

  var now = new Date();
  var year = now.getFullYear();
  var month = padZero(now.getMonth() + 1);
  var day = padZero(now.getDate());
  var hours = padZero(now.getHours());
  var minutes = padZero(now.getMinutes());
  var seconds = padZero(now.getSeconds());

  return year + month + day + "-" + hours + "h" + minutes + "m" + seconds + "s";
};
