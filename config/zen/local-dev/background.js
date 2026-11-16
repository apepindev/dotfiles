// Registers the content scripts on the hosts saved in the options page.
// Registrations do not survive a restart, so this runs on startup and on every
// settings change. One registration holds all scripts: content scripts in a
// frame share one global scope, so injecting patterns.js twice would fail.

let registration = null;
let queue = Promise.resolve();

async function apply() {
  if (registration) {
    await registration.unregister();
    registration = null;
  }
  const { enabled, toolbar, hosts } = await getSettings();
  if (!enabled && !toolbar) return;

  // Skip hosts whose permission was never granted or was revoked in about:addons.
  const allowed = [];
  for (const host of hosts) {
    if (isValidPattern(host) && (await browser.permissions.contains({ origins: [host] }))) {
      allowed.push(host);
    }
  }
  if (!allowed.length) return;

  // document_start so the toolbar's error counter sees errors during page load.
  registration = await browser.contentScripts.register({
    matches: allowed,
    js: [{ file: "patterns.js" }, { file: "content.js" }, { file: "toolbar.js" }],
    runAt: "document_start",
  });
}

// Chains calls so two quick saves cannot register twice.
function schedule() {
  queue = queue.then(apply).catch((err) => console.error("local-dev:", err));
}

browser.storage.onChanged.addListener((changes, area) => {
  if (area === "sync") schedule();
});
browser.permissions.onRemoved.addListener(schedule);
schedule();

// Saves settings that options.js parked before a permission prompt, in case
// the settings popup closed while the prompt was open.
browser.permissions.onAdded.addListener(async () => {
  const { pending } = await browser.storage.local.get("pending");
  if (!pending) return;
  if (await browser.permissions.contains({ origins: pending.hosts })) {
    await browser.storage.sync.set(pending);
    await browser.storage.local.remove("pending");
  }
});

// Returns the ports that answer any HTTP response within 800ms.
async function probePorts(protocol, hostname, ports) {
  const results = await Promise.all(
    ports.map(async (port) => {
      const abort = new AbortController();
      const timer = setTimeout(() => abort.abort(), 800);
      try {
        await fetch(`${protocol}//${hostname}:${port}/`, {
          method: "HEAD",
          cache: "no-store",
          redirect: "manual",
          signal: abort.signal,
        });
        return port;
      } catch {
        return null;
      } finally {
        clearTimeout(timer);
      }
    })
  );
  return results.filter((p) => p !== null);
}

// Requests from toolbar.js. Each returns a promise, which becomes the reply.
browser.runtime.onMessage.addListener((msg, sender) => {
  const tabId = sender.tab?.id;
  switch (msg.type) {
    case "getCookies":
      return browser.cookies.getAll({ url: msg.url });
    case "clearSiteData":
      // browsingData cannot clear sessionStorage; toolbar.js clears that itself.
      return browser.browsingData
        .remove(
          { hostnames: [msg.hostname] },
          { cookies: true, localStorage: true, indexedDB: true, serviceWorkers: true }
        )
        .then(() => browser.tabs.reload(tabId, { bypassCache: true }));
    case "probePorts":
      return probePorts(msg.protocol, msg.hostname, msg.ports);
  }
});
