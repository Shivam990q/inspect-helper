document.getElementById('enable').addEventListener('click', async () => {
  const btn = document.getElementById('enable');
  const originalHtml = btn.innerHTML;

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) {
      alert('Could not get current tab.');
      return;
    }
    if (tab.url?.startsWith('chrome://') || tab.url?.startsWith('chrome-extension://') || tab.url?.startsWith('edge://')) {
      alert('Extensions cannot run on internal browser pages.');
      return;
    }

    // Set force flag and re-execute content.js to clear stubborn handlers
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        window.__inspectHelperForceRefresh = true;
      }
    });

    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content.js']
    });

    btn.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
    btn.innerHTML = '<span>✅ Successfully Unlocked!</span>';

    setTimeout(() => {
      window.close();
    }, 600);
  } catch (err) {
    btn.innerHTML = originalHtml;
    alert('Notice: ' + (err.message || 'Could not re-enable. Try refreshing the page.'));
  }
});

