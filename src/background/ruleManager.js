import { getRandomLanguageHeader, getRandomAcceptHeader, getRandomUserAgent } from "./headerUtils.js";

/**
 * Update header modification rules with random values
 * @returns {Promise<void>}
 */
async function updateHeaderRules() {
  try {
    // First removes existing rules before adding new ones to avoid conflicts or duplication
    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: [1, 2, 3],
    });

    // Then add our new rules with randomized values
    await chrome.declarativeNetRequest.updateDynamicRules({
      addRules: [createUserAgentRule(), createAcceptLanguageRule(), createAcceptHeaderRule()],
    });

    console.log("[FingerprintPoisoner] Header rules updated successfully");
  } catch (e) {
    console.error("[FingerprintPoisoner] Error setting rules:", e);
  }
}

/**
 * Create a rule for modifying the User-Agent header
 * @returns {Object} A declarativeNetRequest rule
 */
function createUserAgentRule() {
  return {
    id: 1,
    priority: 1,
    action: {
      type: chrome.declarativeNetRequest.RuleActionType.MODIFY_HEADERS,
      requestHeaders: [
        {
          header: "User-Agent",
          operation: chrome.declarativeNetRequest.HeaderOperation.SET,
          value: getRandomUserAgent(),
        },
      ],
    },
    condition: {
      urlFilter: "*",
      resourceTypes: Array.from(Object.values(chrome.declarativeNetRequest.ResourceType)),
    },
  };
}

/**
 * Create a rule for modifying the Accept-Language header
 * @returns {Object} A declarativeNetRequest rule
 */
function createAcceptLanguageRule() {
  return {
    id: 2,
    priority: 1,
    action: {
      type: chrome.declarativeNetRequest.RuleActionType.MODIFY_HEADERS,
      requestHeaders: [
        {
          header: "Accept-Language",
          operation: chrome.declarativeNetRequest.HeaderOperation.SET,
          value: getRandomLanguageHeader(),
        },
      ],
    },
    condition: {
      urlFilter: "*",
      resourceTypes: Array.from(Object.values(chrome.declarativeNetRequest.ResourceType)),
    },
  };
}

/**
 * Create a rule for modifying the Accept header
 * @returns {Object} A declarativeNetRequest rule
 */
function createAcceptHeaderRule() {
  return {
    id: 3,
    priority: 1,
    action: {
      type: chrome.declarativeNetRequest.RuleActionType.MODIFY_HEADERS,
      requestHeaders: [
        {
          header: "Accept",
          operation: chrome.declarativeNetRequest.HeaderOperation.SET,
          value: getRandomAcceptHeader(),
        },
      ],
    },
    condition: {
      urlFilter: "*",
      resourceTypes: Array.from(Object.values(chrome.declarativeNetRequest.ResourceType)),
    },
  };
}

/**
 * Set up periodic updates to change the headers at regular intervals
 */
function setupPeriodicUpdates() {
  // Update headers every 30 minutes to 2 hours (randomized)
  const minInterval = 30 * 60 * 1000; // 30 minutes
  const maxInterval = 120 * 60 * 1000; // 2 hours

  function scheduleNextUpdate() {
    const nextUpdateTime = minInterval + Math.floor(Math.random() * (maxInterval - minInterval));
    console.log(`[FingerprintPoisoner] Next header update in ${Math.round(nextUpdateTime / 60000)} minutes`);

    setTimeout(async () => {
      await updateHeaderRules();
      scheduleNextUpdate();
    }, nextUpdateTime);
  }

  // Start the update cycle
  scheduleNextUpdate();
}

export { updateHeaderRules, setupPeriodicUpdates };
