/**
 * Screen Size Fingerprint Poisoner - Main World Script
 *
 * This script protects against fingerprinting based on screen size and resolution
 * by normalizing screen dimensions and adding subtle noise to size measurements.
 */

(function () {
  // Screen size protection implementation
  {
    // Define standard screen size (1920x1080)
    const standardScreenSize = {
      width: 1920,
      height: 1080,
      colorDepth: 24,
      pixelDepth: 24,
    };

    // Create a proxy for the Screen object
    const originalScreen = window.screen;

    // Function to add subtle random noise to dimension values
    const addNoise = (value, percentage = 0.02) => {
      // Add up to ±2% noise
      const noise = Math.floor((Math.random() * 2 - 1) * value * percentage);
      return value + noise;
    };

    // Create proxy handler for screen object
    const screenHandler = {
      get: function (target, prop) {
        if (prop === "width") {
          return addNoise(standardScreenSize.width);
        }
        if (prop === "height") {
          return addNoise(standardScreenSize.height);
        }
        if (prop === "availWidth") {
          return addNoise(standardScreenSize.width - 20);
        }
        if (prop === "availHeight") {
          return addNoise(standardScreenSize.height - 40);
        }
        if (prop === "colorDepth") {
          return standardScreenSize.colorDepth;
        }
        if (prop === "pixelDepth") {
          return standardScreenSize.pixelDepth;
        }
        if (prop === "availLeft" || prop === "left") {
          return 0;
        }
        if (prop === "availTop" || prop === "top") {
          return 0;
        }
        if (prop === "orientation") {
          return originalScreen.orientation;
        }

        // Return original value for other properties
        return originalScreen[prop];
      },
    };

    // Replace screen object with proxy
    window.screen = new Proxy(originalScreen, screenHandler);

    // Modify window dimensions
    const originalWindowProps = {
      innerWidth: Object.getOwnPropertyDescriptor(window, "innerWidth"),
      innerHeight: Object.getOwnPropertyDescriptor(window, "innerHeight"),
      outerWidth: Object.getOwnPropertyDescriptor(window, "outerWidth"),
      outerHeight: Object.getOwnPropertyDescriptor(window, "outerHeight"),
    };

    // Override window dimensions to be consistent with screen size
    if (originalWindowProps.innerWidth && originalWindowProps.innerWidth.get) {
      Object.defineProperty(window, "innerWidth", {
        get: function () {
          return addNoise(standardScreenSize.width - 30);
        },
      });
    }

    if (originalWindowProps.innerHeight && originalWindowProps.innerHeight.get) {
      Object.defineProperty(window, "innerHeight", {
        get: function () {
          return addNoise(standardScreenSize.height - 150);
        },
      });
    }

    if (originalWindowProps.outerWidth && originalWindowProps.outerWidth.get) {
      Object.defineProperty(window, "outerWidth", {
        get: function () {
          return addNoise(standardScreenSize.width);
        },
      });
    }

    if (originalWindowProps.outerHeight && originalWindowProps.outerHeight.get) {
      Object.defineProperty(window, "outerHeight", {
        get: function () {
          // Add ~70px for browser UI
          return addNoise(standardScreenSize.height - 80) + Math.floor(70 + Math.random() * 15);
        },
      });
    }

    // Modify devicePixelRatio
    const origDevicePixelRatio = window.devicePixelRatio;
    Object.defineProperty(window, "devicePixelRatio", {
      get: function () {
        // Normalize to 1 or 2
        return Math.round(origDevicePixelRatio) === 1 ? 1 : 2;
      },
    });
  }

  // Handle iframe communication
  {
    /**
     * Inject screen size protection into iframe source
     * @param {MessageEvent} e - The message event
     */
    const injectIntoSource = (e) => {
      if (e.source && e.data === "inject-screen-into-source") {
        try {
          // Clone our screen protection to the iframe
          e.source.screen = window.screen;

          // Clone our window dimension overrides
          Object.defineProperty(e.source, "innerWidth", Object.getOwnPropertyDescriptor(window, "innerWidth"));

          Object.defineProperty(e.source, "innerHeight", Object.getOwnPropertyDescriptor(window, "innerHeight"));

          Object.defineProperty(e.source, "outerWidth", Object.getOwnPropertyDescriptor(window, "outerWidth"));

          Object.defineProperty(e.source, "outerHeight", Object.getOwnPropertyDescriptor(window, "outerHeight"));

          Object.defineProperty(
            e.source,
            "devicePixelRatio",
            Object.getOwnPropertyDescriptor(window, "devicePixelRatio"),
          );

          // Listen for messages from the iframe
          e.source.addEventListener("message", injectIntoSource);

          console.log("[FingerprintPoisoner] Screen size protection injected into iframe");
        } catch (e) {
          console.warn("[FingerprintPoisoner] Cannot inject screen size protection into source:", e);
        }
      }
    };

    // Listen for injection requests
    addEventListener("message", injectIntoSource);
  }
})();
