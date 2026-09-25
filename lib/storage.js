/**
 * Storage management for Daily Work Log Chrome Extension
 * Supports chrome.storage.local with automatic localStorage fallback for standalone browser preview.
 */

const DEFAULT_PROJECTS = ['ColorLand', 'Internal Project', 'Project Phoenix', 'Customer Portal'];
const DEFAULT_PLATFORMS = ['Internal Task', 'Jira', 'GitHub', 'Teams', 'Asana'];
const DEFAULT_SETTINGS = {
  defaultPlatform: 'Jira',
  defaultProject: 'ColorLand',
  teamsWebhook: '',
};

function hasChromeStorage() {
  return typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local;
}

// Generate UUID v4
export function generateUUID() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

const memoryFallback = {};

// Low-level get helper
export async function getStorageItem(key, defaultValue) {
  if (hasChromeStorage()) {
    return new Promise((resolve) => {
      chrome.storage.local.get([key], (result) => {
        if (result && result[key] !== undefined) {
          resolve(result[key]);
        } else {
          resolve(defaultValue);
        }
      });
    });
  } else {
    try {
      if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem(key);
        if (stored !== null) {
          return JSON.parse(stored);
        }
      }
    } catch (e) {
      console.warn('Storage read fallback error, using memory:', e);
    }
    return memoryFallback[key] !== undefined ? memoryFallback[key] : defaultValue;
  }
}

// Low-level set helper
export async function setStorageItem(key, value) {
  if (hasChromeStorage()) {
    return new Promise((resolve) => {
      chrome.storage.local.set({ [key]: value }, () => {
        resolve();
      });
    });
  } else {
    memoryFallback[key] = value;
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(key, JSON.stringify(value));
      }
    } catch (e) {
      console.warn('Storage write fallback error, saved to memory:', e);
    }
  }
}

// === ENTRIES CRUD ===

export function formatTimeInput(val) {
  if (!val) return '1h';
  const str = String(val).trim().toLowerCase();
  if (str.endsWith('h') || str.endsWith('m')) return str;
  const num = parseFloat(str);
  if (isNaN(num)) return '1h';
  return `${num}h`;
}

export function parseHours(timeStr) {
  if (!timeStr) return 0;
  const str = String(timeStr).trim().toLowerCase();
  if (str.endsWith('m') && !str.includes('h')) {
    const mins = parseFloat(str);
    return isNaN(mins) ? 0 : mins / 60;
  }
  const match = str.match(/([\d.]+)/);
  if (!match) return 0;
  const val = parseFloat(match[1]);
  return isNaN(val) ? 0 : val;
}

export function getCurrentWeekRange(refDate = new Date()) {
  const d = typeof refDate === 'string' ? new Date(refDate + 'T00:00:00') : new Date(refDate);
  const day = d.getDay(); // 0 is Sunday
  
  const sunday = new Date(d);
  sunday.setDate(d.getDate() - day);
  
  const saturday = new Date(sunday);
  saturday.setDate(sunday.getDate() + 6);
  
  const formatYMD = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const dayOfMonth = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${dayOfMonth}`;
  };

  return {
    from: formatYMD(sunday),
    to: formatYMD(saturday),
  };
}

export function getDefaultSampleEntries() {
  const d = new Date();
  const day = d.getDay();
  const sunday = new Date(d);
  sunday.setDate(d.getDate() - day);

  const getDateStr = (offset) => {
    const target = new Date(sunday);
    target.setDate(sunday.getDate() + offset);
    const y = target.getFullYear();
    const m = String(target.getMonth() + 1).padStart(2, '0');
    const dayVal = String(target.getDate()).padStart(2, '0');
    return `${y}-${m}-${dayVal}`;
  };

  const mon = getDateStr(1);
  const tue = getDateStr(2);
  const wed = getDateStr(3);
  const thu = getDateStr(4);
  const fri = getDateStr(5);

  return [
    {
      id: generateUUID(),
      date: fri,
      platform: 'Internal Task',
      project: 'Internal Task',
      task: 'DAsh - Dashboard optimization & release verification',
      time: '3h',
      status: 'completed',
      createdAt: Date.now() - 3600000 * 2,
      completedAt: Date.now() - 3600000,
    },
    {
      id: generateUUID(),
      date: fri,
      platform: 'Internal Task',
      project: 'Internal Task',
      task: 'KPI calculation logic review & testing',
      time: '4h',
      status: 'completed',
      createdAt: Date.now() - 3600000 * 5,
      completedAt: Date.now() - 3600000 * 2,
    },
    {
      id: generateUUID(),
      date: thu,
      platform: 'Jira',
      project: 'ColorLand',
      task: 'Live Push and CSS error check',
      time: '2h',
      status: 'completed',
      createdAt: Date.now() - 3600000 * 26,
      completedAt: Date.now() - 3600000 * 24,
    },
    {
      id: generateUUID(),
      date: thu,
      platform: 'Internal Task',
      project: 'Internal Task',
      task: 'MarketPlace Testing & checkout regression',
      time: '4h',
      status: 'completed',
      createdAt: Date.now() - 3600000 * 30,
      completedAt: Date.now() - 3600000 * 26,
    },
    {
      id: generateUUID(),
      date: wed,
      platform: 'Teams',
      project: 'Internal Task',
      task: 'Internal Meeting HRMS & weekly milestone sync',
      time: '1h',
      status: 'completed',
      createdAt: Date.now() - 3600000 * 50,
      completedAt: Date.now() - 3600000 * 49,
    },
    {
      id: generateUUID(),
      date: tue,
      platform: 'Jira',
      project: 'Internal Task',
      task: 'April Testing & QA verification',
      time: '1h',
      status: 'completed',
      createdAt: Date.now() - 3600000 * 74,
      completedAt: Date.now() - 3600000 * 73,
    },
    {
      id: generateUUID(),
      date: mon,
      platform: 'GitHub',
      project: 'Internal Task',
      task: 'Amazon Import Testing & API sync fixes',
      time: '4h',
      status: 'in_progress',
      createdAt: Date.now() - 3600000 * 98,
      completedAt: null,
    },
    {
      id: generateUUID(),
      date: '2026-09-17',
      platform: 'Internal Task',
      project: 'Internal Task',
      task: 'DAsh',
      time: '3h',
      status: 'completed',
      createdAt: 1789600000000,
      completedAt: 1789610000000,
    },
    {
      id: generateUUID(),
      date: '2026-09-17',
      platform: 'Internal Task',
      project: 'Internal Task',
      task: 'KPI',
      time: '4h',
      status: 'completed',
      createdAt: 1789590000000,
      completedAt: 1789600000000,
    },
    {
      id: generateUUID(),
      date: '2026-08-31',
      platform: 'Internal Task',
      project: 'Internal Task',
      task: 'April Testing',
      time: '1h',
      status: 'completed',
      createdAt: 1788100000000,
      completedAt: 1788103600000,
    },
    {
      id: generateUUID(),
      date: '2026-08-31',
      platform: 'Internal Task',
      project: 'Internal Task',
      task: 'Internal Meeting HRMS',
      time: '1h',
      status: 'completed',
      createdAt: 1788105000000,
      completedAt: 1788108600000,
    },
    {
      id: generateUUID(),
      date: '2026-08-31',
      platform: 'Jira',
      project: 'ColorLand',
      task: 'Live Push and CSS error check',
      time: '2h',
      status: 'completed',
      createdAt: 1788110000000,
      completedAt: 1788117200000,
    },
    {
      id: generateUUID(),
      date: '2026-08-31',
      platform: 'Internal Task',
      project: 'Internal Task',
      task: 'MarketPlace Testing',
      time: '4h',
      status: 'completed',
      createdAt: 1788120000000,
      completedAt: 1788134400000,
    },
    {
      id: generateUUID(),
      date: '2026-08-07',
      platform: 'Internal Task',
      project: 'Internal Task',
      task: 'Amazon Import Testing',
      time: '4h',
      status: 'in_progress',
      createdAt: 1786000000000,
      completedAt: null,
    },
  ];
}

export async function getEntries() {
  const entries = await getStorageItem('wl_entries', null);
  if (entries === null) {
    const sample = getDefaultSampleEntries();
    await setStorageItem('wl_entries', sample);
    return sample;
  }
  return entries;
}

export async function getEntriesByDate(dateStr) {
  const entries = await getEntries();
  return entries.filter((e) => e.date === dateStr);
}

export async function saveEntry(entryData) {
  const entries = await getEntries();
  const now = Date.now();
  const newEntry = {
    id: entryData.id || generateUUID(),
    date: entryData.date || getTodayDateString(),
    platform: entryData.platform || 'Internal Task',
    project: entryData.project || 'ColorLand',
    task: entryData.task.trim(),
    time: entryData.time ? formatTimeInput(entryData.time) : '1h',
    status: entryData.status || 'todo', // 'todo' | 'in_progress' | 'completed'
    createdAt: entryData.createdAt || now,
    completedAt: entryData.status === 'completed' ? (entryData.completedAt || now) : null,
  };

  entries.unshift(newEntry);
  await setStorageItem('wl_entries', entries);
  return newEntry;
}

export async function updateEntry(id, updates) {
  const entries = await getEntries();
  const index = entries.findIndex((e) => e.id === id);
  if (index === -1) return null;

  const current = entries[index];
  const statusChanged = updates.status && updates.status !== current.status;
  
  let completedAt = current.completedAt;
  if (statusChanged) {
    if (updates.status === 'completed') {
      completedAt = Date.now();
    } else {
      completedAt = null;
    }
  }

  const updated = {
    ...current,
    ...updates,
    completedAt: updates.completedAt !== undefined ? updates.completedAt : completedAt,
  };

  entries[index] = updated;
  await setStorageItem('wl_entries', entries);
  return updated;
}

export async function deleteEntry(id) {
  const entries = await getEntries();
  const filtered = entries.filter((e) => e.id !== id);
  await setStorageItem('wl_entries', filtered);
  return true;
}

export async function toggleEntryStatus(id) {
  const entries = await getEntries();
  const item = entries.find((e) => e.id === id);
  if (!item) return null;

  // Toggle cycle: todo -> in_progress -> completed -> todo
  // Or direct toggle: completed <-> previous status
  let newStatus;
  if (item.status === 'completed') {
    newStatus = 'todo';
  } else if (item.status === 'todo') {
    newStatus = 'completed';
  } else {
    newStatus = 'completed';
  }

  return await updateEntry(id, { status: newStatus });
}

// === PROJECTS CONFIG ===

export async function getProjects() {
  const projects = await getStorageItem('wl_projects', null);
  if (!projects || !Array.isArray(projects) || projects.length === 0) {
    await setStorageItem('wl_projects', DEFAULT_PROJECTS);
    return [...DEFAULT_PROJECTS];
  }
  return projects;
}

export async function saveProjects(projects) {
  await setStorageItem('wl_projects', projects);
  return projects;
}

export async function addProject(name) {
  const trimmed = name.trim();
  if (!trimmed) return false;
  const projects = await getProjects();
  if (!projects.includes(trimmed)) {
    projects.push(trimmed);
    await saveProjects(projects);
    return true;
  }
  return false;
}

export async function removeProject(name) {
  const projects = await getProjects();
  const filtered = projects.filter((p) => p !== name);
  await saveProjects(filtered);
  return true;
}

// === PLATFORMS CONFIG ===

export async function getPlatforms() {
  const platforms = await getStorageItem('wl_platforms', null);
  if (!platforms || !Array.isArray(platforms) || platforms.length === 0) {
    await setStorageItem('wl_platforms', DEFAULT_PLATFORMS);
    return [...DEFAULT_PLATFORMS];
  }
  return platforms;
}

export async function savePlatforms(platforms) {
  await setStorageItem('wl_platforms', platforms);
  return platforms;
}

export async function addPlatform(name) {
  const trimmed = name.trim();
  if (!trimmed) return false;
  const platforms = await getPlatforms();
  if (!platforms.includes(trimmed)) {
    platforms.push(trimmed);
    await savePlatforms(platforms);
    return true;
  }
  return false;
}

export async function removePlatform(name) {
  const platforms = await getPlatforms();
  const filtered = platforms.filter((p) => p !== name);
  await savePlatforms(filtered);
  return true;
}

// === SETTINGS CONFIG ===

export async function getSettings() {
  const settings = await getStorageItem('wl_settings', null);
  if (!settings) {
    await setStorageItem('wl_settings', DEFAULT_SETTINGS);
    return { ...DEFAULT_SETTINGS };
  }
  return { ...DEFAULT_SETTINGS, ...settings };
}

export async function saveSettings(settings) {
  const current = await getSettings();
  const merged = { ...current, ...settings };
  await setStorageItem('wl_settings', merged);
  return merged;
}

// === UTILS ===

export function getTodayDateString() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export async function clearAllData() {
  if (hasChromeStorage()) {
    await new Promise((resolve) => chrome.storage.local.clear(resolve));
  } else {
    localStorage.clear();
  }
  // Re-seed default lists
  await saveProjects(DEFAULT_PROJECTS);
  await savePlatforms(DEFAULT_PLATFORMS);
  await saveSettings(DEFAULT_SETTINGS);
}
