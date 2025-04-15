/**
 * Font Detection Fingerprint Poisoner - Isolated World Script
 *
 * This script runs in the ISOLATED world and sends a message to the
 * main world to inject the font detection protection into the page.
 */

(function () {
  // Send message to the main world to inject font detection protection
  parent.postMessage("inject-font-into-source", "*");
})();
