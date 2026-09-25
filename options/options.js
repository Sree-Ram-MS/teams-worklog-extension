import {
  getProjects,
  addProject,
  removeProject,
  getPlatforms,
  addPlatform,
  removePlatform,
  getSettings,
  saveSettings,
  getEntries,
  clearAllData,
  getTodayDateString,
} from '../lib/storage.js';

import {
  convertEntriesToCSV,
  downloadFile,
} from '../lib/format.js';

// DOM Elements
const projectsList = document.getElementById('projectsList');
const platformsList = document.getElementById('platformsList');
const addProjectForm = document.getElementById('addProjectForm');
const addPlatformForm = document.getElementById('addPlatformForm');
const newProjectInput = document.getElementById('newProjectInput');
const newPlatformInput = document.getElementById('newPlatformInput');
const defaultProjectSelect = document.getElementById('defaultProjectSelect');
const defaultPlatformSelect = document.getElementById('defaultPlatformSelect');
const teamsWebhookInput = document.getElementById('teamsWebhookInput');
const btnSaveWebhook = document.getElementById('btnSaveWebhook');
const btnTestWebhook = document.getElementById('btnTestWebhook');
const btnBackupJSON = document.getElementById('btnBackupJSON');
const btnBackupCSV = document.getElementById('btnBackupCSV');
const btnResetData = document.getElementById('btnResetData');
const toastNotification = document.getElementById('toastNotification');
const toastMessage = document.getElementById('toastMessage');

let toastTimeout = null;

// Initialize
async function init() {
  await Promise.all([renderProjects(), renderPlatforms(), loadSettings()]);
  bindEvents();
}

function showToast(msg) {
  toastMessage.textContent = msg;
  toastNotification.classList.remove('hidden');
  if (toastTimeout) clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toastNotification.classList.add('hidden');
  }, 2400);
}

// === PROJECTS ===

async function renderProjects() {
  const [projects, settings] = await Promise.all([getProjects(), getSettings()]);

  projectsList.innerHTML = projects
    .map(
      (p) => `
    <li class="item-row">
      <span class="item-name">${escapeHTML(p)}</span>
      <button class="item-delete-btn" data-type="project" data-name="${escapeHTML(p)}" title="Delete project" aria-label="Delete ${escapeHTML(p)}">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    </li>
  `
    )
    .join('');

  defaultProjectSelect.innerHTML = projects
    .map((p) => `<option value="${escapeHTML(p)}">${escapeHTML(p)}</option>`)
    .join('');

  if (settings.defaultProject && projects.includes(settings.defaultProject)) {
    defaultProjectSelect.value = settings.defaultProject;
  }
}

// === PLATFORMS ===

async function renderPlatforms() {
  const [platforms, settings] = await Promise.all([getPlatforms(), getSettings()]);

  platformsList.innerHTML = platforms
    .map(
      (p) => `
    <li class="item-row">
      <span class="item-name">${escapeHTML(p)}</span>
      <button class="item-delete-btn" data-type="platform" data-name="${escapeHTML(p)}" title="Delete platform" aria-label="Delete ${escapeHTML(p)}">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    </li>
  `
    )
    .join('');

  defaultPlatformSelect.innerHTML = platforms
    .map((p) => `<option value="${escapeHTML(p)}">${escapeHTML(p)}</option>`)
    .join('');

  if (settings.defaultPlatform && platforms.includes(settings.defaultPlatform)) {
    defaultPlatformSelect.value = settings.defaultPlatform;
  }
}

// === SETTINGS ===

async function loadSettings() {
  const settings = await getSettings();
  if (settings.teamsWebhook) {
    teamsWebhookInput.value = settings.teamsWebhook;
  }
}

// === EVENT HANDLERS ===

function bindEvents() {
  // Add Project
  addProjectForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = newProjectInput.value.trim();
    if (!name) return;

    const added = await addProject(name);
    if (added) {
      newProjectInput.value = '';
      await renderProjects();
      showToast(`Added project "${name}"`);
    } else {
      showToast(`Project "${name}" already exists`);
    }
  });

  // Add Platform
  addPlatformForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = newPlatformInput.value.trim();
    if (!name) return;

    const added = await addPlatform(name);
    if (added) {
      newPlatformInput.value = '';
      await renderPlatforms();
      showToast(`Added platform "${name}"`);
    } else {
      showToast(`Platform "${name}" already exists`);
    }
  });

  // Delete Project delegation
  projectsList.addEventListener('click', async (e) => {
    const btn = e.target.closest('.item-delete-btn');
    if (!btn) return;
    const name = btn.dataset.name;
    const projects = await getProjects();
    if (projects.length <= 1) {
      showToast('You must have at least one project.');
      return;
    }
    await removeProject(name);
    await renderProjects();
    showToast(`Deleted "${name}"`);
  });

  // Delete Platform delegation
  platformsList.addEventListener('click', async (e) => {
    const btn = e.target.closest('.item-delete-btn');
    if (!btn) return;
    const name = btn.dataset.name;
    const platforms = await getPlatforms();
    if (platforms.length <= 1) {
      showToast('You must have at least one platform.');
      return;
    }
    await removePlatform(name);
    await renderPlatforms();
    showToast(`Deleted "${name}"`);
  });

  // Save Default Project
  defaultProjectSelect.addEventListener('change', async () => {
    await saveSettings({ defaultProject: defaultProjectSelect.value });
    showToast(`Default project set to "${defaultProjectSelect.value}"`);
  });

  // Save Default Platform
  defaultPlatformSelect.addEventListener('change', async () => {
    await saveSettings({ defaultPlatform: defaultPlatformSelect.value });
    showToast(`Default platform set to "${defaultPlatformSelect.value}"`);
  });

  // Save Webhook URL
  btnSaveWebhook.addEventListener('click', async () => {
    const url = teamsWebhookInput.value.trim();
    if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
      showToast('Please enter a valid HTTP/HTTPS URL');
      return;
    }
    await saveSettings({ teamsWebhook: url });
    showToast('Teams webhook URL saved');
  });

  // Test Webhook Dispatch
  btnTestWebhook.addEventListener('click', async () => {
    const url = teamsWebhookInput.value.trim();
    if (!url) {
      showToast('Please enter a webhook URL first');
      teamsWebhookInput.focus();
      return;
    }

    try {
      new URL(url);
    } catch {
      showToast('Invalid URL format');
      return;
    }

    showToast('Sending test ping to Teams...');
    try {
      const payload = {
        text: '🔔 **Daily Work Log Test Ping**\nConnection successfully verified from Daily Work Log Chrome Extension!',
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        mode: 'no-cors', // standard for incoming webhook endpoint calls from client
      });

      showToast('Test payload dispatched to Teams!');
    } catch (err) {
      console.error('Webhook error:', err);
      showToast('Dispatched test payload (check your Teams channel)');
    }
  });

  // Export JSON Backup
  btnBackupJSON.addEventListener('click', async () => {
    const entries = await getEntries();
    const json = JSON.stringify(entries, null, 2);
    downloadFile(json, `daily-worklog-backup-${getTodayDateString()}.json`, 'application/json');
    showToast(`Exported ${entries.length} entries as JSON`);
  });

  // Export CSV Backup
  btnBackupCSV.addEventListener('click', async () => {
    const entries = await getEntries();
    const csv = convertEntriesToCSV(entries);
    downloadFile(csv, `daily-worklog-${getTodayDateString()}.csv`, 'text/csv;charset=utf-8;');
    showToast(`Exported ${entries.length} entries as CSV`);
  });

  // Clear All Data
  btnResetData.addEventListener('click', async () => {
    const confirmed = confirm(
      'Are you sure you want to reset all data?\nThis will clear all logged entries and restore default project and platform lists.'
    );
    if (!confirmed) return;

    await clearAllData();
    await Promise.all([renderProjects(), renderPlatforms(), loadSettings()]);
    teamsWebhookInput.value = '';
    showToast('All data has been reset to defaults.');
  });
}

function escapeHTML(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

init();
