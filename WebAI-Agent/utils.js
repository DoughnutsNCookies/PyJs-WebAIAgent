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
