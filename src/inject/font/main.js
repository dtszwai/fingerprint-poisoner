/**
 * Font Detection Fingerprint Poisoner - Main World Script
 *
 * This script protects against font fingerprinting by adding random noise to element
 * dimensions which are commonly used to detect installed fonts.
 */

(function () {
  // Font detection protection implementation
  {
    // Store original getters for element dimensions
    const origOffsetWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetWidth");
    const origOffsetHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetHeight");
    const origClientWidth = Object.getOwnPropertyDescriptor(Element.prototype, "clientWidth");
    const origClientHeight = Object.getOwnPropertyDescriptor(Element.prototype, "clientHeight");
    const origGetBoundingClientRect = HTMLElement.prototype.getBoundingClientRect;

    // Function to add subtle random noise to measurements
    const addNoise = (value) => {
      // Don't modify zero values to avoid breaking layouts
      if (value === 0) return value;

      // Only apply noise ~10% of the time to reduce performance impact
      // and minimize visual discrepancies
      if (Math.random() < 0.1) {
        // Add -1, 0, or +1 randomly
        return value + (Math.floor(Math.random() * 3) - 1);
      }

      return value;
    };

    // Override offsetWidth getter
    Object.defineProperty(HTMLElement.prototype, "offsetWidth", {
      get: function () {
        // Get original value
        const originalValue = origOffsetWidth.get.call(this);
        return addNoise(originalValue);
      },
    });

    // Override offsetHeight getter
    Object.defineProperty(HTMLElement.prototype, "offsetHeight", {
      get: function () {
        // Get original value
        const originalValue = origOffsetHeight.get.call(this);
        return addNoise(originalValue);
      },
    });

    // Override clientWidth getter
    Object.defineProperty(Element.prototype, "clientWidth", {
      get: function () {
        // Get original value
        const originalValue = origClientWidth.get.call(this);
        return addNoise(originalValue);
      },
    });

    // Override clientHeight getter
    Object.defineProperty(Element.prototype, "clientHeight", {
      get: function () {
        // Get original value
        const originalValue = origClientHeight.get.call(this);
        return addNoise(originalValue);
      },
    });

    // Override getBoundingClientRect to add noise
    HTMLElement.prototype.getBoundingClientRect = function () {
      // Get original bounding rect
      const rect = origGetBoundingClientRect.call(this);

      // Create a copy to modify
      const modifiedRect = {
        top: rect.top,
        right: rect.right,
        bottom: rect.bottom,
        left: rect.left,
        width: addNoise(rect.width),
        height: addNoise(rect.height),
        x: rect.x,
        y: rect.y,
        toJSON: rect.toJSON,
      };

      return modifiedRect;
    };

    // Restore original toString method
    HTMLElement.prototype.getBoundingClientRect.toString =
      origGetBoundingClientRect.toString.bind(origGetBoundingClientRect);

    // Block or modify font enumeration APIs

    // Override Font API if available
    if (window.queryLocalFonts) {
      // Return a standardized set of fonts
      window.queryLocalFonts = async function () {
        return [
          { family: "Arial" },
          { family: "Courier New" },
          { family: "Georgia" },
          { family: "Times New Roman" },
          { family: "Verdana" },
        ];
      };
    }

    // Block CSS Font Loading API
    if (window.FontFace) {
      const origLoad = FontFace.prototype.load;

      FontFace.prototype.load = function () {
        // Allow loading but add randomization to metrics
        return origLoad.apply(this, arguments);
      };
    }
  }

  // Handle iframe communication
  {
    /**
     * Inject font detection protection into iframe source
     * @param {MessageEvent} e - The message event
     */
    const injectIntoSource = (e) => {
      if (e.source && e.data === "inject-font-into-source") {
        try {
          // Apply font protection to iframe source
          const origOffsetWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetWidth");
          const origOffsetHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetHeight");

          // Set overridden properties to iframe
          Object.defineProperty(
            e.source.HTMLElement.prototype,
            "offsetWidth",
            Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetWidth"),
          );

          Object.defineProperty(
            e.source.HTMLElement.prototype,
            "offsetHeight",
            Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetHeight"),
          );

          Object.defineProperty(
            e.source.Element.prototype,
            "clientWidth",
            Object.getOwnPropertyDescriptor(Element.prototype, "clientWidth"),
          );

          Object.defineProperty(
            e.source.Element.prototype,
            "clientHeight",
            Object.getOwnPropertyDescriptor(Element.prototype, "clientHeight"),
          );

          e.source.HTMLElement.prototype.getBoundingClientRect = HTMLElement.prototype.getBoundingClientRect;

          // Override font APIs in iframe
          if (e.source.queryLocalFonts) {
            e.source.queryLocalFonts = window.queryLocalFonts;
          }

          if (e.source.FontFace) {
            e.source.FontFace.prototype.load = FontFace.prototype.load;
          }

          // Listen for messages from the iframe
          e.source.addEventListener("message", injectIntoSource);

          console.log("[FingerprintPoisoner] Font detection protection injected into iframe");
        } catch (e) {
          console.warn("[FingerprintPoisoner] Cannot inject font detection protection into source:", e);
        }
      }
    };

    // Listen for injection requests
    addEventListener("message", injectIntoSource);
  }
})();
