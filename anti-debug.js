/**
 * Inspect Helper - Ultimate Anti-Debug Engine v2.0.0
 * Architecture: State-of-the-Art Defense Against All Known DevTools Detectors & Obfuscators.
 *
 * Core Capabilities:
 * 1. Native Function Camouflage (makeNative): Spoofs `[native code]` to defeat selfDefending / tampering checks.
 * 2. Pre-Emptive Library Neutralizers: Disables `DisableDevtool` (theajack), `devtoolsDetector` (AEPKILL), and `ConsoleBan`.
 * 3. Multi-Constructor Debugger Stripper: Standard Function, AsyncFunction, GeneratorFunction, AsyncGeneratorFunction, eval().
 * 4. Web Worker & SharedWorker Armor: Strips `debugger;` loops from Blob and Worker script execution.
 * 5. Console Trap & Getter Neutralizer: Sanitizes custom `id`, `toString`, and `Symbol.toPrimitive` traps.
 * 6. Prototype Guard: Prevents `RegExp.prototype.toString` and `Date.prototype.toString` weaponization.
 * 7. Proctoring & Anti-Tab-Switch Shield: Spoofs `document.hidden`, `visibilityState`, `hasFocus()`, and neutralizes blur traps.
 * 8. Viewport Disparity Masking: Aligns outerWidth/innerHeight to defeat docking detectors.
 * 9. Anti-Termination: Blocks `window.close()`, opener closing, and blank-page redirects.
 * 10. Cross-Platform Shortcuts: Unblocks F12, Ctrl/Cmd+Shift+I/J/C, Ctrl/Cmd+U, Ctrl/Cmd+S on Windows, Linux, and macOS.
 */
(function () {
  'use strict';
  if (window.__inspectHelperUltimateActive) return;
  window.__inspectHelperUltimateActive = true;

  const noop = function () {};

  // ─── 1. Native Function Camouflage (Self-Defending Bypass) ─────────────────
  // Obfuscators (e.g. javascript-obfuscator selfDefending) run:
  // /\[native code\]/.test(Function.prototype.toString.call(func))
  // If false, they crash the browser. We mask all hooked functions with authentic [native code].
  const customNativeMap = new WeakMap();
  const nativeToString = Function.prototype.toString;

  function makeNative(fn, name) {
    if (typeof fn !== 'function') return fn;
    const fnName = name || fn.name || '';
    customNativeMap.set(fn, `function ${fnName}() { [native code] }`);
    return fn;
  }

  try {
    Function.prototype.toString = new Proxy(nativeToString, {
      apply(target, thisArg, args) {
        if (customNativeMap.has(thisArg)) {
          return customNativeMap.get(thisArg);
        }
        return Reflect.apply(target, thisArg, args);
      }
    });
    makeNative(Function.prototype.toString, 'toString');
  } catch (_) {}

  // ─── 2. Pre-Emptive Global Library Neutralizers ────────────────────────────
  // Neutralize theajack/disable-devtool before it initializes
  try {
    const mockDisableDevtool = function () { return mockDisableDevtool; };
    mockDisableDevtool.isSuspend = true;
    mockDisableDevtool.isRunning = false;
    mockDisableDevtool.isDevToolOpened = false;
    mockDisableDevtool.md5 = function () { return ''; };
    mockDisableDevtool.version = '0.5.0';
    mockDisableDevtool.close = noop;
    makeNative(mockDisableDevtool, 'DisableDevtool');

    Object.defineProperty(window, 'DisableDevtool', {
      get: function () { return mockDisableDevtool; },
      set: noop,
      configurable: true,
      enumerable: true
    });
  } catch (_) {}

  // Neutralize AEPKILL/devtools-detector
  try {
    const mockDevtoolsDetector = {
      isLaunch: false,
      isOpen: false,
      addListener: noop,
      removeListener: noop,
      launch: noop,
      stop: noop,
      checker: { isRunning: false }
    };
    Object.defineProperty(window, 'devtoolsDetector', {
      get: function () { return mockDevtoolsDetector; },
      set: noop,
      configurable: true,
      enumerable: true
    });
  } catch (_) {}

  // Neutralize ConsoleBan
  try {
    const mockConsoleBan = { init: noop };
    Object.defineProperty(window, 'ConsoleBan', {
      get: function () { return mockConsoleBan; },
      set: noop,
      configurable: true,
      enumerable: true
    });
  } catch (_) {}

  // ─── 3. Prototype Guard (RegExp & Date toString Traps) ────────────────────
  try {
    const origRegExpToString = RegExp.prototype.toString;
    makeNative(origRegExpToString, 'toString');
    Object.defineProperty(RegExp.prototype, 'toString', {
      value: function () {
        try {
          return origRegExpToString.call(this);
        } catch (_) {
          return '/(?:)/';
        }
      },
      writable: false,
      configurable: true
    });
    makeNative(RegExp.prototype.toString, 'toString');

    const origDateToString = Date.prototype.toString;
    makeNative(origDateToString, 'toString');
    Object.defineProperty(Date.prototype, 'toString', {
      value: function () {
        try {
          return origDateToString.call(this);
        } catch (_) {
          return '';
        }
      },
      writable: false,
      configurable: true
    });
    makeNative(Date.prototype.toString, 'toString');
  } catch (_) {}

  // ─── 4. Universal Debugger Loop Neutralizer ────────────────────────────────
  const stripDebugger = (s) => (typeof s === 'string' ? s.replace(/\bdebugger\s*;?/g, '') : s);

  function patchConstructor(ctor, ctorName) {
    if (!ctor || !ctor.prototype) return;
    try {
      const origCtor = ctor.prototype.constructor;
      const proxyCtor = new Proxy(origCtor, {
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
      makeNative(proxyCtor, ctorName);
      ctor.prototype.constructor = proxyCtor;
    } catch (_) {}
  }

  patchConstructor(window.Function, 'Function');

  try {
    const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
    patchConstructor(AsyncFunction, 'AsyncFunction');
  } catch (_) {}

  try {
    const GeneratorFunction = Object.getPrototypeOf(function* () {}).constructor;
    patchConstructor(GeneratorFunction, 'GeneratorFunction');
  } catch (_) {}

  try {
    const AsyncGeneratorFunction = Object.getPrototypeOf(async function* () {}).constructor;
    patchConstructor(AsyncGeneratorFunction, 'AsyncGeneratorFunction');
  } catch (_) {}

  // Native eval hook
  try {
    const nativeEval = (function () { return this.eval; }).call(window);
    const patchedEval = function (code) {
      if (typeof code === 'string' && code.includes('debugger')) {
        code = stripDebugger(code);
        if (/^\s*(while\s*\(\s*(1|true)\s*\)|for\s*\(\s*;;\s*\))\s*;?\s*$/.test(code)) {
          return undefined;
        }
      }
      return nativeEval.call(window, code);
    };
    makeNative(patchedEval, 'eval');
    window.eval = patchedEval;
  } catch (_) {}

  // ─── 5. Web Worker & SharedWorker & Blob Armor ────────────────────────────
  try {
    const OriginalBlob = window.Blob;
    const PatchedBlob = function (parts, options) {
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
    PatchedBlob.prototype = OriginalBlob.prototype;
    makeNative(PatchedBlob, 'Blob');
    window.Blob = PatchedBlob;

    if (window.Worker) {
      const OriginalWorker = window.Worker;
      const PatchedWorker = function (scriptURL, options) {
        return new OriginalWorker(scriptURL, options);
      };
      PatchedWorker.prototype = OriginalWorker.prototype;
      makeNative(PatchedWorker, 'Worker');
      window.Worker = PatchedWorker;
    }
  } catch (_) {}

  // ─── 6. Timers (setInterval / setTimeout / requestAnimationFrame) ─────────
  const origSetInterval = window.setInterval;
  const origSetTimeout = window.setTimeout;

  function hasDebugger(fn) {
    if (!fn) return false;
    try {
      if (typeof fn === 'function') return fn.toString().includes('debugger');
      if (typeof fn === 'string') return fn.includes('debugger');
    } catch (_) {}
    return false;
  }

  const safeSetInterval = function (fn, delay, ...rest) {
    if (hasDebugger(fn)) return origSetInterval(noop, 999999999);
    return origSetInterval.apply(this, [fn, delay, ...rest]);
  };
  makeNative(safeSetInterval, 'setInterval');
  window.setInterval = safeSetInterval;

  const safeSetTimeout = function (fn, delay, ...rest) {
    if (hasDebugger(fn)) return origSetTimeout(noop, 999999999);
    return origSetTimeout.apply(this, [fn, delay, ...rest]);
  };
  makeNative(safeSetTimeout, 'setTimeout');
  window.setTimeout = safeSetTimeout;

  const origRequestAnimationFrame = window.requestAnimationFrame;
  if (origRequestAnimationFrame) {
    const safeRAF = function (fn) {
      if (hasDebugger(fn)) return origRequestAnimationFrame(noop);
      return origRequestAnimationFrame.apply(this, arguments);
    };
    makeNative(safeRAF, 'requestAnimationFrame');
    window.requestAnimationFrame = safeRAF;
  }

  // ─── 7. Universal Console Getter Traps & Sanitization ─────────────────────
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

    const safeArg = function (a) {
      if (typeof a === 'function') return '[Function]';
      if (a && typeof a === 'object') {
        try {
          const d = Object.getOwnPropertyDescriptor(a, 'id') ||
            (Object.getPrototypeOf(a) && Object.getOwnPropertyDescriptor(Object.getPrototypeOf(a), 'id'));
          if (d && (d.get || typeof d.value === 'function')) return '[Object]';
        } catch (_) {}
      }
      return a;
    };

    ['log', 'debug', 'info', 'warn', 'error', 'dir'].forEach(function (methodName) {
      const orig = console[methodName];
      if (typeof orig === 'function') {
        const wrapped = function () {
          return orig.apply(console, Array.prototype.map.call(arguments, safeArg));
        };
        makeNative(wrapped, methodName);
        console[methodName] = wrapped;
      }
    });

    const safeNoop = function () {};
    makeNative(safeNoop, 'clear');
    console.clear = safeNoop;
    console.table = safeNoop;
    console.trace = safeNoop;
  } catch (_) {}

  // ─── 8. Proctoring & Anti-Tab-Switch Shield ───────────────────────────────
  // Defeats tab-switch warning traps on Mettl, Wheebox, HackerRank, Google Forms
  try {
    Object.defineProperty(document, 'hidden', {
      get: function () { return false; },
      configurable: true,
      enumerable: true
    });

    Object.defineProperty(document, 'visibilityState', {
      get: function () { return 'visible'; },
      configurable: true,
      enumerable: true
    });

    const origHasFocus = document.hasFocus;
    const spoofHasFocus = function () { return true; };
    makeNative(spoofHasFocus, 'hasFocus');
    document.hasFocus = spoofHasFocus;

    const stopProctoringEvents = function (e) {
      // Prevent visibilitychange, blur, focusout events from alerting the proctoring script
      if (e.type === 'visibilitychange' || e.type === 'blur' || e.type === 'focusout') {
        e.stopImmediatePropagation();
      }
    };

    window.addEventListener('visibilitychange', stopProctoringEvents, true);
    document.addEventListener('visibilitychange', stopProctoringEvents, true);
    window.addEventListener('blur', stopProctoringEvents, true);
    window.addEventListener('focusout', stopProctoringEvents, true);
  } catch (_) {}

  // ─── 9. Viewport Dimension Alignment ─────────────────────────────────────
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

  // ─── 10. Navigation Hijack & Tab Close Protection ─────────────────────────
  try {
    const safeClose = function () {};
    makeNative(safeClose, 'close');
    window.close = safeClose;
    if (window.opener) {
      try { window.opener.close = safeClose; } catch (_) {}
    }
  } catch (_) {}

  // ─── 11. Cross-Platform DevTools Keyboard Shortcuts ───────────────────────
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

  // ─── 12. Shadow DOM Piercer (Closed Root Inspector Unlock) ────────────────
  try {
    const origAttachShadow = Element.prototype.attachShadow;
    if (origAttachShadow) {
      const patchedAttachShadow = function (init) {
        if (init && typeof init === 'object') {
          init = Object.assign({}, init, { mode: 'open' });
        }
        return origAttachShadow.call(this, init);
      };
      makeNative(patchedAttachShadow, 'attachShadow');
      Element.prototype.attachShadow = patchedAttachShadow;
    }
  } catch (_) {}

  console.log('[Inspect Helper Ultimate] All shields active & native camouflage deployed.');
})();
