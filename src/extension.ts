chrome.action.onClicked.addListener(async (tab) => {
  chrome.scripting.executeScript({
    target: {tabId: tab.id},
    files: ['inject-loader.js'],
  });
});

chrome.runtime.onMessage.addListener((message, sender) => {
  if (message.type === 'enabled') {
    const enabled = message.payload;
    const tabId = sender.tab.id;
    const icon = enabled ? 'icon-enabled-128.png' : 'icon-128.png';
    chrome.action.setIcon({path: icon, tabId: tabId});
  }
  return false;
});
