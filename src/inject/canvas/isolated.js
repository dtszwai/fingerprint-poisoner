/**
 * Canvas Fingerprint Poisoner - Isolated World Script
 *
 * This script runs in the ISOLATED world and sends a message to the
 * main world to inject the canvas protection into the page.
 */

(function () {
  // Send message to the main world to inject canvas protection
  parent.postMessage("inject-script-into-source", "*");
})();
