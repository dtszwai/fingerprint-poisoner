# FingerprintPoisoner

A Chrome extension that protects your privacy by poisoning browser fingerprinting attempts.

## What is Browser Fingerprinting?

Browser fingerprinting is a technique used by websites to identify and track users based on unique characteristics of their browser and device. Unlike cookies, fingerprinting is difficult to detect and block because it doesn't store anything on your device.

Fingerprinting methods include:

- Canvas fingerprinting (drawing invisible images)
- WebGL fingerprinting (checking hardware capabilities)
- Audio fingerprinting (analyzing audio processing)
- Font detection (checking available fonts)
- User-Agent and headers analysis
- Screen and window measurements
- And many more...

## How FingerprintPoisoner Works

Instead of trying to block fingerprinting (which can make your browser stand out even more), FingerprintPoisoner adds controlled randomness to fingerprinting vectors. This makes your browser's fingerprint:

- **Different across websites** (optional)
- **Different across sessions**
- **Similar enough to real browsers** to avoid detection

The extension modifies various browser APIs by injecting slight amounts of noise, making your fingerprint unstable while still appearing normal.

## Features

- **Canvas Poisoning**: Adds subtle pixel-level noise to canvas operations
- **WebGL Poisoning**: Modifies WebGL parameters and capabilities
- **Audio Context Poisoning**: Adds noise to audio fingerprinting
- **Font Detection Poisoning**: Randomizes font measurements and detection
- **Client Rects Poisoning**: Adds noise to element size and position measurements
- **User-Agent Modification**: Makes subtle variations to your browser's user agent
- **Adjustable Protection Level**: Control the amount of noise added
- **Per-Domain Consistency**: Option to keep fingerprint consistent for each domain (prevents cross-site tracking while avoiding anti-bot detection)

## Installation

1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer Mode" (toggle in the top right)
4. Click "Load unpacked" and select the extension directory
5. The extension will appear in your toolbar

## Usage

- Click the extension icon to open the settings popup
- Toggle protections on/off
- Adjust the noise level to balance protection vs. compatibility
- Set whether noise should be consistent per domain

## File Structure

- `manifest.json`: Extension configuration
- `background.js`: Background service worker for header modifications
- `content.js`: Content script that injects the fingerprint poisoning code
- `inject.js`: The main poisoning script that modifies browser APIs
- `popup.html`: Settings UI
- `popup.js`: Settings UI logic
- `utils.js`: Shared utility functions
- `stats.js`: Statistics tracking (sites protected, modifications made)

## Compatibility

FingerprintPoisoner is designed to work without breaking normal website functionality. However, if you encounter issues with a specific site, you can:

1. Reduce the noise level
2. Disable specific protection methods
3. Temporarily disable the extension for that site

## Notes

- This extension doesn't make you completely anonymous - it makes tracking more difficult
- It complements other privacy tools like ad blockers and VPNs
- Higher noise levels provide more protection but may cause compatibility issues

## Privacy Policy

FingerprintPoisoner doesn't collect any data from your browsing activity. All operations happen locally in your browser and no information is transmitted anywhere.

## License

MIT License
