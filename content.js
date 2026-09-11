/**
 * Inspect Helper - Right-Click & DOM Unblocker v1.3.0
 * Restores right-click context menu, text selection, copy/cut/paste, and Inspect element.
 * Works automatically at document_start and handles dynamically loaded content and SPAs.
 */
(function () {
  'use strict';

  // Prevent duplicate execution while allowing manual force-refresh from popup
  if (window.__inspectHelperEnabled && !window.__inspectHelperForceRefresh) return;
  window.__inspectHelperEnabled = true;
  window.__inspectHelperForceRefresh = false;

  const EVENTS = [
    'contextmenu',
    'copy',
    'cut',
    'paste',
    'mousedown',
    'mouseup',
    'selectstart',
    'dragstart'
  ];

  function allowDefaultEvent(e) {
    // Stop website scripts from intercepting and canceling the event
    // Do NOT call e.preventDefault() so the browser's native context menu / selection triggers
    e.stopPropagation();
    e.stopImmediatePropagation();
  }

  // ─── 1. Intercept capture-phase event listeners ─────────────────────────
  EVENTS.forEach(evt => {
    try {
      window.addEventListener(evt, allowDefaultEvent, true);
      document.addEventListener(evt, allowDefaultEvent, true);
      if (document.documentElement) {
        document.documentElement.addEventListener(evt, allowDefaultEvent, true);
      }
    } catch (_) {}
  });

  // ─── 2. Neutralize inline event handler assignments (e.g. oncontextmenu) ─
  const HANDLERS = [
    'oncontextmenu',
    'ondragstart',
    'onselectstart',
    'oncopy',
    'oncut',
    'onpaste',
    'onmousedown',
    'onmouseup'
  ];

  function clearInlineHandlers(target) {
    if (!target) return;
    try {
      HANDLERS.forEach(h => {
        if (target[h] !== null && target[h] !== undefined) {
          target[h] = null;
        }
      });
    } catch (_) {}
  }

  clearInlineHandlers(window);
  clearInlineHandlers(document);
  if (document.body) clearInlineHandlers(document.body);

  // ─── 3. Inject Universal CSS Override (user-select & pointer-events) ─────
  function injectStyle() {
    try {
      const doc = document;
      if (doc.getElementById('inspect-helper-override')) return;
      const targetParent = doc.head || doc.documentElement;
      if (!targetParent) return;

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
        /* Disable transparent overlay blockers */
        div[style*="position: fixed"][style*="z-index"][style*="opacity: 0"],
        div[style*="position: absolute"][style*="z-index"][style*="opacity: 0"] {
          pointer-events: none !important;
        }
      `;
      targetParent.appendChild(style);
    } catch (_) {}
  }

  injectStyle();

  // ─── 4. Re-enable pointer events on blocked elements ────────────────────
  function enablePointerEvents(el) {
    if (!el || !el.style) return;
    try {
      el.style.pointerEvents = 'auto';
      el.style.webkitTouchCallout = 'default';
      el.style.webkitUserSelect = 'auto';
      el.style.MozUserSelect = 'auto';
      el.style.msUserSelect = 'auto';
      el.style.userSelect = 'auto';
    } catch (_) {}
  }

  function cleanDocument() {
    injectStyle();
    clearInlineHandlers(document);
    if (document.body) {
      clearInlineHandlers(document.body);
      enablePointerEvents(document.body);
    }
    if (document.documentElement) {
      enablePointerEvents(document.documentElement);
    }

    // Check common container tags
    try {
      const selectors = ['body', 'div', 'img', 'span', 'p', 'table', 'section', 'article', 'main'];
      document.querySelectorAll(selectors.join(', ')).forEach(el => {
        clearInlineHandlers(el);
      });
    } catch (_) {}
  }

  // ─── 5. Handle DOM Lifecycle & Dynamic Content (SPAs) ─────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', cleanDocument);
  } else {
    cleanDocument();
  }

  try {
    const observer = new MutationObserver(() => {
      cleanDocument();
    });
    if (document.documentElement) {
      observer.observe(document.documentElement, { childList: true, subtree: true });
    }
  } catch (_) {}

  // ─── 6. Walk frames / iframes ───────────────────────────────────────────
  try {
    for (let i = 0; i < window.frames.length; i++) {
      try {
        const frameWin = window.frames[i];
        EVENTS.forEach(evt => {
          frameWin.addEventListener(evt, allowDefaultEvent, true);
        });
        clearInlineHandlers(frameWin);
      } catch (_) {}
    }
  } catch (_) {}

  console.log('[Inspect Helper] Right-click, text selection, and Inspect unlocked.');
})();
