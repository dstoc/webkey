chrome.action.onClicked.addListener(async (tab) => {
  console.log('click');
  chrome.scripting.executeScript({
    target: {tabId: tab.id},
    files: ['inject-loader.js'],
  });
});
