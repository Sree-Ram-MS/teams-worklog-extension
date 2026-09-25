/**
 * Background Service Worker for Daily Work Log (Manifest V3)
 * Self-contained without external module imports to prevent script fetch errors.
 */

const DEFAULT_PROJECTS = ['ColorLand', 'Internal Project', 'Project Phoenix', 'Customer Portal'];
const DEFAULT_PLATFORMS = ['Internal Task', 'Jira', 'GitHub', 'Teams', 'Asana'];
const DEFAULT_SETTINGS = {
  defaultPlatform: 'Jira',
  defaultProject: 'ColorLand',
  teamsWebhook: '',
};

function getTodayString() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

async function updateBadge() {
  if (typeof chrome === 'undefined' || !chrome.action || !chrome.storage) return;
  try {
    const today = getTodayString();
    chrome.storage.local.get(['wl_entries'], (res) => {
      const entries = res?.wl_entries || [];
      const todayEntries = entries.filter((e) => e.date === today);
      const pendingCount = todayEntries.filter((e) => e.status !== 'completed').length;

      if (pendingCount > 0) {
        chrome.action.setBadgeText({ text: String(pendingCount) });
        chrome.action.setBadgeBackgroundColor({ color: '#4f46e5' });
      } else if (todayEntries.length > 0) {
        chrome.action.setBadgeText({ text: '✓' });
        chrome.action.setBadgeBackgroundColor({ color: '#10b981' });
      } else {
        chrome.action.setBadgeText({ text: '' });
      }
    });
  } catch (err) {
    console.warn('Error updating badge:', err);
  }
}

// On install, seed defaults if not set
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(['wl_projects', 'wl_platforms', 'wl_settings'], (res) => {
    const updates = {};
    if (!res.wl_projects || res.wl_projects.length === 0) updates.wl_projects = DEFAULT_PROJECTS;
    if (!res.wl_platforms || res.wl_platforms.length === 0) updates.wl_platforms = DEFAULT_PLATFORMS;
    if (!res.wl_settings) updates.wl_settings = DEFAULT_SETTINGS;
    if (Object.keys(updates).length > 0) {
      chrome.storage.local.set(updates);
    }
  });
  updateBadge();
});

// Sync badge on storage change
if (chrome.storage && chrome.storage.onChanged) {
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'local' && changes.wl_entries) {
      updateBadge();
    }
  });
}
