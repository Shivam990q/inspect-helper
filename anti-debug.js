/**
 * Inspect Helper - Anti-Debug Engine v1.3.0
 * Runs in page context (MAIN world) at document_start to override anti-dev and anti-inspect techniques.
 *
 * Countermeasures implemented:
 * 1. Unblocks DevTools keyboard shortcuts (F12, Ctrl/Cmd+Shift+I/J/C, Ctrl/Cmd+U, Ctrl/Cmd+S) cross-platform.
 * 2. Prevents tab auto-close via window.close() and navigation hijacking.
 * 3. Neutralizes infinite debugger; loops in Function, AsyncFunction, GeneratorFunction, and eval().
 * 4. Filters debugger; statements from Web Workers and Blobs.
 * 5. Sanitizes console inspection traps (id getters, toString traps, console.clear spam, console.table traps).
 * 6. Prevents dimension delta detection (outerWidth/innerHeight disparity).
 * 7. Blocks setInterval/setTimeout callbacks and strings executing debugger loops.
 */
(function () {
  'use strict';
  if (window.__inspectHelperAntiDebug) return;
  window.__inspectHelperAntiDebug = true;

  const noop = function () {};
  const stripDebugger = (s) => (typeof s === 'string' ? s.replace(/debugger\s*;?/g, '') : s);

  // ─── 0. Unblock DevTools keyboard shortcuts (Windows, Linux, macOS) ─────────
  const unblockDevToolsKeys = function (e) {
    const isCtrlOrCmd = e.ctrlKey || e.metaKey;
    const isF12 = e.keyCode === 123 || e.key === 'F12';
    const isInspect = isCtrlOrCmd && e.shiftKey && (e.keyCode === 73 || e.key === 'I' || e.key === 'i');
    const isConsole = isCtrlOrCmd && e.shiftKey && (e.keyCode === 74 || e.key === 'J' || e.key === 'j');
    const isElementPicker = isCtrlOrCmd && e.shiftKey && (e.keyCode === 67 || e.key === 'C' || e.key === 'c');
    const isViewSource = isCtrlOrCmd && (e.keyCode === 85 || e.key === 'U' || e.key === 'u');
    const isSavePage = isCtrlOrCmd && (e.keyCode === 83 || e.key === 'S' || e.key === 's');
    const isFirefoxConsole = isCtrlOrCmd && e.shiftKey && (e.keyCode === 75 || e.key === 'K' || e.key === 'k');

    if (isF12 || isInspect || isConsole || isElementPicker || isViewSource || isSavePage || isFirefoxConsole) {
      e.stopImmediatePropagation();
    }
  };

  try {
    window.addEventListener('keydown', unblockDevToolsKeys, true);
    document.addEventListener('keydown', unblockDevToolsKeys, true);
    window.addEventListener('keyup', unblockDevToolsKeys, true);
    document.addEventListener('keyup', unblockDevToolsKeys, true);
  } catch (_) {}

  // ─── 1. Prevent window.close() & Tab Termination ──────────────────────────
  try {
    window.close = noop;
    if (window.opener) {
      try { window.opener.close = noop; } catch (_) {}
    }
  } catch (_) {}

  // ─── 2. Strip 'debugger' from all Function constructors ────────────────────
  function patchFunctionConstructor(ctor) {
    if (!ctor || !ctor.prototype) return;
    try {
      const origCtor = ctor.prototype.constructor;
      ctor.prototype.constructor = new Proxy(origCtor, {
        apply(target, thisArg, args) {
          if (args.length > 0) {
            const lastIdx = args.length - 1;
            if (typeof args[lastIdx] === 'string' && args[lastIdx].includes('debugger')) {
              args = [...args];
              args[lastIdx] = stripDebugger(args[lastIdx]);
            }
          }
          return Reflect.apply(target, thisArg, args);
        }
      });
    } catch (_) {}
  }

  // Standard Function
  patchFunctionConstructor(window.Function);

  // AsyncFunction & GeneratorFunction prototypes
  try {
    const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
    patchFunctionConstructor(AsyncFunction);
  } catch (_) {}

  try {
    const GeneratorFunction = Object.getPrototypeOf(function* () {}).constructor;
    patchFunctionConstructor(GeneratorFunction);
  } catch (_) {}

  try {
    const AsyncGeneratorFunction = Object.getPrototypeOf(async function* () {}).constructor;
    patchFunctionConstructor(AsyncGeneratorFunction);
  } catch (_) {}

  // ─── 3. Strip 'debugger' from eval() ─────────────────────────────────────
  try {
    const nativeEval = (function () { return this.eval; }).call(window);
    window.eval = function (code) {
      if (typeof code === 'string' && code.includes('debugger')) {
        code = stripDebugger(code);
        // Neutralize while(1) or for(;;) infinite loops that only held a debugger statement
        if (/^\s*(while\s*\(\s*(1|true)\s*\)|for\s*\(\s*;;\s*\))\s*;?\s*$/.test(code)) {
          return undefined;
        }
      }
      return nativeEval.call(window, code);
    };
  } catch (_) {}

  // ─── 4. Block Web Worker debugger loops & Blob traps ─────────────────────
  try {
    const OriginalBlob = window.Blob;
    window.Blob = function (parts, options) {
      if (Array.isArray(parts)) {
        parts = parts.map(part => {
          if (typeof part === 'string' && part.includes('debugger')) {
            return stripDebugger(part);
          }
          return part;
        });
      }
      return new OriginalBlob(parts, options);
    };
    window.Blob.prototype = OriginalBlob.prototype;
  } catch (_) {}

  // ─── 5. Block setInterval/setTimeout/requestAnimationFrame debugger loops ─
  const origSetInterval = window.setInterval;
  const origSetTimeout = window.setTimeout;

  function hasDebugger(fn) {
    if (!fn) return false;
    try {
      if (typeof fn === 'function') {
        return fn.toString().includes('debugger');
      }
      if (typeof fn === 'string') {
        return fn.includes('debugger');
      }
    } catch (_) {}
    return false;
  }

  window.setInterval = function (fn, delay, ...rest) {
    if (hasDebugger(fn)) return origSetInterval(noop, 999999999);
    return origSetInterval.apply(this, [fn, delay, ...rest]);
  };

  window.setTimeout = function (fn, delay, ...rest) {
    if (hasDebugger(fn)) return origSetTimeout(noop, 999999999);
    return origSetTimeout.apply(this, [fn, delay, ...rest]);
  };

  const origRequestAnimationFrame = window.requestAnimationFrame;
  if (origRequestAnimationFrame) {
    window.requestAnimationFrame = function (fn) {
      if (hasDebugger(fn)) return origRequestAnimationFrame(noop);
      return origRequestAnimationFrame.apply(this, arguments);
    };
  }

  // ─── 6. Universal Console Inspection & Getter Trap Sanitizer ──────────────
  try {
    ['profiles', 'memory', 'profile', 'profileEnd'].forEach(function (prop) {
      try {
        Object.defineProperty(console, prop, {
          get: function () { return undefined; },
          set: noop,
          configurable: true,
          enumerable: false
        });
      } catch (_) {}
    });

    // Sanitize arguments passed to console methods to prevent getter/toString traps
    const safeArg = function (a) {
      if (typeof a === 'function') return '[Function]';
      if (a && typeof a === 'object') {
        try {
          // Check for custom getters that trigger on console inspection (e.g. devtools-detector id trap)
          const d = Object.getOwnPropertyDescriptor(a, 'id') ||
            (Object.getPrototypeOf(a) && Object.getOwnPropertyDescriptor(Object.getPrototypeOf(a), 'id'));
          if (d && (d.get || typeof d.value === 'function')) return '[Object]';
        } catch (_) {}
      }
      return a;
    };

    const wrapConsoleMethod = function (methodName) {
      const orig = console[methodName];
      if (typeof orig === 'function') {
        console[methodName] = function () {
          return orig.apply(console, Array.prototype.map.call(arguments, safeArg));
        };
      }
    };

    ['log', 'debug', 'info', 'warn', 'error', 'dir'].forEach(wrapConsoleMethod);

    // Neutralize console.clear and console.table spam
    console.clear = noop;
    console.table = noop;
    console.trace = noop;
  } catch (_) {}

  // ─── 7. Dimension Disparity Sanitizer (prevents DevTools dock detection) ─
  try {
    Object.defineProperty(window, 'outerWidth', {
      get: function () { return window.innerWidth; },
      configurable: true,
      enumerable: true
    });
    Object.defineProperty(window, 'outerHeight', {
      get: function () { return window.innerHeight; },
      configurable: true,
      enumerable: true
    });
  } catch (_) {}

  // ─── 8. Firebug Detection Bypass ─────────────────────────────────────────
  try {
    if (window.Firebug && window.Firebug.chrome) {
      Object.defineProperty(window.Firebug.chrome, 'isInitialized', {
        get: function () { return false; },
        configurable: true
      });
    }
  } catch (_) {}

  // Shield initialized successfully
  console.log('[Inspect Helper] Anti-Debug & DevTools protection active.');
})();
