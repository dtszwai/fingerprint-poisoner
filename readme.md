# FingerprintPoisoner

A browser extension that protects your privacy by poisoning browser fingerprinting attempts.

## Overview

FingerprintPoisoner is a comprehensive privacy tool that helps protect you against various browser fingerprinting techniques. Browser fingerprinting is a method websites use to identify and track users across the web without relying on cookies or local storage. This extension implements multiple strategies to randomize and alter your browser's fingerprint, making it difficult for sites to accurately track you.

## Features

### Header Modification

- Randomizes common HTTP headers used for fingerprinting:
  - User-Agent
  - Accept-Language
  - Accept
- Headers are automatically rotated periodically (every 30 minutes to 2 hours)
- Seamless header changes to prevent tracking across sessions

### Canvas Fingerprinting Protection

- Adds subtle noise to canvas data when read by scripts
- Preserves visual appearance for normal use
- Protects against one of the most common fingerprinting techniques
- Canvas modifications are designed to be difficult to detect

### WebRTC Protection

- Prevents IP address leakage through WebRTC
- Replaces public IP addresses with randomized private IPs
- Adds noise to WebRTC statistics and timing data
- Protects device information when enumerating media devices

## How It Works

### Header Protection

The extension uses Chrome's declarativeNetRequest API to modify request headers on the fly. Headers are randomly selected from common configurations to maintain natural browsing behavior while preventing fingerprint consistency.

### Canvas Protection

When a site attempts to read data from an HTML canvas (a common fingerprinting technique), the extension:

1. Captures the original canvas data
2. Makes subtle, imperceptible modifications to pixel values
3. Returns the modified data to the requesting script
4. Restores the canvas to its original state for visual rendering

### WebRTC Protection

The extension intercepts WebRTC connections to:

1. Filter out public IP addresses from connection data
2. Replace addressing information with private IP addresses
3. Add minor statistical noise to connection data
4. Randomize device identifiers in a consistent way per session

## Installation

### Manual Installation

1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the extension directory
5. The extension will be installed and active immediately

## Usage

Once installed, FingerprintPoisoner works automatically in the background. There are no settings to configure or buttons to press - the extension begins protecting your privacy immediately.

## Technical Details

### Content Script Isolation

The extension uses two separate contexts for content scripts:

- **MAIN world**: Direct access to modify page JavaScript objects and APIs
- **ISOLATED world**: Prevents detection of the modifications

### Periodic Updates

The extension randomizes headers on a variable schedule to prevent tracking based on header change patterns.

### Performance Considerations

- Canvas protection selectively modifies only a small percentage of pixels for efficiency
- Header modification uses efficient declarativeNetRequest API
- All protection methods are designed to have minimal impact on browsing performance

## Privacy Notes

While FingerprintPoisoner significantly reduces fingerprinting effectiveness, no solution is perfect. Browser fingerprinting techniques constantly evolve, and this extension addresses the most common methods. For maximum privacy, consider using this extension alongside other privacy tools.
