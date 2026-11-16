// Shared by the background script, the content script and the options page.

const DEFAULTS = {
  enabled: true,
  hosts: [
    "*://localhost/*",
    "*://*.localhost/*",
    "*://127.0.0.1/*",
    "*://*.test/*",
  ],
  toolbar: true,
  ports: [3000, 5173, 8000, 8080],
};

function isLocalTab(settings, href) {
  return settings.hosts.some((h) => matchesPattern(h, href));
}

function getSettings() {
  return browser.storage.sync.get(DEFAULTS);
}

// Parses a WebExtension match pattern. Returns null when the pattern is invalid.
// Ports are ignored, matching how Firefox treats patterns.
function parsePattern(pattern) {
  const m = /^(\*|https?|wss?):\/\/(\*|\*\.[^/*:]+|[^/*:]+)(\/.*)$/.exec(pattern);
  if (!m) return null;
  const [, scheme, host, path] = m;
  const pathRe = new RegExp(
    "^" + path.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*") + "$"
  );
  return { scheme, host, pathRe };
}

function isValidPattern(pattern) {
  return parsePattern(pattern) !== null;
}

function matchesPattern(pattern, href) {
  const p = parsePattern(pattern);
  if (!p) return false;
  const url = new URL(href);
  const scheme = url.protocol.slice(0, -1);
  if (p.scheme === "*" ? !["http", "https", "ws", "wss"].includes(scheme) : p.scheme !== scheme) {
    return false;
  }
  const host = url.hostname;
  if (p.host.startsWith("*.")) {
    const base = p.host.slice(2);
    if (host !== base && !host.endsWith("." + base)) return false;
  } else if (p.host !== "*" && p.host !== host) {
    return false;
  }
  return p.pathRe.test(url.pathname + url.search);
}
