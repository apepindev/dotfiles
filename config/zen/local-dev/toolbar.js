// Dev toolbar fixed to the top of local pages. It lives in a closed shadow root
// so page CSS cannot restyle it, and it pushes the page down by its height.
(() => {
  if (window.__localDevToolbar || window.top !== window) return;
  window.__localDevToolbar = true;

  const HEIGHT = 28;
  const MAX_ENTRIES = 200;

  // --- Capture: starts at document_start, before the bar exists. -----------
  const errors = [];
  const requests = [];
  let ui = null;

  function push(list, item) {
    list.push({ ...item, time: new Date() });
    if (list.length > MAX_ENTRIES) list.shift();
    ui?.update();
  }

  function recordError(kind, message) {
    push(errors, { kind, message: String(message).slice(0, 500) });
  }

  window.addEventListener("error", (e) => {
    // Failed <img>/<script> loads also fire here. The resource observer below
    // already counts those, so only script errors are recorded.
    if (e.target !== window) return;
    recordError("error", e.message || "Uncaught error");
  }, true);

  window.addEventListener("unhandledrejection", (e) => {
    let message;
    try {
      message = e.reason?.message ?? String(e.reason);
    } catch {
      message = "Unhandled promise rejection";
    }
    recordError("rejection", message);
  });

  // Wraps the page's own console.error. Content scripts run in a separate
  // scope, so exportFunction is needed to replace a function the page calls.
  function describe(value) {
    try {
      if (typeof value === "string") return value;
      if (value?.message) return value.message;
      return JSON.stringify(value) ?? String(value);
    } catch {
      return String(value);
    }
  }
  try {
    const pageConsole = window.wrappedJSObject.console;
    const original = pageConsole.error;
    exportFunction(
      function (...args) {
        recordError("console", args.map(describe).join(" "));
        return original.apply(pageConsole, args);
      },
      pageConsole,
      { defineAs: "error" }
    );
  } catch {}

  // Fetch and XHR go to the request log. Any request with status 400 or above,
  // assets included, also counts as an error.
  try {
    new PerformanceObserver((list) => {
      for (const r of list.getEntries()) {
        if (r.initiatorType === "fetch" || r.initiatorType === "xmlhttprequest") {
          push(requests, {
            status: r.responseStatus,
            duration: Math.round(r.duration),
            url: r.name,
            type: r.initiatorType === "fetch" ? "fetch" : "xhr",
          });
        }
        if (r.responseStatus >= 400) recordError("request", `${r.responseStatus} ${r.name}`);
      }
    }).observe({ type: "resource", buffered: true });
  } catch {}

  // --- UI ------------------------------------------------------------------
  // Colors are variables so the bar can match the page's light or dark theme.
  // The yellow badge and the striped edge stay the same in both.
  const MONO = "ui-monospace, SFMono-Regular, Menlo, monospace";
  const CSS = `
    :host {
      all: initial; position: fixed; inset: 0 0 auto 0; height: ${HEIGHT}px; z-index: 2147483647;
      --bg: #141414; --fg: #e8e8e8; --muted: #aaaaaa; --faint: #777777; --hover: #2a2a2a;
      --line: #333333; --row: #262626; --panel: #1b1b1b; --tag: #f5c518; --bad: #ff7b7b;
      --armed-bg: #5c1a1a; --armed-fg: #ffb3b3;
    }
    :host([data-theme="light"]) {
      --bg: #fafafa; --fg: #1a1a1a; --muted: #555555; --faint: #888888; --hover: #e6e6e6;
      --line: #d4d4d4; --row: #eeeeee; --panel: #ffffff; --tag: #8a6d00; --bad: #c62828;
      --armed-bg: #fde0e0; --armed-fg: #a11111;
    }
    * { box-sizing: border-box; }
    .bar {
      display: flex; align-items: center; gap: 2px; height: ${HEIGHT}px; padding: 0 6px 0 0;
      background: var(--bg); color: var(--fg); font: 12px/1 ${MONO};
      border-bottom: 3px solid transparent;
      border-image: repeating-linear-gradient(-45deg, #f5c518 0 6px, #111 6px 12px) 3;
      /* Scrolls sideways when the page is narrower than the bar. */
      overflow-x: auto; scrollbar-width: none;
    }
    .bar > * { flex-shrink: 0; }
    .badge {
      height: 100%; display: flex; align-items: center; padding: 0 8px; margin-right: 4px;
      background: #f5c518; color: #111; font-weight: 700; letter-spacing: .06em; font-size: 10px;
    }
    button, select {
      all: unset; height: 20px; padding: 0 8px; border-radius: 5px; cursor: pointer;
      display: inline-flex; align-items: center; gap: 4px; white-space: nowrap; color: inherit;
    }
    button:hover, select:hover { background: var(--hover); }
    button:focus-visible, select:focus-visible { outline: 1px solid #f5c518; }
    button.on { background: #f5c518; color: #111; }
    option { color: #111; background: #fff; }
    .sep { width: 1px; height: 14px; background: var(--line); margin: 0 4px; }
    .spacer { flex: 1; }
    .mono { color: var(--muted); }
    .timing, .viewport { padding: 0 6px; }
    .errors.has { color: var(--bad); }
    .danger.armed { background: var(--armed-bg); color: var(--armed-fg); }
    .panel {
      position: absolute; top: ${HEIGHT}px; left: 8px; width: min(720px, calc(100vw - 16px));
      max-height: 360px; overflow: auto; background: var(--panel); color: var(--fg);
      border: 1px solid var(--line); border-top: none; border-radius: 0 0 8px 8px;
      font: 12px/1.4 ${MONO};
    }
    .panel[hidden] { display: none; }
    .panel header {
      position: sticky; top: 0; display: flex; justify-content: space-between; align-items: center;
      padding: 4px 4px 4px 10px; background: var(--panel); border-bottom: 1px solid var(--line);
    }
    .entry { padding: 6px 10px; border-bottom: 1px solid var(--row); word-break: break-all; }
    .tag { color: var(--tag); margin-right: 6px; }
    .dim { color: var(--faint); margin-right: 6px; }
    .bad { color: var(--bad); }
    h4 { margin: 0; padding: 8px 10px 4px; font: 600 11px ${MONO}; color: var(--muted); text-transform: uppercase; letter-spacing: .06em; }
    table { width: 100%; border-collapse: collapse; }
    td { padding: 4px 10px; border-bottom: 1px solid var(--row); vertical-align: top; word-break: break-all; }
    td:first-child { width: 30%; color: var(--tag); }
    .empty { padding: 8px 10px; color: var(--faint); }
  `;

  const HTML = `
    <div class="bar">
      <span class="badge">LOCAL</span>
      <select class="ports" title="Switch port (same path)"></select>
      <span class="sep"></span>
      <button class="errors" data-panel="errors" title="Errors, console.error calls and failed requests"></button>
      <button class="requests" data-panel="requests" title="Fetch and XHR requests"></button>
      <button data-panel="storage" title="Cookies, localStorage and sessionStorage">Storage</button>
      <span class="sep"></span>
      <button class="outline" title="Outline every element">Outline</button>
      <button class="clear danger" title="Clear cookies, storage, IndexedDB and service workers">Clear site data</button>
      <span class="spacer"></span>
      <span class="timing mono"></span>
      <span class="viewport mono" title="Viewport size. Cmd+Option+M opens Responsive Design Mode."></span>
      <button class="close" title="Hide until reload">✕</button>
    </div>
    <div class="panel" hidden>
      <header><span class="panel-title"></span><button class="panel-action"></button></header>
      <div class="panel-body"></div>
    </div>
  `;

  const defaultPort = () => location.port || (location.protocol === "https:" ? "443" : "80");

  // Small DOM helper. Text always goes in through textContent, never innerHTML.
  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function shortUrl(url) {
    try {
      const u = new URL(url);
      return u.origin === location.origin ? u.pathname + u.search : url;
    } catch {
      return url;
    }
  }

  function buildUI(settings) {
    const host = document.createElement("local-dev-toolbar");
    const root = host.attachShadow({ mode: "closed" });
    // CSS and HTML are fixed strings. DOMParser keeps the add-on reviewer's
    // linter happy, which flags any innerHTML assignment.
    root.append(
      el("style", "", CSS),
      ...new DOMParser().parseFromString(HTML, "text/html").body.childNodes
    );
    const $ = (sel) => root.querySelector(sel);
    const cleanups = [];

    // Port switcher. The current port comes first; others are probed on open.
    const current = defaultPort();
    const ports = [...new Set([current, ...settings.ports.map(String)])];
    const portSelect = $(".ports");
    for (const port of ports) {
      const opt = el("option", "", port === current ? `${location.hostname}:${port}` : `:${port}`);
      opt.value = port;
      portSelect.append(opt);
    }
    let lastProbe = 0;
    async function probe() {
      if (Date.now() - lastProbe < 5000) return;
      lastProbe = Date.now();
      const up = await browser.runtime.sendMessage({
        type: "probePorts",
        protocol: location.protocol,
        hostname: location.hostname,
        ports: ports.filter((p) => p !== current),
      });
      for (const opt of portSelect.options) {
        if (opt.value === current) continue;
        opt.textContent = `:${opt.value} ${up.includes(opt.value) ? "(up)" : "(down)"}`;
      }
    }
    portSelect.addEventListener("mousedown", probe);
    portSelect.addEventListener("focus", probe);
    portSelect.addEventListener("change", () => {
      const url = new URL(location.href);
      url.port = portSelect.value;
      location.href = url.href;
    });

    // Panels. One drop-down area; each bar button fills it with its own view.
    const panel = $(".panel");
    const panelTitle = $(".panel-title");
    const panelAction = $(".panel-action");
    const panelBody = $(".panel-body");
    let openPanel = null;

    const views = {
      errors: {
        title: "Errors, console.error and failed requests",
        action: ["Clear list", () => (errors.length = 0)],
        render() {
          if (!errors.length) return [el("div", "empty", "Nothing recorded since the page loaded.")];
          return [...errors].reverse().map((e) => {
            const row = el("div", "entry");
            row.append(el("span", "dim", e.time.toLocaleTimeString()), el("span", "tag", e.kind), e.message);
            return row;
          });
        },
      },
      requests: {
        title: "Fetch and XHR requests",
        action: ["Clear list", () => (requests.length = 0)],
        render() {
          if (!requests.length) return [el("div", "empty", "No fetch or XHR requests yet.")];
          return [...requests].reverse().map((r) => {
            const row = el("div", "entry");
            // Status 0 means a network failure or a cross-origin response without timing access.
            const status = el("span", r.status >= 400 || r.status === 0 ? "tag bad" : "tag", String(r.status || "ERR"));
            row.append(
              el("span", "dim", r.time.toLocaleTimeString()),
              status,
              el("span", "dim", `${r.type} ${r.duration}ms`),
              shortUrl(r.url)
            );
            return row;
          });
        },
      },
      storage: {
        title: "Storage for " + location.host,
        action: ["Refresh", () => {}],
        async render() {
          const cookies = await browser.runtime.sendMessage({ type: "getCookies", url: location.href });
          const table = (rows) => {
            if (!rows.length) return el("div", "empty", "Empty.");
            const t = el("table");
            for (const [k, v] of rows) {
              const tr = el("tr");
              tr.append(el("td", "", k), el("td", "", String(v).slice(0, 300)));
              t.append(tr);
            }
            return t;
          };
          const entriesOf = (store) => {
            try {
              return Object.keys(store).map((k) => [k, store.getItem(k)]);
            } catch {
              return [["(blocked)", "This page cannot read this storage."]];
            }
          };
          const cookieRows = cookies.map((c) => {
            const flags = [c.httpOnly && "HttpOnly", c.secure && "Secure", c.sameSite !== "no_restriction" && `SameSite=${c.sameSite}`]
              .filter(Boolean)
              .join(" ");
            return [c.name, flags ? `${c.value}  [${flags}]` : c.value];
          });
          return [
            el("h4", "", `Cookies (${cookieRows.length})`),
            table(cookieRows),
            el("h4", "", `localStorage (${localStorage.length})`),
            table(entriesOf(localStorage)),
            el("h4", "", `sessionStorage (${sessionStorage.length})`),
            table(entriesOf(sessionStorage)),
          ];
        },
      },
    };

    async function renderPanel() {
      if (!openPanel) return;
      const view = views[openPanel];
      panelTitle.textContent = view.title;
      panelAction.textContent = view.action[0];
      const nodes = await view.render();
      panelBody.replaceChildren(...nodes);
    }

    for (const btn of root.querySelectorAll("[data-panel]")) {
      btn.addEventListener("click", () => {
        openPanel = openPanel === btn.dataset.panel ? null : btn.dataset.panel;
        panel.hidden = !openPanel;
        for (const b of root.querySelectorAll("[data-panel]")) {
          b.classList.toggle("on", b.dataset.panel === openPanel);
        }
        renderPanel();
      });
    }
    panelAction.addEventListener("click", () => {
      views[openPanel].action[1]();
      update();
      renderPanel();
    });

    // Live counts on the bar. The error and request lists re-render as entries
    // arrive; the storage panel only refreshes when opened or on Refresh.
    const errorsBtn = $(".errors");
    const requestsBtn = $(".requests");
    function update() {
      const n = errors.length;
      errorsBtn.textContent = n === 1 ? "1 error" : `${n} errors`;
      errorsBtn.classList.toggle("has", n > 0);
      requestsBtn.textContent = `${requests.length} requests`;
      if (openPanel === "errors" || openPanel === "requests") renderPanel();
    }

    // Outline toggle. The style goes in the page itself; the shadow root
    // keeps the toolbar out of it.
    const outlineBtn = $(".outline");
    outlineBtn.addEventListener("click", () => {
      const existing = document.getElementById("local-dev-outline");
      if (existing) {
        existing.remove();
      } else {
        const style = el("style");
        style.id = "local-dev-outline";
        style.textContent =
          "*:not(local-dev-toolbar) { outline: 1px solid rgba(245, 197, 24, .6) !important; outline-offset: -1px !important; }";
        document.documentElement.append(style);
      }
      outlineBtn.classList.toggle("on", !existing);
    });
    cleanups.push(() => document.getElementById("local-dev-outline")?.remove());

    // Clearing site data needs a second click within 3 seconds.
    const clearBtn = $(".clear");
    let armTimer = null;
    clearBtn.addEventListener("click", () => {
      if (!armTimer) {
        clearBtn.classList.add("armed");
        clearBtn.textContent = "Click again to clear";
        armTimer = setTimeout(() => {
          armTimer = null;
          clearBtn.classList.remove("armed");
          clearBtn.textContent = "Clear site data";
        }, 3000);
        return;
      }
      try {
        sessionStorage.clear();
      } catch {}
      browser.runtime.sendMessage({ type: "clearSiteData", hostname: location.hostname });
    });
    cleanups.push(() => clearTimeout(armTimer));

    // Page-load timer, read from the navigation timing entry after load.
    const timing = $(".timing");
    function showTiming() {
      const nav = performance.getEntriesByType("navigation")[0];
      if (!nav || !nav.loadEventEnd) return;
      const ms = (v) => `${Math.round(v)}ms`;
      timing.textContent = `Load ${ms(nav.loadEventEnd)}`;
      timing.title = [
        `Time to first byte ${ms(nav.responseStart)}`,
        `DOMContentLoaded ${ms(nav.domContentLoadedEventEnd)}`,
        `Load ${ms(nav.loadEventEnd)}`,
      ].join("\n");
    }
    if (document.readyState === "complete") {
      showTiming();
    } else {
      // loadEventEnd is only set after load handlers finish, hence the timeout.
      window.addEventListener("load", () => setTimeout(showTiming), { once: true });
    }

    // Viewport size readout.
    const viewport = $(".viewport");
    const updateViewport = () => {
      viewport.textContent = `${window.innerWidth} × ${window.innerHeight}`;
    };
    window.addEventListener("resize", updateViewport);
    cleanups.push(() => window.removeEventListener("resize", updateViewport));
    updateViewport();

    // Theme matching. Reads the page's actual background color, so a site's own
    // light/dark toggle is followed even when it ignores the system setting.
    const darkQuery = window.matchMedia("(prefers-color-scheme: dark)");
    function backgroundIsDark() {
      for (const node of [document.body, document.documentElement]) {
        if (!node) continue;
        const parts = getComputedStyle(node).backgroundColor.match(/[\d.]+/g);
        if (!parts || parts.length < 3) continue;
        const [r, g, b, a = 1] = parts.map(Number);
        if (a === 0) continue; // transparent, look at the parent
        return 0.299 * r + 0.587 * g + 0.114 * b < 128;
      }
      // No background set anywhere: the browser default follows color-scheme.
      const scheme = getComputedStyle(document.documentElement).colorScheme;
      return scheme.includes("dark") && (!scheme.includes("light") || darkQuery.matches);
    }
    let themeTimer = null;
    function syncTheme() {
      host.dataset.theme = backgroundIsDark() ? "dark" : "light";
      // Sites often fade the background on toggle; check again after it settles.
      clearTimeout(themeTimer);
      themeTimer = setTimeout(() => {
        host.dataset.theme = backgroundIsDark() ? "dark" : "light";
      }, 400);
    }
    const themeObserver = new MutationObserver(syncTheme);
    themeObserver.observe(document.documentElement, { attributes: true });
    if (document.body) themeObserver.observe(document.body, { attributes: true });
    darkQuery.addEventListener("change", syncTheme);
    window.addEventListener("load", syncTheme, { once: true });
    cleanups.push(() => {
      themeObserver.disconnect();
      darkQuery.removeEventListener("change", syncTheme);
      clearTimeout(themeTimer);
    });
    syncTheme();

    $(".close").addEventListener("click", () => unmount());

    update();
    return {
      host,
      update,
      destroy() {
        for (const fn of cleanups) fn();
        host.remove();
      },
    };
  }

  // --- Mounting --------------------------------------------------------------
  let savedMargin = null;

  function mount(settings) {
    if (ui) return;
    ui = buildUI(settings);
    const html = document.documentElement;
    savedMargin = [html.style.getPropertyValue("margin-top"), html.style.getPropertyPriority("margin-top")];
    html.style.setProperty("margin-top", `${HEIGHT}px`, "important");
    html.append(ui.host);
  }

  function unmount() {
    if (!ui) return;
    ui.destroy();
    ui = null;
    document.documentElement.style.setProperty("margin-top", ...savedMargin);
  }

  async function refresh() {
    const settings = await getSettings();
    unmount();
    if (settings.toolbar && isLocalTab(settings, location.href)) mount(settings);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", refresh, { once: true });
  } else {
    refresh();
  }
  browser.storage.onChanged.addListener(refresh);
})();
