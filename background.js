// FingerprintPoisoner background script
// Handles header modifications and extension setup using Manifest V3 compatible approaches

// Default settings
const defaultSettings = {
  enabled: true,
  poisonUserAgent: true,
  poisonCanvas: true,
  poisonWebGL: true,
  poisonAudioContext: true,
  poisonClientRects: true,
  poisonFonts: true,
  consistentNoise: true, // Whether to use consistent noise per domain
  noiseLevel: 2, // 1-4, with 4 being most aggressive
};

// Initialize settings
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(["settings"], (result) => {
    if (!result.settings) {
      chrome.storage.local.set({ settings: defaultSettings });
    }

    // Initialize stats collection
    initStats();
  });

  // Set up declarativeNetRequest rules for modifying headers
  updateHeaderRules();
});

// Function to initialize statistics
function initStats() {
  chrome.storage.local.get(["fingerprintStats"], function (result) {
    if (!result.fingerprintStats) {
      chrome.storage.local.set({
        fingerprintStats: {
          totalSites: 0,
          siteData: {},
        },
      });
    }
  });
}

// Function to set up declarativeNetRequest rules
async function updateHeaderRules() {
  const settings = await getSettings();

  if (!settings.enabled || !settings.poisonUserAgent) {
    // Clear rules if disabled
    try {
      await chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: [1, 2], // Remove our rules
      });
    } catch (e) {
      console.error("Error removing rules:", e);
    }
    return;
  }

  // Create User-Agent modification rule
  try {
    // First, remove any existing rules
    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: [1, 2],
    });

    // Then add our new rules
    await chrome.declarativeNetRequest.updateDynamicRules({
      addRules: [
        {
          id: 1,
          priority: 1,
          action: {
            type: "modifyHeaders",
            requestHeaders: [
              {
                header: "User-Agent",
                operation: "set",
                value: await getModifiedUserAgent(settings.noiseLevel),
              },
            ],
          },
          condition: {
            urlFilter: "*",
            resourceTypes: [
              "main_frame",
              "sub_frame",
              "stylesheet",
              "script",
              "image",
              "font",
              "object",
              "xmlhttprequest",
              "ping",
              "csp_report",
              "media",
              "websocket",
              "webtransport",
              "webbundle",
            ],
          },
        },
        {
          id: 2,
          priority: 1,
          action: {
            type: "modifyHeaders",
            requestHeaders: [
              {
                header: "Accept-Language",
                operation: "set",
                value: getRandomLanguageHeader(),
              },
            ],
          },
          condition: {
            urlFilter: "*",
            resourceTypes: [
              "main_frame",
              "sub_frame",
              "stylesheet",
              "script",
              "image",
              "font",
              "object",
              "xmlhttprequest",
              "ping",
              "csp_report",
              "media",
              "websocket",
              "webtransport",
              "webbundle",
            ],
          },
        },
      ],
    });
  } catch (e) {
    console.error("Error setting rules:", e);
  }
}

// Helper function to generate a slightly modified User-Agent
async function getModifiedUserAgent(noiseLevel) {
  // Get the actual User-Agent
  const userAgent = navigator.userAgent;

  // Extract base components
  const browserRegex = /(Chrome|Firefox|Safari|Edge|Opera)\/(\d+\.\d+)/;
  const match = userAgent.match(browserRegex);

  if (!match) return userAgent;

  const browser = match[1];
  const version = match[2];
  const majorVersion = parseInt(version);

  // Calculate version variation based on noise level
  const versionVariation = Math.floor(Math.random() * noiseLevel);
  const newMajorVersion = majorVersion + (Math.random() > 0.5 ? versionVariation : -versionVariation);

  // Ensure version is reasonable
  const finalVersion = Math.max(newMajorVersion, 70) + "." + Math.floor(Math.random() * 100);

  // Create a reasonable variation of the UA string
  let newUA = userAgent.replace(browserRegex, `$1/${finalVersion}`);

  // For higher noise levels, potentially change minor identifiers or add noise
  if (noiseLevel >= 3 && Math.random() > 0.7) {
    const randomStr = Math.random()
      .toString(36)
      .substring(2, 2 + noiseLevel);
    newUA += ` ${randomStr}`;
  }

  return newUA;
}

// Helper to get random Accept-Language header
function getRandomLanguageHeader() {
  const languages = [
    "en-US,en;q=0.9",
    "en-GB,en;q=0.9",
    "fr-FR,fr;q=0.9,en;q=0.8",
    "de-DE,de;q=0.9,en;q=0.8",
    "es-ES,es;q=0.9,en;q=0.8",
    "it-IT,it;q=0.9,en;q=0.8",
    "ja-JP,ja;q=0.9,en;q=0.8",
    "zh-CN,zh;q=0.9,en;q=0.8",
    "pt-BR,pt;q=0.9,en;q=0.8",
    "ru-RU,ru;q=0.9,en;q=0.8",
  ];

  return languages[Math.floor(Math.random() * languages.length)];
}

// Function to get settings as a Promise
function getSettings() {
  return new Promise((resolve) => {
    chrome.storage.local.get(["settings"], (result) => {
      resolve(result.settings || defaultSettings);
    });
  });
}

// Record a site visit in statistics
function recordSiteVisit(details) {
  const url = new URL(details.url);
  const domain = url.hostname;

  chrome.storage.local.get(["fingerprintStats"], function (result) {
    const stats = result.fingerprintStats || {
      totalSites: 0,
      siteData: {},
    };

    const timestamp = Date.now();

    // Create site entry if it doesn't exist
    if (!stats.siteData[domain]) {
      stats.siteData[domain] = {
        firstVisit: timestamp,
        lastVisit: timestamp,
        fingerprintingDetected: false,
        modifications: {
          userAgent: 0,
          canvas: 0,
          webGL: 0,
          audioContext: 0,
          clientRects: 0,
          fonts: 0,
        },
      };

      // Increment total sites
      stats.totalSites++;
    } else {
      // Update existing site data
      stats.siteData[domain].lastVisit = timestamp;
    }

    // Save updated stats
    chrome.storage.local.set({ fingerprintStats: stats });
  });
}

// Listen for navigation to record site visits
chrome.webNavigation?.onCommitted?.addListener(recordSiteVisit, {
  url: [{ schemes: ["http", "https"] }],
});

// Listen for messages from popup or content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "getSettings") {
    chrome.storage.local.get(["settings"], (result) => {
      sendResponse({ settings: result.settings || defaultSettings });
    });
    return true; // Keep the messaging channel open for async response
  } else if (message.type === "saveSettings") {
    chrome.storage.local.set({ settings: message.settings }, () => {
      // Update header rules when settings change
      updateHeaderRules();
      sendResponse({ success: true });
    });
    return true;
  } else if (message.type === "fingerprintReport") {
    // Record fingerprinting report
    const domain = new URL(sender.tab.url).hostname;
    const type = message.data.type;

    chrome.storage.local.get(["fingerprintStats"], function (result) {
      const stats = result.fingerprintStats;

      if (!stats || !stats.siteData[domain]) {
        return;
      }

      // Mark as having fingerprinting
      stats.siteData[domain].fingerprintingDetected = true;

      // Increment modification counter if applicable
      if (type && stats.siteData[domain].modifications[type] !== undefined) {
        stats.siteData[domain].modifications[type]++;
      }

      // Save updated stats
      chrome.storage.local.set({ fingerprintStats: stats });
    });
  }
});
