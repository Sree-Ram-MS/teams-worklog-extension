/**
 * Work Entries Dashboard - Daily Work Log
 * Self-contained script for compatibility with both WebExtension and local file preview.
 */

(function () {
  'use strict';

  // Constants & Defaults
  const DEFAULT_PROJECTS = ['Internal Task', 'ColorLand', 'Internal Project', 'Project Phoenix', 'Customer Portal'];
  const DEFAULT_PLATFORMS = ['Internal Task', 'Jira', 'GitHub', 'Teams', 'Asana'];
  const DEFAULT_SETTINGS = {
    defaultPlatform: 'Internal Task',
    defaultProject: 'Internal Task',
    teamsWebhook: '',
  };

  // Check if Chrome extension storage is available
  function hasChromeStorage() {
    return typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local;
  }

  // Memory fallback cache for sandbox environments
  const memoryFallback = {};

  // UUID generator
  function generateUUID() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  // Storage Get Helper
  async function getStorageItem(key, defaultValue) {
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
          if (stored !== null) return JSON.parse(stored);
        }
      } catch (e) {
        console.warn('Storage read fallback error:', e);
      }
      return memoryFallback[key] !== undefined ? memoryFallback[key] : defaultValue;
    }
  }

  // Storage Set Helper
  async function setStorageItem(key, value) {
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
        console.warn('Storage write fallback error:', e);
      }
    }
  }

  function getTodayDateString() {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Calculate Week Range by Offset (0 = This Week, -1 = Previous Week, +1 = Next Week)
  function getWeekRangeByOffset(offset = 0) {
    const d = new Date();
    const day = d.getDay(); // 0 is Sunday, 1 is Monday ... 6 is Saturday

    const sunday = new Date(d);
    sunday.setDate(d.getDate() - day + (offset * 7));

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

  // Demo entries matching user screenshot and current week
  function getDefaultSampleEntries() {
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
        status: 'in_progress',
        createdAt: 1786000000000,
        completedAt: null,
      },
    ];
  }

  // CRUD Data Access
  async function getEntries() {
    const entries = await getStorageItem('wl_entries', null);
    if (entries === null) {
      const sample = getDefaultSampleEntries();
      await setStorageItem('wl_entries', sample);
      return sample;
    }
    return entries;
  }

  async function saveEntry(entryData) {
    const entries = await getEntries();
    const now = Date.now();
    const newEntry = {
      id: entryData.id || generateUUID(),
      date: entryData.date || getTodayDateString(),
      platform: entryData.platform || 'Internal Task',
      project: entryData.project || 'ColorLand',
      task: entryData.task.trim(),
      status: entryData.status || 'todo',
      createdAt: entryData.createdAt || now,
      completedAt: entryData.status === 'completed' ? (entryData.completedAt || now) : null,
    };

    entries.unshift(newEntry);
    await setStorageItem('wl_entries', entries);
    return newEntry;
  }

  async function updateEntry(id, updates) {
    const entries = await getEntries();
    const index = entries.findIndex((e) => e.id === id);
    if (index === -1) return null;

    const current = entries[index];
    const statusChanged = updates.status && updates.status !== current.status;

    let completedAt = current.completedAt;
    if (statusChanged) {
      completedAt = updates.status === 'completed' ? Date.now() : null;
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

  async function deleteEntry(id) {
    const entries = await getEntries();
    const filtered = entries.filter((e) => e.id !== id);
    await setStorageItem('wl_entries', filtered);
    return true;
  }

  async function getProjects() {
    const projects = await getStorageItem('wl_projects', null);
    if (!projects || !Array.isArray(projects) || projects.length === 0) {
      await setStorageItem('wl_projects', DEFAULT_PROJECTS);
      return [...DEFAULT_PROJECTS];
    }
    return projects;
  }

  async function getPlatforms() {
    const platforms = await getStorageItem('wl_platforms', null);
    if (!platforms || !Array.isArray(platforms) || platforms.length === 0) {
      await setStorageItem('wl_platforms', DEFAULT_PLATFORMS);
      return [...DEFAULT_PLATFORMS];
    }
    return platforms;
  }

  async function getSettings() {
    const settings = await getStorageItem('wl_settings', null);
    if (!settings) {
      await setStorageItem('wl_settings', DEFAULT_SETTINGS);
      return { ...DEFAULT_SETTINGS };
    }
    return { ...DEFAULT_SETTINGS, ...settings };
  }

  // Format Weekly Work Updates grouped by project
  function formatWeeklyCopy(entries, options = {}) {
    const { useBrackets = false } = options;

    if (!entries || entries.length === 0) {
      return 'Weekly Work Updates\n\n(No tasks logged for this period)';
    }

    const projectMap = new Map();

    entries.forEach((e) => {
      const proj = (e.project || 'General').trim();
      if (!projectMap.has(proj)) {
        projectMap.set(proj, []);
      }
      const taskText = (e.task || '').trim();
      if (taskText) {
        projectMap.get(proj).push(taskText);
      }
    });

    let text = 'Weekly Work Updates\n\n';
    const projectBlocks = [];

    for (const [project, tasks] of projectMap.entries()) {
      const uniqueTasks = Array.from(new Set(tasks));
      if (uniqueTasks.length > 0) {
        const header = useBrackets ? `{${project}}` : project;
        const taskLines = uniqueTasks.map((t) => `- ${t}`).join('\n');
        projectBlocks.push(`${header}\n${taskLines}`);
      }
    }

    text += projectBlocks.join('\n\n');
    return text.trim();
  }

  // Clipboard copy
  async function copyToClipboard(text) {
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch (err) {
        console.warn('navigator.clipboard failed, attempting fallback:', err);
      }
    }
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-9999px';
      textArea.style.top = '0';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      return successful;
    } catch (err) {
      console.error('Clipboard copy failed:', err);
      return false;
    }
  }

  // Export helpers
  function convertEntriesToCSV(entries) {
    const headers = ['Date', 'Project', 'Platform', 'Task', 'Status', 'Created At', 'Completed At'];
    const rows = entries.map((e) => [
      `"${e.date}"`,
      `"${(e.project || '').replace(/"/g, '""')}"`,
      `"${(e.platform || '').replace(/"/g, '""')}"`,
      `"${(e.task || '').replace(/"/g, '""')}"`,
      `"${e.status}"`,
      `"${e.createdAt ? new Date(e.createdAt).toISOString() : ''}"`,
      `"${e.completedAt ? new Date(e.completedAt).toISOString() : ''}"`,
    ]);
    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  }

  function downloadFile(content, fileName, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  }

  // Project colors
  const PROJECT_COLORS = {
    'Internal Task': '#eab308',
    'ColorLand': '#8b5cf6',
    'Internal Project': '#3b82f6',
    'Project Phoenix': '#06b6d4',
    'Customer Portal': '#10b981',
  };

  function getProjectColor(projectName) {
    if (PROJECT_COLORS[projectName]) return PROJECT_COLORS[projectName];
    let hash = 0;
    for (let i = 0; i < projectName.length; i++) {
      hash = projectName.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hues = [260, 210, 160, 45, 330, 190, 280];
    const selectedHue = hues[Math.abs(hash) % hues.length];
    return `hsl(${selectedHue}, 75%, 60%)`;
  }

  // Application State
  let allEntries = [];
  let filteredEntries = [];
  let currentWeekOffset = 0; // 0 = This Week, -1 = Previous Week, +1 = Next Week
  const initialRange = getWeekRangeByOffset(0);

  let filterState = {
    fromDate: initialRange.from,
    toDate: initialRange.to,
    project: 'all',
    platform: 'all',
    status: 'all',
  };

  let toastTimeout = null;

  // DOM Elements
  let todayTasksValue, todayTasksFill;
  let btnPrevWeek, btnThisWeek, btnNextWeek;
  let filterFromDate, filterToDate, filterProject, filterPlatform, filterStatus, btnClearFilters, entriesStatsText;
  let entriesTableBody, tableEmptyState, btnNewEntry, btnWeeklyCopy, btnOpenSettings, btnEmptyReset;
  let btnExportDashboard, dashboardExportMenu, btnExportCSV, btnExportJSON;
  let modalEntry, modalEntryTitle, formEntry, btnEntryModalClose, btnCancelEntryModal, entryEditId;
  let entryInputDate, entrySelectProject, entrySelectPlatform, entryInputTask, entryStatusGroup;
  let modalWeeklyCopy, btnWeeklyCopyModalClose, btnCloseWeeklyCopyModal, btnConfirmCopyClipboard, copyConfirmButtonText;
  let checkUseBrackets, weeklyCopyTextarea, weeklyCopyItemCount;
  let toastNotification, toastMessage;

  function queryDOMElements() {
    todayTasksValue = document.getElementById('todayTasksValue');
    todayTasksFill = document.getElementById('todayTasksFill');

    btnPrevWeek = document.getElementById('btnPrevWeek');
    btnThisWeek = document.getElementById('btnThisWeek');
    btnNextWeek = document.getElementById('btnNextWeek');

    filterFromDate = document.getElementById('filterFromDate');
    filterToDate = document.getElementById('filterToDate');
    filterProject = document.getElementById('filterProject');
    filterPlatform = document.getElementById('filterPlatform');
    filterStatus = document.getElementById('filterStatus');
    btnClearFilters = document.getElementById('btnClearFilters');
    entriesStatsText = document.getElementById('entriesStatsText');

    entriesTableBody = document.getElementById('entriesTableBody');
    tableEmptyState = document.getElementById('tableEmptyState');

    btnNewEntry = document.getElementById('btnNewEntry');
    btnWeeklyCopy = document.getElementById('btnWeeklyCopy');
    btnOpenSettings = document.getElementById('btnOpenSettings');
    btnEmptyReset = document.getElementById('btnEmptyReset');

    btnExportDashboard = document.getElementById('btnExportDashboard');
    dashboardExportMenu = document.getElementById('dashboardExportMenu');
    btnExportCSV = document.getElementById('btnExportCSV');
    btnExportJSON = document.getElementById('btnExportJSON');

    modalEntry = document.getElementById('modalEntry');
    modalEntryTitle = document.getElementById('modalEntryTitle');
    formEntry = document.getElementById('formEntry');
    btnEntryModalClose = document.getElementById('btnEntryModalClose');
    btnCancelEntryModal = document.getElementById('btnCancelEntryModal');
    entryEditId = document.getElementById('entryEditId');
    entryInputDate = document.getElementById('entryInputDate');
    entrySelectProject = document.getElementById('entrySelectProject');
    entrySelectPlatform = document.getElementById('entrySelectPlatform');
    entryInputTask = document.getElementById('entryInputTask');
    entryStatusGroup = document.getElementById('entryStatusGroup');

    modalWeeklyCopy = document.getElementById('modalWeeklyCopy');
    btnWeeklyCopyModalClose = document.getElementById('btnWeeklyCopyModalClose');
    btnCloseWeeklyCopyModal = document.getElementById('btnCloseWeeklyCopyModal');
    btnConfirmCopyClipboard = document.getElementById('btnConfirmCopyClipboard');
    copyConfirmButtonText = document.getElementById('copyConfirmButtonText');
    checkUseBrackets = document.getElementById('checkUseBrackets');
    weeklyCopyTextarea = document.getElementById('weeklyCopyTextarea');
    weeklyCopyItemCount = document.getElementById('weeklyCopyItemCount');

    toastNotification = document.getElementById('toastNotification');
    toastMessage = document.getElementById('toastMessage');
  }

  // Initialize
  async function init() {
    queryDOMElements();

    currentWeekOffset = 0;
    const range = getWeekRangeByOffset(0);
    filterState.fromDate = range.from;
    filterState.toDate = range.to;

    if (filterFromDate) filterFromDate.value = filterState.fromDate;
    if (filterToDate) filterToDate.value = filterState.toDate;

    updateWeekButtonsUI();

    await populateDropdowns();
    await refreshData();
    bindEvents();
  }

  function updateWeekButtonsUI() {
    if (btnPrevWeek) btnPrevWeek.classList.toggle('active', currentWeekOffset === -1);
    if (btnThisWeek) btnThisWeek.classList.toggle('active', currentWeekOffset === 0);
    if (btnNextWeek) btnNextWeek.classList.toggle('active', currentWeekOffset === 1);
  }

  function setWeekFilter(offset) {
    currentWeekOffset = offset;
    const range = getWeekRangeByOffset(currentWeekOffset);
    filterState.fromDate = range.from;
    filterState.toDate = range.to;

    if (filterFromDate) filterFromDate.value = filterState.fromDate;
    if (filterToDate) filterToDate.value = filterState.toDate;

    updateWeekButtonsUI();
    applyFiltersAndRender();

    const label = offset === 0 ? 'This Week' : offset === -1 ? 'Previous Week' : offset === 1 ? 'Next Week' : 'Week filter';
    showToast(`Showing ${label} (${range.from} to ${range.to})`);
  }

  async function populateDropdowns() {
    const [projects, platforms, settings] = await Promise.all([
      getProjects(),
      getPlatforms(),
      getSettings(),
    ]);

    if (filterProject) {
      filterProject.innerHTML = `
        <option value="all">All projects</option>
        ${projects.map((p) => `<option value="${escapeHTML(p)}">${escapeHTML(p)}</option>`).join('')}
      `;
    }

    if (filterPlatform) {
      filterPlatform.innerHTML = `
        <option value="all">All platforms</option>
        ${platforms.map((pl) => `<option value="${escapeHTML(pl)}">${escapeHTML(pl)}</option>`).join('')}
      `;
    }

    if (entrySelectProject) {
      entrySelectProject.innerHTML = projects
        .map((p) => `<option value="${escapeHTML(p)}">${escapeHTML(p)}</option>`)
        .join('');
      if (settings.defaultProject && projects.includes(settings.defaultProject)) {
        entrySelectProject.value = settings.defaultProject;
      }
    }

    if (entrySelectPlatform) {
      entrySelectPlatform.innerHTML = platforms
        .map((pl) => `<option value="${escapeHTML(pl)}">${escapeHTML(pl)}</option>`)
        .join('');
      if (settings.defaultPlatform && platforms.includes(settings.defaultPlatform)) {
        entrySelectPlatform.value = settings.defaultPlatform;
      }
    }
  }

  async function refreshData() {
    allEntries = await getEntries();
    updateTodayTasksCard();
    applyFiltersAndRender();
  }

  // Update "TODAY'S TASKS" Card (tasks progress without hours concept)
  function updateTodayTasksCard() {
    const todayStr = getTodayDateString();
    const todayEntries = allEntries.filter((e) => e.date === todayStr);

    const total = todayEntries.length;
    const completed = todayEntries.filter((e) => e.status === 'completed').length;

    if (todayTasksValue) {
      todayTasksValue.textContent = `${completed} / ${total} Completed`;
    }

    const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
    if (todayTasksFill) {
      todayTasksFill.style.width = `${percent}%`;
    }
  }

  function applyFiltersAndRender() {
    filteredEntries = allEntries.filter((entry) => {
      if (filterState.fromDate && entry.date < filterState.fromDate) {
        return false;
      }
      if (filterState.toDate && entry.date > filterState.toDate) {
        return false;
      }
      if (filterState.project !== 'all' && entry.project !== filterState.project) {
        return false;
      }
      if (filterState.platform !== 'all' && entry.platform !== filterState.platform) {
        return false;
      }
      if (filterState.status !== 'all' && entry.status !== filterState.status) {
        return false;
      }
      return true;
    });

    const count = filteredEntries.length;
    if (entriesStatsText) {
      entriesStatsText.textContent = `${count} ${count === 1 ? 'entry' : 'entries'}`;
    }

    renderTable(filteredEntries);
  }

  function renderTable(entries) {
    if (!entriesTableBody) return;

    if (!entries || entries.length === 0) {
      entriesTableBody.innerHTML = '';
      if (tableEmptyState) tableEmptyState.classList.remove('hidden');
      return;
    }

    if (tableEmptyState) tableEmptyState.classList.add('hidden');

    entriesTableBody.innerHTML = entries
      .map((item) => {
        const projColor = getProjectColor(item.project || 'General');

        let statusClass = 'status-pill-completed';
        let statusLabel = 'Completed';
        if (item.status === 'in_progress') {
          statusClass = 'status-pill-in_progress';
          statusLabel = 'In Progress';
        } else if (item.status === 'todo') {
          statusClass = 'status-pill-todo';
          statusLabel = 'To Do';
        }

        return `
        <tr data-id="${item.id}">
          <td class="cell-date">${escapeHTML(item.date)}</td>
          <td>
            <div class="cell-project">
              <span class="project-dot" style="background-color: ${projColor}"></span>
              <span>${escapeHTML(item.project || 'General')}</span>
            </div>
          </td>
          <td>
            <span class="cell-platform-tag">${escapeHTML(item.platform || 'Task')}</span>
          </td>
          <td class="cell-task">${escapeHTML(item.task)}</td>
          <td>
            <span class="status-pill-badge ${statusClass}" data-action="toggle-status" title="Click to cycle status">
              ${statusLabel}
            </span>
          </td>
          <td class="col-actions">
            <div class="cell-actions-container">
              <button class="action-icon-btn edit-btn" data-action="edit" title="Edit entry" aria-label="Edit entry">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 20h9"></path>
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                </svg>
              </button>
              <button class="action-icon-btn delete-btn" data-action="delete" title="Delete entry" aria-label="Delete entry">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
              </button>
            </div>
          </td>
        </tr>
        `;
      })
      .join('');
  }

  // Modal: Add / Edit Entry (No Hours field)
  function openAddModal() {
    if (!modalEntry) return;
    modalEntryTitle.textContent = 'Add New Entry';
    entryEditId.value = '';
    entryInputDate.value = getTodayDateString();
    entryInputTask.value = '';

    setStatusRadio('completed');
    modalEntry.classList.remove('hidden');
    entryInputTask.focus();
  }

  function openEditModal(entry) {
    if (!modalEntry) return;
    modalEntryTitle.textContent = 'Edit Entry';
    entryEditId.value = entry.id;
    entryInputDate.value = entry.date || getTodayDateString();
    entryInputTask.value = entry.task || '';

    if (entry.project && entrySelectProject) entrySelectProject.value = entry.project;
    if (entry.platform && entrySelectPlatform) entrySelectPlatform.value = entry.platform;

    setStatusRadio(entry.status || 'completed');
    modalEntry.classList.remove('hidden');
    entryInputTask.focus();
  }

  function closeEntryModal() {
    if (!modalEntry) return;
    modalEntry.classList.add('hidden');
    formEntry.reset();
    entryEditId.value = '';
  }

  function setStatusRadio(status) {
    if (!entryStatusGroup) return;
    entryStatusGroup.querySelectorAll('.status-radio-pill').forEach((pill) => {
      const radio = pill.querySelector('input[type="radio"]');
      if (pill.dataset.status === status) {
        pill.classList.add('active');
        if (radio) radio.checked = true;
      } else {
        pill.classList.remove('active');
        if (radio) radio.checked = false;
      }
    });
  }

  function getSelectedStatus() {
    if (!entryStatusGroup) return 'completed';
    const activePill = entryStatusGroup.querySelector('.status-radio-pill.active');
    return activePill ? activePill.dataset.status : 'completed';
  }

  // Modal: Weekly Copy
  function openWeeklyCopyModal() {
    if (!modalWeeklyCopy) return;
    const useBrackets = checkUseBrackets ? checkUseBrackets.checked : false;
    const copyText = formatWeeklyCopy(filteredEntries, { useBrackets });
    if (weeklyCopyTextarea) weeklyCopyTextarea.value = copyText;

    const count = filteredEntries.length;
    if (weeklyCopyItemCount) weeklyCopyItemCount.textContent = `${count} ${count === 1 ? 'task' : 'tasks'} included`;

    modalWeeklyCopy.classList.remove('hidden');

    copyToClipboard(copyText);
    if (copyConfirmButtonText) copyConfirmButtonText.textContent = '✓ Copied to Clipboard!';
    showToast('Copied Weekly Work Updates to clipboard!');

    setTimeout(() => {
      if (copyConfirmButtonText) copyConfirmButtonText.textContent = 'Copy to Clipboard';
    }, 2500);
  }

  function closeWeeklyCopyModal() {
    if (modalWeeklyCopy) modalWeeklyCopy.classList.add('hidden');
  }

  function showToast(msg) {
    if (!toastNotification || !toastMessage) return;
    toastMessage.textContent = msg;
    toastNotification.classList.remove('hidden');

    if (toastTimeout) clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
      toastNotification.classList.add('hidden');
    }, 2400);
  }

  function bindEvents() {
    // Week Preset Filter Buttons (Previous Week, This Week, Next Week)
    if (btnPrevWeek) {
      btnPrevWeek.addEventListener('click', () => setWeekFilter(-1));
    }
    if (btnThisWeek) {
      btnThisWeek.addEventListener('click', () => setWeekFilter(0));
    }
    if (btnNextWeek) {
      btnNextWeek.addEventListener('click', () => setWeekFilter(1));
    }

    // Manual date pickers
    if (filterFromDate) {
      filterFromDate.addEventListener('change', (e) => {
        filterState.fromDate = e.target.value;
        // Unmark presets as active if custom date
        if (btnPrevWeek) btnPrevWeek.classList.remove('active');
        if (btnThisWeek) btnThisWeek.classList.remove('active');
        if (btnNextWeek) btnNextWeek.classList.remove('active');
        applyFiltersAndRender();
      });
    }

    if (filterToDate) {
      filterToDate.addEventListener('change', (e) => {
        filterState.toDate = e.target.value;
        if (btnPrevWeek) btnPrevWeek.classList.remove('active');
        if (btnThisWeek) btnThisWeek.classList.remove('active');
        if (btnNextWeek) btnNextWeek.classList.remove('active');
        applyFiltersAndRender();
      });
    }

    // Dropdown filters
    if (filterProject) {
      filterProject.addEventListener('change', (e) => {
        filterState.project = e.target.value;
        applyFiltersAndRender();
      });
    }

    if (filterPlatform) {
      filterPlatform.addEventListener('change', (e) => {
        filterState.platform = e.target.value;
        applyFiltersAndRender();
      });
    }

    if (filterStatus) {
      filterStatus.addEventListener('change', (e) => {
        filterState.status = e.target.value;
        applyFiltersAndRender();
      });
    }

    // Reset filters to default (This Week)
    const resetFilters = () => {
      currentWeekOffset = 0;
      const range = getWeekRangeByOffset(0);
      filterState.fromDate = range.from;
      filterState.toDate = range.to;
      filterState.project = 'all';
      filterState.platform = 'all';
      filterState.status = 'all';

      if (filterFromDate) filterFromDate.value = filterState.fromDate;
      if (filterToDate) filterToDate.value = filterState.toDate;
      if (filterProject) filterProject.value = 'all';
      if (filterPlatform) filterPlatform.value = 'all';
      if (filterStatus) filterStatus.value = 'all';

      updateWeekButtonsUI();
      applyFiltersAndRender();
      showToast('Reset filter to This Week (Sunday to Saturday)');
    };

    if (btnClearFilters) btnClearFilters.addEventListener('click', resetFilters);
    if (btnEmptyReset) btnEmptyReset.addEventListener('click', resetFilters);

    // Export Dropdown on Dashboard
    if (btnExportDashboard) {
      btnExportDashboard.addEventListener('click', (e) => {
        e.stopPropagation();
        if (dashboardExportMenu) dashboardExportMenu.classList.toggle('hidden');
      });
    }

    document.addEventListener('click', () => {
      if (dashboardExportMenu) dashboardExportMenu.classList.add('hidden');
    });

    if (btnExportCSV) {
      btnExportCSV.addEventListener('click', async () => {
        const all = await getEntries();
        if (all.length === 0) {
          showToast('No entries to export');
          return;
        }
        const csv = convertEntriesToCSV(all);
        downloadFile(csv, `daily-worklog-${getTodayDateString()}.csv`, 'text/csv;charset=utf-8;');
        showToast('CSV downloaded');
      });
    }

    if (btnExportJSON) {
      btnExportJSON.addEventListener('click', async () => {
        const all = await getEntries();
        if (all.length === 0) {
          showToast('No entries to export');
          return;
        }
        const json = JSON.stringify(all, null, 2);
        downloadFile(json, `daily-worklog-backup-${getTodayDateString()}.json`, 'application/json');
        showToast('JSON backup downloaded');
      });
    }

    // Top Action Buttons
    if (btnNewEntry) btnNewEntry.addEventListener('click', openAddModal);
    if (btnWeeklyCopy) btnWeeklyCopy.addEventListener('click', openWeeklyCopyModal);

    if (btnOpenSettings) {
      btnOpenSettings.addEventListener('click', () => {
        if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.openOptionsPage) {
          chrome.runtime.openOptionsPage();
        } else {
          window.open('../options/options.html', '_blank');
        }
      });
    }

    // Table Event Delegation (Edit, Delete, Toggle Status)
    if (entriesTableBody) {
      entriesTableBody.addEventListener('click', async (e) => {
        const row = e.target.closest('tr');
        if (!row) return;
        const id = row.dataset.id;
        const entry = allEntries.find((item) => item.id === id);
        if (!entry) return;

        const editBtn = e.target.closest('[data-action="edit"]');
        if (editBtn) {
          openEditModal(entry);
          return;
        }

        const deleteBtn = e.target.closest('[data-action="delete"]');
        if (deleteBtn) {
          if (confirm(`Delete entry "${entry.task}"?`)) {
            await deleteEntry(id);
            await refreshData();
            showToast('Entry deleted');
          }
          return;
        }

        const statusBadge = e.target.closest('[data-action="toggle-status"]');
        if (statusBadge) {
          let nextStatus = 'completed';
          if (entry.status === 'completed') nextStatus = 'todo';
          else if (entry.status === 'todo') nextStatus = 'in_progress';
          else if (entry.status === 'in_progress') nextStatus = 'completed';

          await updateEntry(id, { status: nextStatus });
          await refreshData();
          showToast(`Status updated to ${nextStatus.replace('_', ' ')}`);
        }
      });
    }

    // Form Submit (No hours field in wizard)
    if (formEntry) {
      formEntry.addEventListener('submit', async (e) => {
        e.preventDefault();
        const task = entryInputTask.value.trim();
        if (!task) {
          entryInputTask.focus();
          return;
        }

        const date = entryInputDate.value || getTodayDateString();
        const project = entrySelectProject.value;
        const platform = entrySelectPlatform.value;
        const status = getSelectedStatus();
        const editId = entryEditId.value;

        if (editId) {
          await updateEntry(editId, {
            date,
            project,
            platform,
            task,
            status,
          });
          showToast('Entry updated!');
        } else {
          await saveEntry({
            date,
            project,
            platform,
            task,
            status,
          });
          showToast('New entry logged!');
        }

        closeEntryModal();
        await refreshData();
      });
    }

    if (btnEntryModalClose) btnEntryModalClose.addEventListener('click', closeEntryModal);
    if (btnCancelEntryModal) btnCancelEntryModal.addEventListener('click', closeEntryModal);

    if (entryStatusGroup) {
      entryStatusGroup.addEventListener('click', (e) => {
        const pill = e.target.closest('.status-radio-pill');
        if (pill) {
          setStatusRadio(pill.dataset.status);
        }
      });
    }

    if (btnWeeklyCopyModalClose) btnWeeklyCopyModalClose.addEventListener('click', closeWeeklyCopyModal);
    if (btnCloseWeeklyCopyModal) btnCloseWeeklyCopyModal.addEventListener('click', closeWeeklyCopyModal);

    if (checkUseBrackets) {
      checkUseBrackets.addEventListener('change', () => {
        const copyText = formatWeeklyCopy(filteredEntries, {
          useBrackets: checkUseBrackets.checked,
        });
        if (weeklyCopyTextarea) weeklyCopyTextarea.value = copyText;
      });
    }

    if (btnConfirmCopyClipboard) {
      btnConfirmCopyClipboard.addEventListener('click', async () => {
        const textToCopy = weeklyCopyTextarea ? weeklyCopyTextarea.value : '';
        const success = await copyToClipboard(textToCopy);
        if (success) {
          if (copyConfirmButtonText) copyConfirmButtonText.textContent = '✓ Copied!';
          showToast('Copied to clipboard!');
          setTimeout(() => {
            if (copyConfirmButtonText) copyConfirmButtonText.textContent = 'Copy to Clipboard';
          }, 2000);
        }
      });
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeEntryModal();
        closeWeeklyCopyModal();
      }
    });

    [modalEntry, modalWeeklyCopy].forEach((m) => {
      if (m) {
        m.addEventListener('click', (e) => {
          if (e.target === m) {
            closeEntryModal();
            closeWeeklyCopyModal();
          }
        });
      }
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

  // Run on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
