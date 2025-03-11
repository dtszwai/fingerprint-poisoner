// inject.js - Fixed version that uses window.fingerprintSettings instead of chrome API

// Get settings from the window object (set by content script)
let settings = window.fingerprintSettings || {
  poisonCanvas: true,
  poisonFonts: true,
  spoofTimezone: true,
  hideWebRTC: true,
  modifyUserAgent: true,
  modifyScreenSize: true,
  hidePlugins: true,
  modifyNavigator: true,
  noise: 0.3,
};

// Store original methods to avoid infinite loops
const originalGetContext = HTMLCanvasElement.prototype.getContext;
const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;
const originalToBlob = HTMLCanvasElement.prototype.toBlob;
const originalGetImageData = CanvasRenderingContext2D.prototype.getImageData;
const originalMeasureText = CanvasRenderingContext2D.prototype.measureText;
const originalDateTimeFormat = Intl.DateTimeFormat;
const originalDateGetTimezoneOffset = Date.prototype.getTimezoneOffset;

function applyFingerprinting() {
  // Apply each protection based on settings
  if (settings.poisonCanvas) {
    poisonCanvas();
  }

  if (settings.poisonFonts) {
    poisonFonts();
  }

  if (settings.spoofTimezone) {
    spoofTimezone();
  }

  if (settings.hideWebRTC) {
    blockWebRTC();
  }

  if (settings.modifyUserAgent) {
    spoofUserAgent();
  }

  if (settings.modifyScreenSize) {
    modifyScreenProperties();
  }

  if (settings.hidePlugins) {
    hidePlugins();
  }

  if (settings.modifyNavigator) {
    modifyNavigatorProperties();
  }
}

// Function to add controlled noise to canvas data
function addNoiseToImageData(imageData) {
  const noise = settings.noise;
  for (let i = 0; i < imageData.data.length; i += 4) {
    // Add slight random variations to RGB values
    imageData.data[i] = Math.max(0, Math.min(255, imageData.data[i] + Math.floor((Math.random() - 0.5) * noise * 10)));
    imageData.data[i + 1] = Math.max(
      0,
      Math.min(255, imageData.data[i + 1] + Math.floor((Math.random() - 0.5) * noise * 10)),
    );
    imageData.data[i + 2] = Math.max(
      0,
      Math.min(255, imageData.data[i + 2] + Math.floor((Math.random() - 0.5) * noise * 10)),
    );
  }
  return imageData;
}

// Function to poison canvas fingerprinting
function poisonCanvas() {
  // Override toDataURL
  HTMLCanvasElement.prototype.toDataURL = function () {
    // Call original method
    const dataURL = originalToDataURL.apply(this, arguments);

    // If it's likely being used for fingerprinting (small canvas or hidden), add noise
    if (this.width <= 16 || this.height <= 16 || this.style.display === "none" || this.style.visibility === "hidden") {
      const ctx = this.getContext("2d");
      const imageData = ctx.getImageData(0, 0, this.width, this.height);
      const noisyImageData = addNoiseToImageData(imageData);
      ctx.putImageData(noisyImageData, 0, 0);
      return originalToDataURL.apply(this, arguments);
    }

    return dataURL;
  };

  // Override toBlob
  HTMLCanvasElement.prototype.toBlob = function (callback) {
    // For small or hidden canvases that might be used for fingerprinting
    if (this.width <= 16 || this.height <= 16 || this.style.display === "none" || this.style.visibility === "hidden") {
      const ctx = this.getContext("2d");
      const imageData = ctx.getImageData(0, 0, this.width, this.height);
      const noisyImageData = addNoiseToImageData(imageData);
      ctx.putImageData(noisyImageData, 0, 0);
    }

    originalToBlob.apply(this, arguments);
  };

  // Override getImageData
  CanvasRenderingContext2D.prototype.getImageData = function () {
    const imageData = originalGetImageData.apply(this, arguments);

    // If canvas size suggests fingerprinting
    if (this.canvas.width <= 16 || this.canvas.height <= 16) {
      return addNoiseToImageData(imageData);
    }

    return imageData;
  };
}

// Function to poison font fingerprinting
function poisonFonts() {
  // Override measureText to add slight random variations
  CanvasRenderingContext2D.prototype.measureText = function (text) {
    const metrics = originalMeasureText.apply(this, arguments);
    const noise = settings.noise * 0.05; // Smaller noise for text to avoid breaking layouts

    // Add subtle randomness to width
    const originalWidth = metrics.width;
    Object.defineProperty(metrics, "width", {
      get: function () {
        return originalWidth * (1 + (Math.random() - 0.5) * noise);
      },
    });

    return metrics;
  };

  // Modify font detection
  const originalMatchMedia = window.matchMedia;
  window.matchMedia = function (query) {
    // If query is checking for fonts
    if (query.includes("@font-face") || query.includes("font-family")) {
      // Randomly return false for some font checks
      if (Math.random() < settings.noise * 0.5) {
        return {
          matches: false,
          media: query,
        };
      }
    }
    return originalMatchMedia.apply(this, arguments);
  };
}

// Function to spoof timezone
function spoofTimezone() {
  // List of popular timezones (UTC offsets in minutes)
  const timezones = [-480, -420, -360, -300, -240, -180, -120, -60, 0, 60, 120, 180, 240, 300, 360, 420, 480, 540, 600];

  // Choose a random timezone that's different from the real one
  const realOffset = new Date().getTimezoneOffset();
  let fakeOffset;
  do {
    const randomIndex = Math.floor(Math.random() * timezones.length);
    fakeOffset = timezones[randomIndex];
  } while (fakeOffset === -realOffset); // Keep trying until we get a different timezone

  // Override getTimezoneOffset
  Date.prototype.getTimezoneOffset = function () {
    return fakeOffset;
  };

  // Override Intl.DateTimeFormat
  Intl.DateTimeFormat = function () {
    const format = new originalDateTimeFormat(...arguments);
    const originalFormatToParts = format.formatToParts;

    format.formatToParts = function () {
      const parts = originalFormatToParts.apply(this, arguments);

      // Modify timezone-related parts
      for (let i = 0; i < parts.length; i++) {
        if (parts[i].type === "timeZoneName") {
          // Generate fake timezone name based on our fake offset
          const hours = Math.abs(Math.floor(fakeOffset / 60));
          const sign = fakeOffset > 0 ? "-" : "+"; // Note: getTimezoneOffset returns inverse of UTC offset
          parts[i].value = `UTC${sign}${hours.toString().padStart(2, "0")}:00`;
        }
      }

      return parts;
    };

    return format;
  };

  // Make sure Intl.DateTimeFormat has all the original properties
  for (const prop in originalDateTimeFormat) {
    if (originalDateTimeFormat.hasOwnProperty(prop)) {
      Intl.DateTimeFormat[prop] = originalDateTimeFormat[prop];
    }
  }
  Intl.DateTimeFormat.prototype = originalDateTimeFormat.prototype;
}

// Function to block WebRTC leaks
function blockWebRTC() {
  // Overriding RTCPeerConnection to prevent IP leaks
  if (window.RTCPeerConnection) {
    const originalRTCPeerConnection = window.RTCPeerConnection;
    window.RTCPeerConnection = function () {
      const pc = new originalRTCPeerConnection(...arguments);

      // Override createOffer to remove IP candidates
      const originalCreateOffer = pc.createOffer;
      pc.createOffer = function (options) {
        return originalCreateOffer.apply(this, arguments).then((offer) => {
          // Modify SDP to remove potential IP leaking candidates
          offer.sdp = offer.sdp.replace(/UDP|TCP/g, "XXX");
          return offer;
        });
      };

      return pc;
    };
  }
}

// Function to spoof user agent
function spoofUserAgent() {
  // Common User Agents
  const userAgents = [
    // Chrome on Windows
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.102 Safari/537.36",
    // Chrome on Mac
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.102 Safari/537.36",
    // Edge on Windows
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.102 Safari/537.36 Edg/97.0.1072.69",
    // Firefox on Windows
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:97.0) Gecko/20100101 Firefox/97.0",
    // Safari on Mac
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.3 Safari/605.1.15",
  ];

  // Choose a random user agent
  const randomUserAgent = userAgents[Math.floor(Math.random() * userAgents.length)];

  // Override navigator.userAgent
  Object.defineProperty(navigator, "userAgent", {
    get: function () {
      return randomUserAgent;
    },
  });
}

// Function to modify screen properties
function modifyScreenProperties() {
  // Common screen resolutions
  const resolutions = [
    { width: 1366, height: 768 },
    { width: 1920, height: 1080 },
    { width: 1536, height: 864 },
    { width: 1440, height: 900 },
    { width: 1280, height: 720 },
  ];

  // Choose a random resolution
  const randomResolution = resolutions[Math.floor(Math.random() * resolutions.length)];

  // Override screen properties
  for (const prop of ["width", "height", "availWidth", "availHeight"]) {
    Object.defineProperty(screen, prop, {
      get: function () {
        return prop.includes("width") ? randomResolution.width : randomResolution.height;
      },
    });
  }

  // Adjust window.innerWidth/Height slightly (less aggressive to avoid breaking layouts)
  const originalInnerWidth = window.innerWidth;
  const originalInnerHeight = window.innerHeight;

  Object.defineProperty(window, "innerWidth", {
    get: function () {
      return originalInnerWidth * (1 + (Math.random() - 0.5) * settings.noise * 0.1);
    },
  });

  Object.defineProperty(window, "innerHeight", {
    get: function () {
      return originalInnerHeight * (1 + (Math.random() - 0.5) * settings.noise * 0.1);
    },
  });
}

// Function to hide plugins
function hidePlugins() {
  // Create fake minimal plugins array
  const fakePlugins = {
    length: 0,
    item: function () {
      return null;
    },
    namedItem: function () {
      return null;
    },
    refresh: function () {},
  };

  // Override navigator.plugins
  Object.defineProperty(navigator, "plugins", {
    get: function () {
      return fakePlugins;
    },
  });

  // Override navigator.mimeTypes
  Object.defineProperty(navigator, "mimeTypes", {
    get: function () {
      return { length: 0 };
    },
  });
}

// Function to modify navigator properties
function modifyNavigatorProperties() {
  // List of properties to modify
  const props = {
    hardwareConcurrency: [2, 4, 8],
    deviceMemory: [2, 4, 8],
    language: ["en-US", "en-GB", "en-CA"],
    languages: [["en-US"], ["en-US", "en"], ["en-GB", "en"]],
    platform: ["Win32", "MacIntel", "Linux x86_64"],
  };

  // Override each property with a random value
  for (const [prop, values] of Object.entries(props)) {
    if (prop in navigator) {
      const randomValue = values[Math.floor(Math.random() * values.length)];
      Object.defineProperty(navigator, prop, {
        get: function () {
          return randomValue;
        },
      });
    }
  }

  // Special handling for navigator.connection
  if (navigator.connection) {
    const originalConnection = navigator.connection;
    Object.defineProperty(navigator, "connection", {
      get: function () {
        const fakeConnection = {};
        // Copy all properties
        for (const key in originalConnection) {
          if (key === "effectiveType") {
            fakeConnection[key] = ["4g", "3g"][Math.floor(Math.random() * 2)];
          } else if (key === "rtt") {
            fakeConnection[key] = [0, 50, 100][Math.floor(Math.random() * 3)];
          } else if (key === "downlink") {
            fakeConnection[key] = [5, 10, 15][Math.floor(Math.random() * 3)];
          } else if (typeof originalConnection[key] !== "function") {
            fakeConnection[key] = originalConnection[key];
          }
        }
        return fakeConnection;
      },
    });
  }
}

// Make this function accessible globally so content script can call it
window.applyFingerprinting = applyFingerprinting;

// Apply fingerprinting protections immediately
applyFingerprinting();
