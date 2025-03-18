// FingerprintPoisoner detector script
// Detects fingerprinting attempts on websites

/**
 * FingerprintDetector monitors browser APIs commonly used for fingerprinting
 * and reports potential fingerprinting attempts
 */
class FingerprintDetector {
  constructor(options = {}) {
    this.options = Object.assign(
      {
        // Default options
        debug: false,
        reportCallback: null,
        sensitivityLevel: 2, // 1-3, with 3 being most sensitive
      },
      options,
    );

    this.detectedMethods = {
      canvas: 0,
      webgl: 0,
      audio: 0,
      fonts: 0,
      clientRects: 0,
      hardware: 0,
      behavior: 0,
    };

    this.isDetecting = false;
    this.fingerprinters = new Set(); // Used to track script origins
  }

  /**
   * Start detecting fingerprinting attempts
   */
  start() {
    if (this.isDetecting) return;
    this.isDetecting = true;

    // Monitor Canvas API
    this.monitorCanvas();

    // Monitor WebGL API
    this.monitorWebGL();

    // Monitor Audio API
    this.monitorAudio();

    // Monitor Font Detection
    this.monitorFonts();

    // Monitor Client Rects
    this.monitorClientRects();

    // Monitor hardware info
    this.monitorHardware();

    // Monitor behavior fingerprinting
    this.monitorBehavior();

    // Log if in debug mode
    if (this.options.debug) {
      console.log("[FingerprintDetector] Started monitoring for fingerprinting attempts");
    }
  }

  /**
   * Stop detecting fingerprinting attempts
   */
  stop() {
    this.isDetecting = false;
    // Note: We can't actually remove the proxied methods without page reload

    if (this.options.debug) {
      console.log("[FingerprintDetector] Stopped monitoring for fingerprinting attempts");
    }
  }

  /**
   * Monitor Canvas API for fingerprinting
   */
  monitorCanvas() {
    if (!window.HTMLCanvasElement) return;

    // Monitor toDataURL
    const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;
    const self = this;

    HTMLCanvasElement.prototype.toDataURL = function () {
      if (self.isDetecting) {
        self.detectFingerprinting("canvas", "toDataURL", this);
      }
      return originalToDataURL.apply(this, arguments);
    };

    // Monitor toBlob
    if (HTMLCanvasElement.prototype.toBlob) {
      const originalToBlob = HTMLCanvasElement.prototype.toBlob;

      HTMLCanvasElement.prototype.toBlob = function () {
        if (self.isDetecting) {
          self.detectFingerprinting("canvas", "toBlob", this);
        }
        return originalToBlob.apply(this, arguments);
      };
    }

    // Monitor getImageData
    if (CanvasRenderingContext2D.prototype.getImageData) {
      const originalGetImageData = CanvasRenderingContext2D.prototype.getImageData;

      CanvasRenderingContext2D.prototype.getImageData = function () {
        if (self.isDetecting) {
          self.detectFingerprinting("canvas", "getImageData", this.canvas);
        }
        return originalGetImageData.apply(this, arguments);
      };
    }
  }

  /**
   * Monitor WebGL API for fingerprinting
   */
  monitorWebGL() {
    if (!window.WebGLRenderingContext) return;

    // WebGL parameters commonly used for fingerprinting
    const WEBGL_FINGERPRINTING_PARAMS = [
      WebGLRenderingContext.VENDOR,
      WebGLRenderingContext.RENDERER,
      WebGLRenderingContext.VERSION,
      WebGLRenderingContext.SHADING_LANGUAGE_VERSION,
      WebGLRenderingContext.MAX_VERTEX_ATTRIBS,
      WebGLRenderingContext.MAX_TEXTURE_SIZE,
      WebGLRenderingContext.MAX_VIEWPORT_DIMS,
      WebGLRenderingContext.MAX_CUBE_MAP_TEXTURE_SIZE,
    ];

    // Monitor getParameter
    const originalGetParameter = WebGLRenderingContext.prototype.getParameter;
    const self = this;

    WebGLRenderingContext.prototype.getParameter = function (parameter) {
      if (self.isDetecting && WEBGL_FINGERPRINTING_PARAMS.includes(parameter)) {
        self.detectFingerprinting("webgl", "getParameter", null);
      }
      return originalGetParameter.apply(this, arguments);
    };

    // Monitor getExtension
    const originalGetExtension = WebGLRenderingContext.prototype.getExtension;

    WebGLRenderingContext.prototype.getExtension = function (name) {
      if (self.isDetecting) {
        self.detectFingerprinting("webgl", "getExtension", null);
      }
      return originalGetExtension.apply(this, arguments);
    };

    // Do the same for WebGL2 if available
    if (window.WebGL2RenderingContext) {
      const originalGetParameterWebGL2 = WebGL2RenderingContext.prototype.getParameter;

      WebGL2RenderingContext.prototype.getParameter = function (parameter) {
        if (self.isDetecting && WEBGL_FINGERPRINTING_PARAMS.includes(parameter)) {
          self.detectFingerprinting("webgl", "getParameter", null);
        }
        return originalGetParameterWebGL2.apply(this, arguments);
      };

      const originalGetExtensionWebGL2 = WebGL2RenderingContext.prototype.getExtension;

      WebGL2RenderingContext.prototype.getExtension = function (name) {
        if (self.isDetecting) {
          self.detectFingerprinting("webgl", "getExtension", null);
        }
        return originalGetExtensionWebGL2.apply(this, arguments);
      };
    }
  }

  /**
   * Monitor Audio API for fingerprinting
   */
  monitorAudio() {
    if (!window.AudioContext && !window.webkitAudioContext) return;

    const AudioContextConstructor = window.AudioContext || window.webkitAudioContext;
    const self = this;

    // Monitor createOscillator
    if (AudioContextConstructor.prototype.createOscillator) {
      const originalCreateOscillator = AudioContextConstructor.prototype.createOscillator;

      AudioContextConstructor.prototype.createOscillator = function () {
        if (self.isDetecting) {
          self.detectFingerprinting("audio", "createOscillator", null);
        }
        return originalCreateOscillator.apply(this, arguments);
      };
    }

    // Monitor getChannelData
    if (window.AudioBuffer && AudioBuffer.prototype.getChannelData) {
      const originalGetChannelData = AudioBuffer.prototype.getChannelData;

      AudioBuffer.prototype.getChannelData = function (channel) {
        if (self.isDetecting) {
          self.detectFingerprinting("audio", "getChannelData", null);
        }
        return originalGetChannelData.apply(this, arguments);
      };
    }

    // Monitor createAnalyser
    if (AudioContextConstructor.prototype.createAnalyser) {
      const originalCreateAnalyser = AudioContextConstructor.prototype.createAnalyser;

      AudioContextConstructor.prototype.createAnalyser = function () {
        if (self.isDetecting) {
          self.detectFingerprinting("audio", "createAnalyser", null);
        }
        return originalCreateAnalyser.apply(this, arguments);
      };
    }
  }

  /**
   * Monitor Font Detection for fingerprinting
   */
  monitorFonts() {
    const self = this;

    // Monitor document.fonts.check
    if (document.fonts && document.fonts.check) {
      const originalCheck = document.fonts.check;

      document.fonts.check = function (font, text) {
        if (self.isDetecting) {
          self.detectFingerprinting("fonts", "check", null);
        }
        return originalCheck.apply(this, arguments);
      };
    }

    // Monitor measureText
    if (CanvasRenderingContext2D.prototype.measureText) {
      const originalMeasureText = CanvasRenderingContext2D.prototype.measureText;

      CanvasRenderingContext2D.prototype.measureText = function (text) {
        if (self.isDetecting && self.isLikelyFontDetection(this, text)) {
          self.detectFingerprinting("fonts", "measureText", null);
        }
        return originalMeasureText.apply(this, arguments);
      };
    }
  }

  /**
   * Detect if measureText is being used for font detection
   */
  isLikelyFontDetection(ctx, text) {
    // Font detection often uses a specific text on many different fonts
    // or compares the same text with different fonts

    // Check if text is very short (often used in font detection)
    if (typeof text === "string" && text.length < 5) {
      return true;
    }

    // Check if using a very large or very small font (often used to detect rendering differences)
    const fontSize = parseInt(ctx.font);
    if (fontSize !== NaN && (fontSize > 100 || fontSize < 5)) {
      return true;
    }

    return false;
  }

  /**
   * Monitor ClientRects API for fingerprinting
   */
  monitorClientRects() {
    if (!Element.prototype.getBoundingClientRect) return;

    const originalGetBoundingClientRect = Element.prototype.getBoundingClientRect;
    const originalGetClientRects = Element.prototype.getClientRects;
    const self = this;

    // Monitor getBoundingClientRect
    Element.prototype.getBoundingClientRect = function () {
      if (self.isDetecting) {
        self.detectFingerprinting("clientRects", "getBoundingClientRect", this);
      }
      return originalGetBoundingClientRect.apply(this, arguments);
    };

    // Monitor getClientRects
    Element.prototype.getClientRects = function () {
      if (self.isDetecting) {
        self.detectFingerprinting("clientRects", "getClientRects", this);
      }
      return originalGetClientRects.apply(this, arguments);
    };
  }

  /**
   * Monitor hardware info access for fingerprinting
   */
  monitorHardware() {
    const self = this;

    // Monitor navigator properties
    const navigatorProps = [
      "userAgent",
      "appVersion",
      "platform",
      "hardwareConcurrency",
      "deviceMemory",
      "languages",
      "language",
      "plugins",
    ];

    // Create proxy for navigator
    const navigatorProxy = new Proxy(navigator, {
      get(target, prop) {
        if (navigatorProps.includes(prop) && self.isDetecting) {
          self.detectFingerprinting("hardware", `navigator.${prop}`, null);
        }
        return target[prop];
      },
    });

    // Try to replace navigator with proxy
    try {
      Object.defineProperty(window, "navigator", {
        value: navigatorProxy,
        writable: false,
        configurable: false,
      });
    } catch (e) {
      // Browser may prevent this; it's optional
    }

    // Monitor screen properties
    if (window.screen) {
      const screenProps = ["width", "height", "availWidth", "availHeight", "colorDepth", "pixelDepth", "orientation"];

      // Create proxy for screen
      const screenProxy = new Proxy(screen, {
        get(target, prop) {
          if (screenProps.includes(prop) && self.isDetecting) {
            self.detectFingerprinting("hardware", `screen.${prop}`, null);
          }
          return target[prop];
        },
      });

      // Try to replace screen with proxy
      try {
        Object.defineProperty(window, "screen", {
          value: screenProxy,
          writable: false,
          configurable: false,
        });
      } catch (e) {
        // Browser may prevent this; it's optional
      }
    }
  }

  /**
   * Monitor behavior fingerprinting techniques
   */
  monitorBehavior() {
    // This is harder to detect, but we can look for some indicators
    const self = this;

    // Mouse movement tracking
    const originalAddEventListener = EventTarget.prototype.addEventListener;

    EventTarget.prototype.addEventListener = function (type, listener, options) {
      // Mouse and touch events can be used for behavioral fingerprinting
      if (
        self.isDetecting &&
        ["mousemove", "mousedown", "mouseup", "touchstart", "touchmove", "touchend"].includes(type)
      ) {
        if (this === document || this === window || this === document.body) {
          self.detectFingerprinting("behavior", `addEventListener(${type})`, null);
        }
      }

      return originalAddEventListener.apply(this, arguments);
    };
  }

  /**
   * Detect and record a fingerprinting attempt
   */
  detectFingerprinting(method, api, element) {
    // Increment detection count for this method
    this.detectedMethods[method]++;

    // Get stack trace to identify the script
    const stack = new Error().stack || "";
    const scriptOrigin = this.extractScriptOrigin(stack);

    if (scriptOrigin) {
      this.fingerprinters.add(scriptOrigin);
    }

    // Check if this looks like an actual fingerprinting attempt
    const isLikelyFingerprinting = this.isLikelyFingerprinting(method, api, element);

    if (isLikelyFingerprinting) {
      // Report fingerprinting attempt
      this.reportFingerprinting(method, api, scriptOrigin);
    }
  }

  /**
   * Extract script origin from stack trace
   */
  extractScriptOrigin(stack) {
    // Try to find a URL in the stack trace
    const urlMatch = stack.match(/https?:\/\/[^/]+(\/[^:)]*)/);
    return urlMatch ? urlMatch[0] : "unknown";
  }

  /**
   * Determine if this is likely an actual fingerprinting attempt
   */
  isLikelyFingerprinting(method, api, element) {
    const sensitivityLevel = this.options.sensitivityLevel;

    // Canvas specific checks
    if (method === "canvas") {
      // Check if the canvas is small (often used for fingerprinting)
      if (element && element.width && element.height) {
        if (element.width < 300 && element.height < 300) {
          return true;
        }
      }

      // More sensitive level also counts larger canvases
      if (sensitivityLevel >= 3) {
        return true;
      }
    }

    // WebGL is often used for fingerprinting
    if (method === "webgl") {
      return true;
    }

    // Audio fingerprinting is very specific
    if (method === "audio") {
      return true;
    }

    // Multiple font detection is likely fingerprinting
    if (method === "fonts" && this.detectedMethods.fonts > 5) {
      return true;
    }

    // ClientRects are often used for fingerprinting when called many times
    if (method === "clientRects" && this.detectedMethods.clientRects > 10) {
      return true;
    }

    // Hardware checks depend on count
    if (method === "hardware") {
      return this.detectedMethods.hardware > 4 - sensitivityLevel;
    }

    // Behavior checks depend on count
    if (method === "behavior") {
      return this.detectedMethods.behavior > 5;
    }

    // Default: consider it fingerprinting if the sensitivity level is high
    return sensitivityLevel >= 3;
  }

  /**
   * Report a fingerprinting attempt
   */
  reportFingerprinting(method, api, scriptOrigin) {
    // Create report
    const report = {
      timestamp: new Date().toISOString(),
      method: method,
      api: api,
      scriptOrigin: scriptOrigin,
      url: window.location.href,
      domain: window.location.hostname,
    };

    // Log if in debug mode
    if (this.options.debug) {
      console.warn(`[FingerprintDetector] Detected ${method} fingerprinting via ${api}`, report);
    }

    // Send to callback if provided
    if (typeof this.options.reportCallback === "function") {
      this.options.reportCallback(report);
    }

    // Send message to content script
    if (window.postMessage) {
      window.postMessage(
        {
          type: "FINGERPRINT_DETECTED",
          data: report,
        },
        "*",
      );
    }
  }

  /**
   * Get detection summary
   */
  getSummary() {
    const detectionCount = Object.values(this.detectedMethods).reduce((sum, count) => sum + count, 0);

    return {
      detected: detectionCount > 0,
      detectionCount: detectionCount,
      methods: { ...this.detectedMethods },
      fingerprinters: Array.from(this.fingerprinters),
      url: window.location.href,
      domain: window.location.hostname,
    };
  }
}

// Create and start detector
const detector = new FingerprintDetector({
  debug: false,
  sensitivityLevel: 2,
  reportCallback: function (report) {
    // Send report to extension
    if (window.postMessage) {
      window.postMessage(
        {
          type: "FINGERPRINT_DETECTOR_REPORT",
          data: report,
        },
        "*",
      );
    }
  },
});

// Start the detector
detector.start();

// Periodically send summary to the extension
setInterval(() => {
  const summary = detector.getSummary();

  window.postMessage(
    {
      type: "FINGERPRINT_DETECTOR_SUMMARY",
      data: summary,
    },
    "*",
  );
}, 5000);
