// Prefixes the page title with a zero-width space (U+200B). The character is
// invisible in the tab, but the tab's `label` attribute carries it, so
// userChrome.css can select local tabs with [label^="\200B"].
(() => {
  if (window.__localDevTape) return;
  window.__localDevTape = true;

  const MARK = "\u200B";

  function mark() {
    if (document.title.startsWith(MARK)) return;
    // An empty title would make the tab blank, so fall back to the host.
    document.title = MARK + (document.title || location.host);
  }

  function unmark() {
    if (document.title.startsWith(MARK)) document.title = document.title.slice(1);
  }

  // SPAs and dev servers rewrite the title after load; re-mark on every change.
  // The startsWith guard stops the observer from looping on its own write.
  const observer = new MutationObserver(mark);
  function start() {
    mark();
    observer.observe(document.head || document, {
      subtree: true,
      childList: true,
      characterData: true,
    });
  }
  function stop() {
    observer.disconnect();
    unmark();
  }

  // The script also runs when only the toolbar is on, so check the tape setting.
  // Settings changes apply to tabs that are already open.
  async function refresh() {
    const settings = await getSettings();
    settings.enabled && isLocalTab(settings, location.href) ? start() : stop();
  }

  refresh();
  browser.storage.onChanged.addListener(refresh);
})();
