document.getElementById('enable').addEventListener('click', async () => {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) {
      alert('Could not get current tab.');
      return;
    }
    if (tab.url?.startsWith('chrome://') || tab.url?.startsWith('chrome-extension://')) {
      alert('This extension cannot run on Chrome internal pages.');
      return;
    }
    // Anti-debug runs automatically at document_start. Just enable right-click:
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content.js']
    });
    // Close popup and optionally show brief feedback
    window.close();
  } catch (err) {
    alert('Error: ' + (err.message || 'Could not enable. Try refreshing the page.'));
  }
});
