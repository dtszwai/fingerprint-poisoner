/**
 * FingerprintPoisoner - Background Script
 *
 * This extension protects privacy by randomizing headers
 * to prevent accurate browser fingerprinting.
 *
 * @author David Tam
 */

import { updateHeaderRules, setupPeriodicUpdates } from "./ruleManager.js";

// Initialize extension on install
chrome.runtime.onInstalled.addListener(async () => {
  console.log("[FingerprintPoisoner] Extension installed/updated");

  // Set up initial header modification rules
  await updateHeaderRules();

  // Set up periodic updates to change the headers regularly
  setupPeriodicUpdates();
});

// Listen for manual update requests
// This allows the user to trigger an update of the header rules from the popup or options page
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "updateHeaders") {
    updateHeaderRules()
      .then(() => {
        sendResponse({ success: true });
      })
      .catch((error) => {
        sendResponse({ success: false, error: error.message });
      });
    return true; // Required for async sendResponse
  }
});
