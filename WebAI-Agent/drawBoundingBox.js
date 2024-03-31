/**
 * Draws bounding boxes around visible elements on a web page.
 *
 * @param {Page} page - The page object representing the web page.
 * @returns {Promise<void>} - A promise that resolves when the bounding boxes are drawn.
 */
const drawBoundingBox = async (page) => {
  await page.evaluate(() => {
    document.querySelectorAll("[gpt-link-text]").forEach((e) => {
      e.removeAttribute("gpt-link-text");
    });
  });

  const elements = await page.$$(
    "a, button, input, textarea, select, details, [role=button], [role=link], [role=treeitem], [contenteditable], [tabindex]"
  );

  elements.forEach(async (e) => {
    await page.evaluate((e) => {
      /**
       * Checks if an element is visible on the web page.
       *
       * @param {HTMLElement} el - The element to check for visibility.
       * @returns {boolean} - Returns true if the element is visible, false otherwise.
       */
      const isElementVisible = (el) => {
        if (!el) return false;

        /**
         * Checks if the given element is visible based on its style properties.
         *
         * @param {HTMLElement} el - The element to check for visibility.
         * @returns {boolean} Returns true if the element is visible, false otherwise.
         */
        const isStyleVisible = (el) => {
          const style = window.getComputedStyle(el);
          return (
            style.width !== "0" &&
            style.height !== "0" &&
            style.opacity !== "0" &&
            style.display !== "none" &&
            style.visibility !== "hidden"
          );
        };

        /**
         * Checks if an element is within the viewport.
         *
         * @param {Element} el - The element to check.
         * @returns {boolean} Returns true if the element is within the viewport, false otherwise.
         */
        const isElementInViewport = (el) => {
          const rect = el.getBoundingClientRect();
          return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <=
              (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <=
              (window.innerWidth || document.documentElement.clientWidth)
          );
        };

        if (!isStyleVisible(el)) {
          return false;
        }

        // Traverse up the DOM and check if any ancestor element is hidden
        let parent = el;
        while (parent) {
          if (!isStyleVisible(parent)) {
            return false;
          }
          parent = parent.parentElement;
        }

        return isElementInViewport(el);
      };

      e.style.border = "2px solid red";
      e.style.borderRadius = "0px";

      const position = e.getBoundingClientRect();

      if (position.width > 5 && position.height > 5 && isElementVisible(e)) {
        const linkText = e.textContent.replace(/[^a-zA-Z0-9 ]/g, "");
        e.setAttribute("gpt-link-text", linkText);
      }
    }, e);
  });
};

export default drawBoundingBox;
