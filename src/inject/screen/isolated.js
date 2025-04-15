/**
 * Screen Size Fingerprint Poisoner - Isolated World Script
 *
 * This script runs in the ISOLATED world and sends a message to the
 * main world to inject the screen size protection into the page.
 */

(function () {
  // Send message to the main world to inject screen size protection
  parent.postMessage("inject-screen-into-source", "*");
})();
