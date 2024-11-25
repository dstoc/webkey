(function() {
  let existing = document.querySelector('web-key');

  if (existing) {
    existing.toggleAttribute('disabled');
    const enabled = existing.getAttribute('disabled') == null;
    chrome.runtime.sendMessage({ type: "enabled", payload: enabled });
    return;
  }
  const script = document.createElement('script');
  script.src = chrome.runtime.getURL('inject.js');
  script.type = 'module';
  document.head.appendChild(script);
  chrome.runtime.sendMessage({ type: "enabled", payload: true });
})();
