const $ = (id) => document.getElementById(id);

function setStatus(text, isError = false) {
  $("status").textContent = text;
  $("status").classList.toggle("error", isError);
}

function render({ enabled, toolbar, hosts, ports }) {
  $("enabled").checked = enabled;
  $("toolbar").checked = toolbar;
  $("hosts").value = hosts.join("\n");
  $("ports").value = ports.join(", ");
}

function readPorts() {
  return $("ports").value.split(/[\s,]+/).filter(Boolean).map(Number);
}

function readHosts() {
  return $("hosts").value.split("\n").map((l) => l.trim()).filter(Boolean);
}

async function save(settings) {
  const invalid = settings.hosts.filter((h) => !isValidPattern(h));
  if (invalid.length) {
    setStatus(`Invalid pattern: ${invalid[0]}`, true);
    return;
  }
  const badPort = settings.ports.find((p) => !Number.isInteger(p) || p < 1 || p > 65535);
  if (badPort !== undefined) {
    setStatus("Ports must be whole numbers from 1 to 65535.", true);
    return;
  }
  // The popup can close when Firefox shows the permission prompt, which kills
  // this script. The settings are parked in storage.local first, so
  // background.js can save them once the permission is granted.
  browser.storage.local.set({ pending: settings });
  // Firefox only shows the permission prompt during a click, so this request
  // runs before any other await.
  const granted = await browser.permissions.request({ origins: settings.hosts });
  if (!granted) {
    await browser.storage.local.remove("pending");
    setStatus("Permission denied. Nothing saved.", true);
    return;
  }
  await browser.storage.sync.set(settings);
  await browser.storage.local.remove("pending");
  setStatus("Saved. Reload local tabs that were open before a new host was added.");
}

$("save").addEventListener("click", () =>
  save({
    enabled: $("enabled").checked,
    toolbar: $("toolbar").checked,
    hosts: readHosts(),
    ports: readPorts(),
  })
);

$("reset").addEventListener("click", () => {
  render(DEFAULTS);
  save(DEFAULTS);
});

getSettings().then(render);
