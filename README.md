# Inspect Helper — Ultimate Anti-Debug & DevTools Unblocker (v2.0.0)

[![Manifest V3](https://img.shields.io/badge/Manifest-V3-success.svg?logo=googlechrome&logoColor=white)](manifest.json)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Release](https://img.shields.io/github/v/release/Shivam990q/inspect-helper?color=orange&logo=github)](https://github.com/Shivam990q/inspect-helper/releases)
[![Cyber Security](https://img.shields.io/badge/Domain-Reverse%20Engineering%20%26%20VAPT-red.svg)](#supported-countermeasures-12-layer-matrix)

A world-class Chrome, Edge, and Brave extension that re-enables right-click, text selection, copy/paste, and DevTools on websites that block it, while automatically neutralizing anti-debugging traps, infinite debugger loops, proctoring tab-switch detection, and tab-closing scripts.

Developed by **Shivam Gupta** ([Shivam990q](https://github.com/Shivam990q)).

---

## What it does

Many modern websites, commercial obfuscators (`javascript-obfuscator`, JScrambler), and assessment portals block right-click (context menu) and keyboard shortcuts to prevent inspection. Advanced sites detect DevTools opening and freeze the browser with infinite `debugger;` loops, redirect to `about:blank`, or trigger tab-switch / blur warnings.

Inspect Helper Ultimate Edition v2.0.0 provides an impenetrable 12-layer defense running in the `MAIN` execution world before any website scripts run:

- **Native Code Camouflage (`makeNative`)**: Overrides `Function.prototype.toString` so every hooked method authenticates as `function () { [native code] }`, defeating obfuscator `selfDefending` traps.
- **Pre-Emptive Library Neutralizers**: Automatically detects and freezes libraries like `DisableDevtool` (`theajack/disable-devtool`), `devtoolsDetector` (`AEPKILL`), `ConsoleBan`, and `devtools-detect` before they can initialize.
- **Event Cancellation Guard**: Overrides `Event.prototype.preventDefault` on `contextmenu`, `copy`, `cut`, `paste`, `selectstart`, and DevTools key combinations, guaranteeing native browser menus and shortcuts work regardless of site listeners.
- **Unblocks DevTools Shortcuts**: Restores `F12`, `Ctrl+Shift+I`, `Ctrl+Shift+J`, `Ctrl+Shift+C`, `Ctrl+U` (View Source), `Ctrl+S`, and macOS Command combinations (`Cmd+Opt+I/J/C/U`).
- **Prevents Tab Auto-Close & Blanking**: Intercepts and disables `window.close()` and redirect hijacks when DevTools is opened.
- **Neutralizes Infinite Debugger Loops**: Strips `debugger;` statements dynamically from:
  - `Function` and `eval()` constructs
  - `AsyncFunction`, `GeneratorFunction`, and `AsyncGeneratorFunction`
  - Web Workers (`new Worker()`), `SharedWorker`, and `Blob` scripts
  - `setInterval`, `setTimeout`, and `requestAnimationFrame` loops
- **Proctoring & Anti-Tab-Switch Shield**: Spoofs `document.hidden = false`, `document.visibilityState = 'visible'`, and `document.hasFocus() = true`, while swallowing window blur/visibilitychange events.
- **Closed Shadow DOM Piercing**: Hooks `Element.prototype.attachShadow` to force `mode: 'open'`, allowing full inspection of encapsulated elements.
- **Transparent Blocker Overlay Removal**: Automatically detects and disables invisible full-screen click-stealing overlay `<div>` elements.
- **Clipboard Freedom**: Ensures `navigator.clipboard` APIs and paste events remain fully accessible.
- **Viewport Disparity Alignment**: Dynamically aligns `outerWidth/Height` to `innerWidth/Height` to bypass docking detection.

---

## Supported Countermeasures (12-Layer Matrix)

| Anti-Inspect Vector | Used By / Technique | Inspect Helper v2.0.0 Countermeasure |
|---|---|---|
| **`selfDefending` Integrity Checks** | `javascript-obfuscator` | `makeNative()` WeakMap spoofing returns `[native code]` |
| **`DisableDevtool` Library** | `theajack/disable-devtool` (3.2k★) | Pre-defined frozen object with `isSuspend: true` |
| **`devtools-detector`** | `AEPKILL/devtools-detector` | Pre-defined dummy object with `isLaunch: false` |
| **`ConsoleBan`** | `flashthemes/console-ban` | Pre-defined dummy with `init: noop` |
| **`window.close()` / Tab Termination** | Malicious anti-debug pages | Neutralized (`noop`) on `window` and `window.opener` |
| **`debugger;` in Constructors** | Obfuscated code, dynamic eval | Stripped dynamically via constructor prototypes |
| **`debugger;` in Web Workers** | Background thread freezes | Intercepted and sanitized in `Blob` & `Worker` |
| **`debugger;` in Timers** | `setInterval` / `setTimeout` loops | Callbacks inspected; probe loops discarded |
| **Console Getter Traps** | Object getter traps on `id`, `toString` | Arguments sanitized before console methods |
| **`console.clear()` Spam** | Hiding site anti-debug activity | Replaced with `noop` |
| **Tab-Switch & Blur Proctoring** | Assessment portals | `document.hidden = false`, `hasFocus = true`, blur swallowed |
| **Closed Shadow DOM** | Encapsulated components | `Element.prototype.attachShadow` forced to `mode: 'open'` |
| **Transparent Blocker Overlays** | Paywalls & blogs | Zero-opacity fixed elements set to `pointer-events: none` |
| **Right-Click & Selection Block** | `oncontextmenu`, CSS `user-select: none` | `preventDefault` bypassed; CSS overridden with `!important` |
| **DevTools Key Blocks** | `e.preventDefault()` on F12 / shortcuts | Capture phase unblocker and `preventDefault` guard |

---

## How to use

1. **Load the extension** in Chrome / Edge / Brave:
   - Open `chrome://extensions/` (or `edge://extensions/`)
   - Enable **Developer mode** (top-right toggle)
   - Click **Load unpacked**
   - Select this folder: `C:\Users\Rose\Videos\Projects & Development Repositories\FUTURE\inspect-helper`

2. **On a protected website**:
   - The extension works **automatically** on page load!
   - Right-click any element and choose **Inspect**.
   - Press <kbd>F12</kbd> or <kbd>Ctrl + Shift + I</kbd> (<kbd>Cmd + Opt + I</kbd> on Mac) to open DevTools directly.
   - For single-page apps (SPAs) that dynamically re-bind restrictions, open the extension popup and click **"Force Re-Unlock Page"**.

---

## Project Structure

- `manifest.json` – Manifest V3 configuration with `MAIN` world content scripts
- `anti-debug.js` – Core anti-debugging, library neutralizer, and native camouflage engine
- `content.js` – Right-click, DOM unblocker, transparent overlay remover, and CSS injector
- `popup.html` / `popup.js` – Dark glassmorphism toolbar popup with live shield indicators
- `logo.jpg` – Extension branding icon

---

## License & Credits

This project is licensed under the [MIT License](LICENSE).

**Developed by Shivam Gupta.**
- **GitHub**: [@Shivam990q](https://github.com/Shivam990q)
- **LinkedIn**: [Shivam Gupta](https://www.linkedin.com/in/shivamg031)
