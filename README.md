# Inspect Helper - Enable Right Click & DevTools (v1.3.0)

A powerful Chrome / Edge extension that re-enables right-click, text selection, and Inspect on websites that block it, while automatically neutralizing anti-debugging traps, infinite debugger loops, and tab-closing scripts.

## What it does

Many modern websites and test portals block right-click (context menu) and keyboard shortcuts to prevent users from inspecting elements or copying text. Advanced sites even detect DevTools opening and freeze the browser with infinite `debugger;` loops or close the tab via `window.close()`.

This extension provides comprehensive defense:

- **Automatic Right-Click & Selection Unblock**: Immediately restores native right-click, copy, cut, paste, and text selection.
- **Unblocks DevTools Shortcuts**: Restores `F12`, `Ctrl+Shift+I`, `Ctrl+Shift+J`, `Ctrl+Shift+C`, `Ctrl+U` (View Source), and macOS Command (`Cmd+Opt+I/J/C/U`) shortcuts before site scripts can cancel them.
- **Prevents Tab Auto-Close**: Intercepts and disables `window.close()` and navigation hijack attempts when DevTools is opened.
- **Neutralizes Infinite Debugger Loops**: Strips `debugger;` statements dynamically from:
  - `Function` and `eval()` constructs
  - `AsyncFunction`, `GeneratorFunction`, and `AsyncGeneratorFunction`
  - Web Workers (`new Worker()`) and `Blob` scripts
  - `setInterval`, `setTimeout`, and `requestAnimationFrame` loops
- **Universal Console & Timing Protection**: Neutralizes getter traps (e.g. `devtools-detector`), `console.clear` spam, `console.table` memory/timing traps, and window dimension disparity checks.

## How to use

1. **Load the extension** in Chrome / Edge / Brave:
   - Open `chrome://extensions/` (or `edge://extensions/`)
   - Enable **Developer mode** (top-right toggle)
   - Click **Load unpacked**
   - Select this folder: `C:\Users\Rose\Videos\Projects & Development Repositories\FUTURE\inspect-helper`

2. **On a blocked website**:
   - The extension works **automatically** on page load! Right-click any element and choose **Inspect**.
   - Press <kbd>F12</kbd> or <kbd>Ctrl + Shift + I</kbd> (<kbd>Cmd + Opt + I</kbd> on Mac) to open DevTools directly.
   - For stubborn single-page apps (SPAs) that re-bind blocking scripts dynamically, open the extension popup and click **"Force Re-Unlock Page"**.

## Supported Countermeasures

| Anti-Inspect Technique | Detection Vector | Inspect Helper v1.3.0 Response |
|---|---|---|
| `window.close()` / Tab Termination | Malicious scripts closing tabs | Neutralized (`noop`) on `window` and `window.opener` |
| `debugger` in `Function()` | Obfuscators / eval scripts | Stripped via Proxy before code execution |
| `debugger` in `Async`/`Generator` | ES6+ dynamic function constructors | Stripped via Prototype Proxy |
| `debugger` in Web Workers | Isolated thread infinite loops | Intercepted in `Blob` & `Worker` instantiation |
| `debugger` in Timers | `setInterval` / `setTimeout` loops | Callbacks inspected; loops dropped to `noop` |
| Console Getter Traps | `AEPKILL/devtools-detector`, `id` traps | Console method arguments sanitized |
| `console.clear()` Spam | Hiding site anti-debug activity | Replaced with `noop` |
| Dimension Disparity Checks | `outerWidth - innerWidth` threshold | Spoofed to match inner dimensions |
| Right-Click & Selection Block | `oncontextmenu`, CSS `user-select: none` | Native events allowed in capture phase; CSS overridden |
| DevTools Key Blocks | `e.preventDefault()` on F12 / shortcuts | Capture phase unblocker stops site interception |

## Project Files

- `manifest.json` – Extension configuration (Manifest V3, with MAIN world content scripts)
- `anti-debug.js` – Anti-debugging and DevTools protection engine (runs at `document_start`)
- `content.js` – Right-click, text selection, and DOM blocker bypass engine
- `popup.html` / `popup.js` – Modern dark toolbar popup with real-time status and force re-unlock
- `logo.jpg` – Extension branding icon

## License

This project is licensed under the [MIT License](LICENSE). You may use and modify this extension, but you **must** retain the copyright notice and give proper credit to **SHIVAM ERP DEV** and this repository in any derivative work.

**Developed by SHIVAM ERP DEV.**

