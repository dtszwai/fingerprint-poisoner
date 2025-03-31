/**
 * Generate a random language header
 */
export function getRandomLanguageHeader() {
  const languages = [
    // "en-US,en;q=0.9",
    // "en-GB,en;q=0.9",
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

/**
 * Generate a modified User-Agent based on the current one
 */
export async function getModifiedUserAgent(noiseLevel) {
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

// Initialize extension on install
chrome.runtime.onInstalled.addListener(async () => {
  // Set up header modification rules
  await updateHeaderRules();
});

// Function to set up declarativeNetRequest rules for header modification
async function updateHeaderRules() {
  // Create rules for User-Agent and Accept-Language headers
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
            type: chrome.declarativeNetRequest.RuleActionType.MODIFY_HEADERS,
            requestHeaders: [
              {
                header: "User-Agent",
                operation: chrome.declarativeNetRequest.HeaderOperation.SET,
                value: await getModifiedUserAgent(4),
              },
            ],
          },
          condition: {
            urlFilter: "*",
            resourceTypes: Array.from(Object.values(chrome.declarativeNetRequest.ResourceType)),
          },
        },
        {
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
        },
      ],
    });
  } catch (e) {
    console.error("[FingerprintPoisoner] Error setting rules:", e);
  }
}
