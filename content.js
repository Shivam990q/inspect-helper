/**
 * Inspect Helper - Re-enables right-click, text selection, and copy on websites that block them.
 * This allows you to use Right-click → Inspect on restricted sites.
 */

(function () {
  'use strict';

  // Prevent re-injection
  if (window.__inspectHelperEnabled) return;
  window.__inspectHelperEnabled = true;

  const EVENTS = ['contextmenu', 'copy', 'cut', 'paste', 'mousedown', 'mouseup', 'selectstart', 'dragstart'];

  function bringBackDefault(e) {
    // Stop site scripts from receiving the event (they would call preventDefault)
    // We do NOT call preventDefault - we want Chrome's default context menu to show
    e.stopPropagation();
    e.stopImmediatePropagation();
  }

  function enableOnWindow(win) {
    try {
      // Clear inline handlers that block events
      const handlers = ['oncontextmenu', 'ondragstart', 'onselectstart', 'oncopy', 'oncut', 'onpaste', 'onmousedown', 'onmouseup'];
      handlers.forEach(h => {
        if (win.document[h]) win.document[h] = null;
        if (win.document.body && win.document.body[h]) win.document.body[h] = null;
      });

      // Add capture-phase listeners to intercept and allow events before site scripts block them
      EVENTS.forEach(evt => {
        win.document.addEventListener(evt, bringBackDefault, true);
      });
    } catch (e) {
      // Cross-origin frames may throw
    }
  }

  function enablePointerEvents(el) {
    if (!el) return;
    el.style.pointerEvents = 'auto';
    el.style.webkitTouchCallout = 'default';
    el.style.webkitUserSelect = 'auto';
    el.style.MozUserSelect = 'auto';
    el.style.msUserSelect = 'auto';
    el.style.userSelect = 'auto';
  }

  function enableOnDocument(doc) {
    if (!doc || !doc.body) return;
    enablePointerEvents(doc.body);
    enablePointerEvents(doc.documentElement);

    // Remove restrictions from common blocked elements
    const selectors = ['img', 'body', 'div', 'span', 'td', 'p', 'a'];
    selectors.forEach(sel => {
      try {
        doc.querySelectorAll(sel).forEach(enablePointerEvents);
      } catch (_) {}
    });

    // Add global style to override user-select and pointer-events (only once)
    if (doc.getElementById('inspect-helper-override')) return;
    const style = doc.createElement('style');
    style.id = 'inspect-helper-override';
    style.textContent = `
      * { 
        -webkit-user-select: auto !important; 
        -moz-user-select: auto !important; 
        -ms-user-select: auto !important; 
        user-select: auto !important;
        -webkit-touch-callout: default !important;
        pointer-events: auto !important;
      }
    `;
    doc.head.appendChild(style);
  }

  // Enable on main document
  enableOnWindow(window);
  enableOnDocument(document);

  // Enable on iframes (same-origin only)
  function walkFrames(win, fn) {
    fn(win);
    for (let i = 0; i < win.frames.length; i++) {
      try {
        walkFrames(win.frames[i], fn);
      } catch (_) {}
    }
  }
  walkFrames(window, enableOnWindow);

  // Handle dynamically added content
  const observer = new MutationObserver(() => {
    enableOnDocument(document);
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });

  console.log('[Inspect Helper] Right-click, copy, and Inspect are now enabled on this page.');
})();
