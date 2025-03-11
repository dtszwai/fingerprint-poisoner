// content.js
// This runs in the context of web pages to alter fingerprinting behavior

// Get configuration from background script
let config = null;

function getConfig() {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ action: "getConfig" }, (response) => {
      config = response;
      resolve(config);
    });
  });
}

// Get specific values (possibly randomized) from background script
function getValues() {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ action: "requestValues" }, (response) => {
      resolve(response);
    });
  });
}

// Apply protections based on configuration
async function applyProtections() {
  if (!config) {
    await getConfig();
  }

  if (!config.enabled) return;

  // Get potentially randomized values
  const values = await getValues();

  // Note: User-Agent spoofing is handled by declarativeNetRequest in background.js
  // This is more reliable than trying to override the navigator.userAgent property

  // Spoof timezone
  if (config.spoofTimezone) {
    const timezone = values.timezone;
    const timezoneOffset = getTimezoneOffset(timezone);

    const dateToString = Date.prototype.toString;
    Date.prototype.toString = function () {
      const dateStr = dateToString.call(this);
      return dateStr.replace(/\(.*?\)/, `(${timezone})`);
    };

    Date.prototype.getTimezoneOffset = function () {
      return timezoneOffset;
    };

    // Handle Intl.DateTimeFormat to be consistent
    try {
      const originalDateTimeFormat = Intl.DateTimeFormat;
      window.Intl.DateTimeFormat = function (locales, options) {
        if (options === undefined) {
          options = {};
        }
        options.timeZone = timezone;
        return new originalDateTimeFormat(locales, options);
      };
      window.Intl.DateTimeFormat.prototype = originalDateTimeFormat.prototype;
    } catch (e) {
      console.error("Failed to override Intl.DateTimeFormat", e);
    }
  }

  // Block or poison Canvas fingerprinting
  if (config.blockCanvas) {
    const canvasProto = CanvasRenderingContext2D.prototype;
    const canvasMethods = [
      "getImageData",
      "getLineDash",
      "measureText",
      "isPointInPath",
      "isPointInStroke",
      "getContextAttributes",
    ];

    for (const method of canvasMethods) {
      const original = canvasProto[method];

      if (original) {
        canvasProto[method] = function () {
          const result = original.apply(this, arguments);

          // Add subtle noise to canvas data
          if (method === "getImageData" && result && result.data) {
            for (let i = 0; i < result.data.length; i += 4) {
              // Add very minor variations to RGB channels (±1)
              result.data[i] = Math.max(0, Math.min(255, result.data[i] + (Math.random() > 0.5 ? 1 : -1)));
              result.data[i + 1] = Math.max(0, Math.min(255, result.data[i + 1] + (Math.random() > 0.5 ? 1 : -1)));
              result.data[i + 2] = Math.max(0, Math.min(255, result.data[i + 2] + (Math.random() > 0.5 ? 1 : -1)));
            }
          }

          return result;
        };
      }
    }

    // Handle toDataURL and toBlob separately
    const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;
    HTMLCanvasElement.prototype.toDataURL = function () {
      // Add a small amount of noise to the canvas before generating the data URL
      const ctx = this.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "rgba(255, 255, 255, 0.001)";
        ctx.fillRect(Math.random() * this.width, Math.random() * this.height, 1, 1);
      }
      return originalToDataURL.apply(this, arguments);
    };

    const originalToBlob = HTMLCanvasElement.prototype.toBlob;
    HTMLCanvasElement.prototype.toBlob = function () {
      // Add a small amount of noise to the canvas before generating the blob
      const ctx = this.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "rgba(255, 255, 255, 0.001)";
        ctx.fillRect(Math.random() * this.width, Math.random() * this.height, 1, 1);
      }
      return originalToBlob.apply(this, arguments);
    };
  }

  // Block WebRTC
  if (config.blockWebRTC) {
    try {
      // Create dummy implementations that do nothing
      window.RTCPeerConnection = function () {
        return {
          createDataChannel: function () {
            return {};
          },
          createOffer: function () {
            return Promise.resolve({});
          },
          createAnswer: function () {
            return Promise.resolve({});
          },
          addEventListener: function () {},
          removeEventListener: function () {},
          dispatchEvent: function () {
            return true;
          },
          setLocalDescription: function () {
            return Promise.resolve();
          },
          setRemoteDescription: function () {
            return Promise.resolve();
          },
          addIceCandidate: function () {
            return Promise.resolve();
          },
          getStats: function () {
            return Promise.resolve({});
          },
          close: function () {},
        };
      };
      window.webkitRTCPeerConnection = window.RTCPeerConnection;
    } catch (e) {
      console.error("Failed to block WebRTC", e);
    }
  }

  // Block WebGL
  if (config.blockWebGL) {
    const getContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function () {
      const type = arguments[0];
      if (type === "webgl" || type === "experimental-webgl" || type === "webgl2" || type === "experimental-webgl2") {
        // Return null to indicate WebGL is not supported
        return null;
      }
      return getContext.apply(this, arguments);
    };
  }

  // Spoof AudioContext fingerprinting
  if (config.spoofAudioContext) {
    if (window.AudioContext || window.webkitAudioContext) {
      const AudioContextConstructor = window.AudioContext || window.webkitAudioContext;
      const originalAudioContext = AudioContextConstructor;

      window.AudioContext = window.webkitAudioContext = function () {
        const audioContext = new originalAudioContext();

        // Override the destination node's channelCount properties
        Object.defineProperty(audioContext.destination, "channelCount", {
          get: function () {
            // Return a slightly randomized channel count to introduce variability
            return Math.floor(2 + Math.random() * 0.001);
          },
        });

        // Override createOscillator
        const originalCreateOscillator = audioContext.createOscillator;
        audioContext.createOscillator = function () {
          const oscillator = originalCreateOscillator.call(audioContext);
          const originalFrequency = oscillator.frequency.value;

          // Add a tiny bit of noise to the frequency
          oscillator.frequency.value = originalFrequency + (Math.random() * 0.001 - 0.0005);

          return oscillator;
        };

        // Override createAnalyser
        const originalCreateAnalyser = audioContext.createAnalyser;
        audioContext.createAnalyser = function () {
          const analyser = originalCreateAnalyser.call(audioContext);
          const originalGetByteFrequencyData = analyser.getByteFrequencyData;
          const originalGetFloatFrequencyData = analyser.getFloatFrequencyData;

          analyser.getByteFrequencyData = function (array) {
            originalGetByteFrequencyData.call(analyser, array);
            // Add slight noise to the frequency data
            for (let i = 0; i < array.length; i++) {
              array[i] = Math.max(0, Math.min(255, array[i] + (Math.random() > 0.5 ? 1 : -1)));
            }
          };

          analyser.getFloatFrequencyData = function (array) {
            originalGetFloatFrequencyData.call(analyser, array);
            // Add slight noise to the frequency data
            for (let i = 0; i < array.length; i++) {
              array[i] = array[i] + (Math.random() * 0.1 - 0.05);
            }
          };

          return analyser;
        };

        return audioContext;
      };

      window.AudioContext.prototype = originalAudioContext.prototype;
      window.webkitAudioContext.prototype = originalAudioContext.prototype;
    }
  }
}

// Helper function to get timezone offset in minutes
function getTimezoneOffset(timezone) {
  // Simple mapping of common timezones to their offsets in minutes
  const timezoneOffsets = {
    "America/New_York": 240, // UTC-4
    "America/Los_Angeles": 420, // UTC-7
    "Europe/London": 0, // UTC+0
    "Europe/Paris": -60, // UTC+1
    "Asia/Tokyo": -540, // UTC+9
  };

  return timezoneOffsets[timezone] || 0;
}

// Listen for configuration updates
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "configUpdated") {
    config = request.config;
  }
  return true;
});

// Apply protections as soon as possible
applyProtections();
