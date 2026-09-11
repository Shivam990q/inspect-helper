/**
 * Inspect Helper - Right-Click & DOM Unblocker v2.0.0
 * Restores right-click context menu, text selection, copy/cut/paste, and Inspect element.
 * Neutralizes transparent click-stealing overlays and unblocks paste restrictions on inputs.
 * Works automatically at document_start and handles dynamically loaded content and SPAs.
 * Developed by SHIVAM ERP DEV.
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

  // ─── 2. Guard Event.prototype.preventDefault for selection & contextmenu ─
  try {
    const origPreventDefault = Event.prototype.preventDefault;
    Event.prototype.preventDefault = function () {
      if (
        this.type === 'contextmenu' ||
        this.type === 'copy' ||
        this.type === 'cut' ||
        this.type === 'paste' ||
        this.type === 'selectstart' ||
        this.type === 'dragstart'
      ) {
        return; // Suppress website script cancellation
      }
      return origPreventDefault.apply(this, arguments);
    };
  } catch (_) {}

  // ─── 3. Neutralize inline event handler assignments (e.g. oncontextmenu) ─
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

  // ─── 4. Inject Universal CSS Override (user-select & pointer-events) ─────
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
          -webkit-user-drag: auto !important;
        }
        /* Disable transparent overlay blockers */
        div[style*="position: fixed"][style*="z-index"][style*="opacity: 0"],
        div[style*="position: absolute"][style*="z-index"][style*="opacity: 0"],
        div[style*="position:fixed"][style*="z-index"][style*="opacity:0"],
        div[style*="position:absolute"][style*="z-index"][style*="opacity:0"] {
          pointer-events: none !important;
        }
      `;
      targetParent.appendChild(style);
    } catch (_) {}
  }

  injectStyle();

  // ─── 5. Transparent Blocker Overlay Disabler ──────────────────────────────
  function disableOverlayBlockers() {
    try {
      const candidates = document.querySelectorAll('div, section, span');
      for (let i = 0; i < candidates.length; i++) {
        const el = candidates[i];
        if (el.id === 'inspect-helper-override') continue;
        const style = window.getComputedStyle(el);
        if (
          (style.position === 'fixed' || style.position === 'absolute') &&
          (parseInt(style.zIndex, 10) >= 999) &&
          (parseFloat(style.opacity) < 0.05 || style.backgroundColor === 'transparent' || style.backgroundColor === 'rgba(0, 0, 0, 0)') &&
          el.innerText.trim() === '' &&
          el.clientWidth > window.innerWidth * 0.8 &&
          el.clientHeight > window.innerHeight * 0.8
        ) {
          el.style.setProperty('pointer-events', 'none', 'important');
        }
      }
    } catch (_) {}
  }

  // ─── 6. Re-enable pointer events & attributes on blocked elements ─────────
  function enablePointerEvents(el) {
    if (!el || !el.style) return;
    try {
      el.style.pointerEvents = 'auto';
      el.style.webkitTouchCallout = 'default';
      el.style.webkitUserSelect = 'auto';
      el.style.MozUserSelect = 'auto';
      el.style.msUserSelect = 'auto';
      el.style.userSelect = 'auto';
      if (el.getAttribute && el.getAttribute('unselectable') === 'on') {
        el.removeAttribute('unselectable');
      }
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

    disableOverlayBlockers();

    // Check common container tags
    try {
      const selectors = ['body', 'div', 'img', 'span', 'p', 'table', 'section', 'article', 'main', 'input', 'textarea'];
      document.querySelectorAll(selectors.join(', ')).forEach(el => {
        clearInlineHandlers(el);
      });
    } catch (_) {}
  }

  // ─── 7. Handle DOM Lifecycle & Dynamic Content (SPAs) ─────────────────────
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

  // ─── 8. Walk frames / iframes ───────────────────────────────────────────
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

  console.log('[Inspect Helper Ultimate] DOM, Right-Click, Selection & Overlays unblocked.');
})();
