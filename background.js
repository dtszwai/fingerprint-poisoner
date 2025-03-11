// background.js
let config = {
  enabled: true,
  spoofUserAgent: true,
  blockCanvas: true,
  spoofTimezone: true,
  blockWebRTC: true,
  blockWebGL: true,
  spoofAudioContext: true,
  randomize: false, // If true, values change on each page load
  userAgents: [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15",
  ],
  timezones: ["America/New_York", "America/Los_Angeles", "Europe/London", "Europe/Paris", "Asia/Tokyo"],
  // Selected values (will be randomized if randomize is true)
  selectedUserAgent: 0,
  selectedTimezone: 0,
};

// Load saved configuration
chrome.storage.local.get("fingerprint_config", (result) => {
  if (result.fingerprint_config) {
    config = { ...config, ...result.fingerprint_config };
    updateUserAgentRules();
  } else {
    // Save default config
    chrome.storage.local.set({ fingerprint_config: config });
  }
});

// Function to update User-Agent rules using declarativeNetRequest
async function updateUserAgentRules() {
  if (!config.enabled || !config.spoofUserAgent) return;

  // Select user agent (random or configured)
  let userAgentIndex = config.selectedUserAgent;
  if (config.randomize) {
    userAgentIndex = Math.floor(Math.random() * config.userAgents.length);
  }

  const userAgent = config.userAgents[userAgentIndex];

  // Define the rules to set user agent header
  const rules = [
    {
      id: 1,
      priority: 1,
      action: {
        type: "modifyHeaders",
        requestHeaders: [
          {
            header: "User-Agent",
            operation: "set",
            value: userAgent,
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
          "other",
        ],
      },
    },
  ];

  // Update the dynamic rules
  try {
    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: [1],
      addRules: config.enabled && config.spoofUserAgent ? rules : [],
    });
  } catch (error) {
    console.error("Failed to update user agent rules:", error);
  }
}

// Handle messages from popup and content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getConfig") {
    sendResponse(config);
  } else if (request.action === "updateConfig") {
    const oldConfig = { ...config };
    config = { ...config, ...request.config };
    chrome.storage.local.set({ fingerprint_config: config });

    // Update User-Agent rules if necessary
    if (
      oldConfig.enabled !== config.enabled ||
      oldConfig.spoofUserAgent !== config.spoofUserAgent ||
      oldConfig.selectedUserAgent !== config.selectedUserAgent ||
      oldConfig.randomize !== config.randomize
    ) {
      updateUserAgentRules();
    }

    // Notify all active tabs about the updated config
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach((tab) => {
        chrome.tabs.sendMessage(tab.id, { action: "configUpdated", config: config }).catch(() => {}); // Ignore errors for inactive tabs
      });
    });

    sendResponse({ success: true });
  } else if (request.action === "requestValues") {
    // If randomize is on, select new values for each request
    if (config.randomize) {
      config.selectedTimezone = Math.floor(Math.random() * config.timezones.length);
      if (config.spoofUserAgent) {
        config.selectedUserAgent = Math.floor(Math.random() * config.userAgents.length);
        updateUserAgentRules();
      }
    }

    sendResponse({
      userAgent: config.userAgents[config.selectedUserAgent],
      timezone: config.timezones[config.selectedTimezone],
    });
  }
  return true; // Keep the message channel open for async responses
});
