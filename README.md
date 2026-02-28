# Inspect Helper - Enable Right Click

A Chrome extension that re-enables right-click and Inspect on websites that block it, and prevents the tab from closing when DevTools opens.

## What it does

Many websites block right-click (context menu) to prevent users from inspecting elements, copying text, or saving images. Some also detect DevTools and close the tab. This extension:

- **Re-enables Right-click → Inspect** to use Chrome DevTools
- **Re-enables copy, paste, and text selection**
- **Prevents the tab from closing** when you open DevTools
- **Blocks anti-debugging tricks** used by sites to detect and punish Inspect usage

## How to use

1. **Load the extension** in Chrome:
   - Open `chrome://extensions/`
   - Enable "Developer mode" (top right)
   - Click "Load unpacked"
   - Select this folder (`chromeextension`)

2. **On a blocked website**:
   - Click the extension icon in the toolbar
   - Click **"Enable Right Click"**
   - Right-click will now work → choose **Inspect** to open DevTools

3. **Keyboard shortcuts** (work even if right-click is blocked):
   - `Ctrl + Shift + I` or `F12` – Open DevTools
   - `Ctrl + Shift + C` – Inspect element mode

## If the tab still closes or behaves oddly

**Undock DevTools into a separate window.** Right-click the DevTools tab → **Undock into separate window**. This defeats viewport-based detection and often avoids timing-based tricks.

Some sites may reload the page when they detect DevTools. Undocking usually prevents that too.

## What the anti-debug protection blocks

The extension runs at `document_start` in the page context to neutralize common detection techniques:

| Technique | Source | Our response |
|-----------|--------|--------------|
| `window.close()` | Many sites | Replaced with no-op |
| `debugger` in `new Function()` | javascript-obfuscator, etc. | Stripped from code |
| `debugger` in `eval()` | Obfuscated scripts | Stripped from code |
| `debugger` in `setTimeout`/`setInterval`/`requestAnimationFrame` | Loop-based detection | Callback replaced with no-op |
| `console.profiles`, `console.memory` | Chrome-only getters | Return undefined |
| `console.log` toString traps | AEPKILL devtools-detector | Args sanitized before logging |
| Window dimensions (`outerWidth` - `innerWidth` > 170) | devtools-detect, sindresorhus | Spoofed to stay below threshold |
| `Firebug.chrome.isInitialized` | devtools-detect | Always false |
| `crashBrowserCurrentTab`-style OOM | AEPKILL devtools-detector | Array length capped |

Protection runs in all frames (`all_frames: true`) and before any page scripts.

## Why click to activate?

Right-click enabling only runs when you click the extension. This avoids affecting sites that use custom context menus (e.g. Google Docs) and keeps normal browsing unchanged.

Anti-debug protection runs automatically on every page so the tab does not close even before you enable right-click.

## Technical note

Chrome does not allow extensions to programmatically open DevTools. This extension re-enables right-click so you can use **Right-click → Inspect** manually.

## Files

- `manifest.json` – Extension configuration (Manifest V3)
- `popup.html` / `popup.js` – Toolbar popup UI
- `content.js` – Script to bypass right-click blocks
- `anti-debug.js` – Prevents tab from closing and neutralizes DevTools detection

**Developed by Shivam ERP DEV**

## References

- [devtools-detect](https://github.com/sindresorhus/devtools-detect) – Window dimension detection
- [AEPKILL/devtools-detector](https://github.com/AEPKILL/devtools-detector) – Console/timing/debugger detection
- [Blatzar/devtools_detectors](https://github.com/Blatzar/scraping-tutorial/blob/master/devtools_detectors.md) – Overview of detection methods
- [javascript-obfuscator debug protection](https://github.com/javascript-obfuscator/javascript-obfuscator) – `debugger` in dynamic code
