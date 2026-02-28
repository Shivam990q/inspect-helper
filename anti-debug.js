/**
 * Anti-anti-debug: Prevents sites from closing the tab when DevTools opens.
 * Runs in page context (MAIN world) at document_start to override site's JavaScript.
 *
 * Addresses techniques from: devtools-detect, AEPKILL/devtools-detector,
 * javascript-obfuscator debug protection, and common console/DOM detection.
 */
(function () {
  'use strict';
  if (window.__inspectHelperAntiDebug) return;
  window.__inspectHelperAntiDebug = true;

  const noop = function () {};

  // Sites that use heavy anti-debug (close tab, dimension detection, etc.)
  var host = (window.location && window.location.hostname) || '';
  var isHeavyAntiDebug = /net22|netmirror/i.test(host);

  // ─── 0. Unblock DevTools keyboard shortcuts (F12, Ctrl+Shift+I, etc.) ──
  // Sites block these with keydown preventDefault. We run at document_start so
  // our capture listener runs before page scripts; stopImmediatePropagation
  // prevents the page from receiving the event so it can't block the shortcut.
  var unblockDevToolsKeys = function (e) {
    var isF12 = e.keyCode === 123 || e.key === 'F12';
    var isCtrlShiftI = (e.ctrlKey && e.shiftKey && (e.keyCode === 73 || e.key === 'I'));
    var isCtrlShiftJ = (e.ctrlKey && e.shiftKey && (e.keyCode === 74 || e.key === 'J'));
    var isCtrlShiftC = (e.ctrlKey && e.shiftKey && (e.keyCode === 67 || e.key === 'c'));
    if (isF12 || isCtrlShiftI || isCtrlShiftJ || isCtrlShiftC) {
      e.stopImmediatePropagation();
    }
  };
  try {
    window.addEventListener('keydown', unblockDevToolsKeys, true);
    document.addEventListener('keydown', unblockDevToolsKeys, true);
  } catch (_) {}

  // ─── 1. Prevent window.close() ─────────────────────────────────────────
  try {
    window.close = noop;
    if (window.opener) {
      try { window.opener.close = noop; } catch (_) {}
    }
  } catch (_) {}

  // ─── 2. Strip 'debugger' from Function constructor (incl. .constructor("debugger").call()) ──
  const OriginalFunction = window.Function.prototype.constructor;
  const stripDebugger = (s) => typeof s === 'string' ? s.replace(/debugger\s*;?/g, '') : s;
  window.Function.prototype.constructor = new Proxy(OriginalFunction, {
    apply(target, thisArg, args) {
      if (args[0] && typeof args[0] === 'string' && args[0].includes('debugger')) {
        args = [...args];
        args[0] = stripDebugger(args[0]);
      }
      return Reflect.apply(target, thisArg, args);
    }
  });

  // ─── 3. Strip 'debugger' from eval() ───────────────────────────────────
  // Sites use eval("debugger") or eval("while(1)debugger") - eval bypasses Function.
  try {
    const nativeEval = (function () { return this.eval; }).call(window);
    window.eval = function (code) {
      if (typeof code === 'string' && code.includes('debugger')) {
        code = stripDebugger(code);
        // Avoid infinite loops: "while(1)" or "for(;;)" with only debugger become no-op
        if (/^\s*(while\s*\(\s*1\s*\)|for\s*\(\s*;;\s*\))\s*;?\s*$/.test(code)) return undefined;
      }
      return nativeEval.call(window, code);
    };
  } catch (_) {}

  // ─── 4. Block setInterval/setTimeout callbacks that contain debugger ────
  const origSetInterval = window.setInterval;
  const origSetTimeout = window.setTimeout;

  function hasDebugger(fn) {
    try {
      return typeof fn === 'function' && fn.toString().includes('debugger');
    } catch (_) {
      return false;
    }
  }

  window.setInterval = function (fn, delay, ...rest) {
    if (hasDebugger(fn)) return origSetInterval(noop, 999999999);
    return origSetInterval.apply(this, [fn, delay, ...rest]);
  };

  window.setTimeout = function (fn, delay, ...rest) {
    if (hasDebugger(fn)) return origSetTimeout(noop, 999999999);
    return origSetTimeout.apply(this, [fn, delay, ...rest]);
  };

  var origRequestAnimationFrame = window.requestAnimationFrame;
  if (origRequestAnimationFrame) {
    window.requestAnimationFrame = function (fn) {
      if (hasDebugger(fn)) return origRequestAnimationFrame(noop);
      return origRequestAnimationFrame.apply(this, arguments);
    };
  }

  // ─── 5. Neutralize console.profiles / console.memory (DevTools detection) ─
  // Only override these - don't touch console.log etc. (would break normal sites)
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
  } catch (_) {}

  // ─── 5b. Heavy protections ONLY on known anti-debug sites (NetMirror, etc.) ─
  if (isHeavyAntiDebug) {
    try {
      var origLog = console.log;
      var safeArg = function (a) {
        if (typeof a === 'function') return '[Function]';
        if (a && typeof a === 'object') {
          try {
            var d = Object.getOwnPropertyDescriptor(a, 'id') || (Object.getPrototypeOf(a) && Object.getOwnPropertyDescriptor(Object.getPrototypeOf(a), 'id'));
            if (d && d.get) return '[Object]';
          } catch (_) {}
        }
        return a;
      };
      console.log = function () { return origLog.apply(console, Array.prototype.map.call(arguments, safeArg)); };
      console.debug = console.log;
      console.info = console.log;
      console.clear = noop;
      console.table = noop;
      console.trace = noop;
    } catch (_) {}
    try {
      var getOuterW = function () { return window.innerWidth + 100; };
      var getOuterH = function () { return window.innerHeight + 100; };
      Object.defineProperty(window, 'outerWidth', { get: getOuterW, configurable: true, enumerable: true });
      Object.defineProperty(window, 'outerHeight', { get: getOuterH, configurable: true, enumerable: true });
    } catch (_) {}
    try {
      var OrigArray = window.Array;
      var SafeArray = function () {
        var args = OrigArray.prototype.slice.call(arguments);
        if (args.length === 1 && typeof args[0] === 'number') {
          var n = args[0];
          if (n > 1e7 || n < 0 || !isFinite(n)) args[0] = 0;
        }
        return new (OrigArray.bind.apply(OrigArray, [null].concat(args)))();
      };
      SafeArray.prototype = OrigArray.prototype;
      SafeArray.isArray = OrigArray.isArray;
      window.Array = SafeArray;
    } catch (_) {}
    try {
      if (!window.Firebug) window.Firebug = {};
      if (!window.Firebug.chrome) window.Firebug.chrome = {};
      Object.defineProperty(window.Firebug.chrome, 'isInitialized', { get: function () { return false; }, configurable: true });
    } catch (_) {}
  }

  // ─── 6. Firebug check (devtools-detect) - only if it already exists ──────
  try {
    if (window.Firebug && window.Firebug.chrome) {
      Object.defineProperty(window.Firebug.chrome, 'isInitialized', {
        get: function () { return false; },
        configurable: true
      });
    }
  } catch (_) {}

  // console.log('[Inspect Helper] Anti-debug protection enabled.');
})();
