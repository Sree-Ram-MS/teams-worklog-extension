import {
  getEntriesByDate,
  getProjects,
  getPlatforms,
  getSettings,
  saveEntry,
  updateEntry,
  deleteEntry,
  toggleEntryStatus,
  getTodayDateString,
  getEntries,
  getCurrentWeekRange,
} from '../lib/storage.js';

import {
  formatDayCopy,
  formatWeeklyCopy,
  formatSingleEntry,
  copyToClipboard,
  convertEntriesToCSV,
  downloadFile,
} from '../lib/format.js';

// Application State
let currentDate = getTodayDateString();
let activeStatus = 'todo';
let currentEntries = [];
let toastTimeout = null;

// DOM Elements
const selectPlatform = document.getElementById('selectPlatform');
const selectProject = document.getElementById('selectProject');
const inputTask = document.getElementById('inputTask');
const addEntryForm = document.getElementById('addEntryForm');
const statusToggleGroup = document.getElementById('statusToggleGroup');
const entriesList = document.getElementById('entriesList');
const emptyState = document.getElementById('emptyState');
const entriesCountText = document.getElementById('entriesCountText');
const progressSummary = document.getElementById('progressSummary');
const progressPercent = document.getElementById('progressPercent');
const progressBarFill = document.getElementById('progressBarFill');
const dateLabel = document.getElementById('dateLabel');
const dateInputHidden = document.getElementById('dateInputHidden');
const btnPrevDay = document.getElementById('btnPrevDay');
const btnNextDay = document.getElementById('btnNextDay');
const btnDateDisplay = document.getElementById('btnDateDisplay');
const btnTodayShortcut = document.getElementById('btnTodayShortcut');
const btnFillPlanner = document.getElementById('btnFillPlanner');
const btnCopyDay = document.getElementById('btnCopyDay');
const btnOpenDashboard = document.getElementById('btnOpenDashboard');
const btnOpenOptions = document.getElementById('btnOpenOptions');
const btnManageConfig = document.getElementById('btnManageConfig');
const toastNotification = document.getElementById('toastNotification');
const toastMessage = document.getElementById('toastMessage');

// === INITIALIZATION ===

async function init() {
  await populateDropdowns();
  updateDateView();
  await refreshEntries();
  bindEvents();
}

// Populate Project & Platform dropdowns from config
async function populateDropdowns() {
  const [projects, platforms, settings] = await Promise.all([
    getProjects(),
    getPlatforms(),
    getSettings(),
  ]);

  selectPlatform.innerHTML = platforms
    .map((p) => `<option value="${escapeHTML(p)}">${escapeHTML(p)}</option>`)
    .join('');

  selectProject.innerHTML = projects
    .map((pr) => `<option value="${escapeHTML(pr)}">${escapeHTML(pr)}</option>`)
    .join('');

  if (settings.defaultPlatform && platforms.includes(settings.defaultPlatform)) {
    selectPlatform.value = settings.defaultPlatform;
  }
  if (settings.defaultProject && projects.includes(settings.defaultProject)) {
    selectProject.value = settings.defaultProject;
  }
}

// Format date for user display
function formatDateLabel(dateStr) {
  const today = getTodayDateString();
  const dateObj = new Date(dateStr + 'T00:00:00');
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = monthNames[dateObj.getMonth()];
  const day = dateObj.getDate();

  if (dateStr === today) {
    return `Today · ${month} ${day}`;
  }

  // Calculate yesterday/tomorrow
  const todayObj = new Date(today + 'T00:00:00');
  const diffDays = Math.round((dateObj - todayObj) / (1000 * 60 * 60 * 24));
  if (diffDays === -1) return `Yesterday · ${month} ${day}`;
  if (diffDays === 1) return `Tomorrow · ${month} ${day}`;

  return `${dateObj.toLocaleDateString('en-US', { weekday: 'short' })} · ${month} ${day}`;
}

function updateDateView() {
  dateLabel.textContent = formatDateLabel(currentDate);
  dateInputHidden.value = currentDate;
}

// Refresh entries for currently selected date
async function refreshEntries() {
  currentEntries = await getEntriesByDate(currentDate);
  renderEntries(currentEntries);
  updateProgress(currentEntries);
}

// Render list of entry cards
function renderEntries(entries) {
  if (!entries || entries.length === 0) {
    entriesList.innerHTML = '';
    emptyState.classList.remove('hidden');
    entriesCountText.textContent = '0 entries logged';
    return;
  }

  emptyState.classList.add('hidden');
  const completedCount = entries.filter((e) => e.status === 'completed').length;
  entriesCountText.textContent = `${entries.length} logged · ${completedCount} done`;

  entriesList.innerHTML = entries
    .map((item) => {
      const isCompleted = item.status === 'completed';
      const statusClass = `status-${item.status}`;
      const statusLabel =
        item.status === 'in_progress' ? 'In Progress' : item.status === 'completed' ? 'Done' : 'To Do';

      return `
      <div class="entry-card ${isCompleted ? 'completed' : ''}" data-id="${item.id}">
        <button class="entry-check-btn" title="${isCompleted ? 'Mark as incomplete' : 'Mark as done'}" aria-label="Toggle task completion">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </button>

        <div class="entry-content">
          <div class="entry-task">${escapeHTML(item.task)}</div>
          <div class="entry-meta">
            <span class="badge-tag tag-project">${escapeHTML(item.project || 'General')}</span>
            <span class="badge-tag tag-platform">${escapeHTML(item.platform || 'Task')}</span>
            <span class="tag-status-pill ${statusClass}">${statusLabel}</span>
          </div>
        </div>

        <div class="entry-actions">
          <button class="entry-action-btn copy-btn" title="Copy entry line" aria-label="Copy entry">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
          </button>
          <button class="entry-action-btn delete-btn" title="Delete entry" aria-label="Delete entry">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      </div>
    `;
    })
    .join('');
}

// Update top progress bar
function updateProgress(entries) {
  const total = entries.length;
  const completed = entries.filter((e) => e.status === 'completed').length;
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);

  progressBarFill.style.width = `${percent}%`;
  progressPercent.textContent = `${percent}%`;

  const datePrefix = currentDate === getTodayDateString() ? 'Today' : formatDateLabel(currentDate);
  progressSummary.textContent = `${datePrefix}: ${total} ${total === 1 ? 'task' : 'tasks'} (${completed} done)`;
}

// Toast notification display
function showToast(msg) {
  toastMessage.textContent = msg;
  toastNotification.classList.remove('hidden');

  if (toastTimeout) clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toastNotification.classList.add('hidden');
  }, 2200);
}

// Shift current date by delta days
function shiftDate(days) {
  const d = new Date(currentDate + 'T00:00:00');
  d.setDate(d.getDate() + days);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  currentDate = `${year}-${month}-${day}`;
  updateDateView();
  refreshEntries();
}

// === EVENT LISTENERS ===

function bindEvents() {
  // Date navigation
  btnPrevDay.addEventListener('click', () => shiftDate(-1));
  btnNextDay.addEventListener('click', () => shiftDate(1));

  btnTodayShortcut.addEventListener('click', () => {
    currentDate = getTodayDateString();
    updateDateView();
    refreshEntries();
  });

  btnDateDisplay.addEventListener('click', () => {
    if (typeof dateInputHidden.showPicker === 'function') {
      dateInputHidden.showPicker();
    } else {
      dateInputHidden.click();
    }
  });

  dateInputHidden.addEventListener('change', (e) => {
    if (e.target.value) {
      currentDate = e.target.value;
      updateDateView();
      refreshEntries();
    }
  });

  // Status Selector Pill Group
  statusToggleGroup.querySelectorAll('.status-pill').forEach((btn) => {
    btn.addEventListener('click', () => {
      statusToggleGroup.querySelectorAll('.status-pill').forEach((b) => {
        b.classList.remove('active');
        b.setAttribute('aria-checked', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-checked', 'true');
      activeStatus = btn.dataset.status;
    });
  });

  // Form Submit: Add New Entry
  addEntryForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const task = inputTask.value.trim();
    if (!task) {
      inputTask.focus();
      return;
    }

    const platform = selectPlatform.value;
    const project = selectProject.value;

    await saveEntry({
      date: currentDate,
      platform,
      project,
      task,
      status: activeStatus,
    });

    inputTask.value = '';
    await refreshEntries();
    showToast('Task logged!');
    inputTask.focus();
  });

  // Entry List Delegation (toggle completion, copy, delete)
  entriesList.addEventListener('click', async (e) => {
    const card = e.target.closest('.entry-card');
    if (!card) return;
    const id = card.dataset.id;
    const entry = currentEntries.find((item) => item.id === id);
    if (!entry) return;

    // Check button click
    const checkBtn = e.target.closest('.entry-check-btn');
    if (checkBtn) {
      await toggleEntryStatus(id);
      await refreshEntries();
      return;
    }

    // Copy single entry button
    const copyBtn = e.target.closest('.copy-btn');
    if (copyBtn) {
      const line = formatSingleEntry(entry);
      await copyToClipboard(line);
      showToast('Copied task update!');
      return;
    }

    // Delete button
    const deleteBtn = e.target.closest('.delete-btn');
    if (deleteBtn) {
      card.style.opacity = '0.4';
      await deleteEntry(id);
      await refreshEntries();
      showToast('Task removed');
      return;
    }
  });

  // Auto-Fill into open Microsoft Planner task checklist
  btnFillPlanner.addEventListener('click', async () => {
    if (!currentEntries || currentEntries.length === 0) {
      showToast('No entries logged for this date');
      return;
    }

    if (typeof chrome === 'undefined' || !chrome.tabs || !chrome.scripting) {
      // In standalone browser test preview, copy checklist lines to clipboard
      const lines = currentEntries.map((e) => `- ${e.project} - ${e.platform} - ${e.task}`).join('\n');
      await copyToClipboard(lines);
      showToast('Copied checklist lines to clipboard!');
      return;
    }

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab || !tab.id) {
        showToast('No active tab found');
        return;
      }

      const url = (tab.url || '').toLowerCase();
      const isMicrosoftTab =
        url.includes('microsoft.com') ||
        url.includes('office.com') ||
        url.includes('live.com') ||
        url.includes('cloud.microsoft');

      if (!isMicrosoftTab) {
        showToast('Please open your Microsoft Planner task tab first');
        return;
      }

      showToast('Injecting into Planner checklist...');

      let results = null;
      try {
        // Execute in all frames since Teams embeds Planner in an iframe
        results = await chrome.scripting.executeScript({
          target: { tabId: tab.id, allFrames: true },
          func: injectPlannerChecklistInPage,
          args: [currentEntries],
        });
      } catch (frameErr) {
        console.warn('allFrames injection failed, attempting main frame:', frameErr);
        try {
          results = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: injectPlannerChecklistInPage,
            args: [currentEntries],
          });
        } catch (tabErr) {
          console.error('Script injection failed completely:', tabErr);
          const lines = currentEntries.map((e) => `- ${e.project} - ${e.platform} - ${e.task}`).join('\n');
          await copyToClipboard(lines);
          showToast('Please refresh your Teams tab (F5) once, then click Fill Planner!');
          return;
        }
      }

      console.log('[Daily Work Log] Frame injection results:', results);

      // Find frame that successfully injected items
      const successResult = results?.find((r) => r.result && r.result.success);
      if (successResult) {
        showToast(successResult.result.message);
        return;
      }

      // Check if any frame found the checklist but had an error
      const partialResult = results?.find((r) => r.result && !r.result.notFound && r.result.message);
      if (partialResult) {
        showToast(partialResult.result.message);
        return;
      }

      // Fallback: copy lines to clipboard so user can easily paste if needed
      const lines = currentEntries.map((e) => `- ${e.project} - ${e.platform} - ${e.task}`).join('\n');
      await copyToClipboard(lines);
      showToast('Could not find checklist. Click "Add steps" in Planner, then click Fill Planner!');
    } catch (err) {
      console.error('Error in Fill Planner handler:', err);
      showToast('Please refresh your Teams tab (F5) and try again');
    }
  });

  // Copy Day Summary Button
  btnCopyDay.addEventListener('click', async () => {
    const text = formatDayCopy(currentDate, currentEntries);
    const success = await copyToClipboard(text);
    if (success) {
      showToast(`Copied ${currentEntries.length} ${currentEntries.length === 1 ? 'update' : 'updates'} for Teams!`);
    } else {
      showToast('Unable to copy text');
    }
  });

  // Open Dashboard Page (Work Entries)
  const openDashboard = () => {
    if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.create) {
      chrome.tabs.create({ url: chrome.runtime.getURL('entries/entries.html') });
    } else {
      window.open('../entries/entries.html', '_blank');
    }
  };

  if (btnOpenDashboard) btnOpenDashboard.addEventListener('click', openDashboard);

  // Open Options Page
  const openOptions = () => {
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.openOptionsPage) {
      chrome.runtime.openOptionsPage();
    } else {
      window.open('../options/options.html', '_blank');
    }
  };

  btnOpenOptions.addEventListener('click', openOptions);
  btnManageConfig.addEventListener('click', openOptions);
}

// Escape HTML utility
function escapeHTML(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// In-Page Content Script executed directly in all frames of Microsoft Planner / Teams tab
async function injectPlannerChecklistInPage(items) {
  if (!items || items.length === 0) {
    return { notFound: true, message: 'No entries to add' };
  }

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  // 1. Frame check: Does this frame contain Planner Checklist elements?
  function checkIsPlannerFrame() {
    const walker = document.createTreeWalker(
      document.body || document.documentElement,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );
    let node;
    while ((node = walker.nextNode())) {
      const val = (node.nodeValue || '').trim();
      if (
        val.startsWith('Checklist') ||
        val === 'Add an item' ||
        val.toLowerCase() === 'add an item' ||
        val.includes('Add an item') ||
        val.includes('Add steps') ||
        val.includes('Add a step')
      ) {
        return true;
      }
    }
    return false;
  }

  if (!checkIsPlannerFrame()) {
    return { notFound: true };
  }

  // 2. Strict filter against Date, Notes, Title, Search, and non-checklist fields
  function isForbiddenField(el) {
    if (!el) return true;
    if (el.type === 'checkbox' || el.type === 'radio' || el.type === 'button' || el.type === 'submit') {
      return true;
    }
    const ph = (el.placeholder || '').toLowerCase();
    const aria = (el.getAttribute('aria-label') || '').toLowerCase();
    const name = (el.name || '').toLowerCase();
    const id = (el.id || '').toLowerCase();
    const className = (el.className || '').toString().toLowerCase();

    const forbidden = [
      'date',
      'picker',
      'calendar',
      'notes',
      'description',
      'search',
      'title',
      'bucket',
      'assign',
      'priority',
      'repeat',
      'label',
    ];
    for (const f of forbidden) {
      if (ph.includes(f) || aria.includes(f) || name.includes(f) || id.includes(f) || className.includes(f)) {
        return true;
      }
    }

    if (
      el.closest(
        '[class*="notes"], [class*="Notes"], [aria-label*="Notes"], [class*="date"], [class*="Date"], [class*="picker"], [class*="Calendar"], [class*="calendar"]'
      )
    ) {
      return true;
    }

    if (el.offsetParent === null && window.getComputedStyle(el).display === 'none') {
      return true;
    }

    return false;
  }

  // 3. Find any EMPTY checklist input (active or in DOM)
  function findEmptyChecklistInput() {
    // Priority A: Is activeElement an empty checklist input?
    const active = document.activeElement;
    if (
      active &&
      (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA') &&
      !isForbiddenField(active)
    ) {
      const val = active.value !== undefined ? active.value : active.textContent;
      if (!val || val.trim() === '') {
        return active;
      }
    }

    // Priority B: Query all text inputs that are not forbidden
    const allInputs = Array.from(
      document.querySelectorAll('input:not([type="checkbox"]), textarea, [contenteditable="true"]')
    ).filter((inp) => !isForbiddenField(inp));

    // Look for empty one
    const emptyInp = allInputs.find((inp) => {
      const val = inp.value !== undefined ? inp.value : inp.textContent;
      return !val || val.trim() === '';
    });
    if (emptyInp) return emptyInp;

    return null;
  }

  // 4. Click the "Add an item" or "Add steps" placeholder
  async function clickAddPlaceholder() {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
    let node;
    const candidates = [];
    while ((node = walker.nextNode())) {
      const txt = (node.nodeValue || '').trim();
      if (
        txt === 'Add an item' ||
        txt.toLowerCase() === 'add an item' ||
        txt.includes('Add an item') ||
        txt === 'Add a step' ||
        txt.includes('Add steps')
      ) {
        candidates.push(node.parentElement);
      }
    }

    if (candidates.length === 0) {
      const btn = document.querySelector(
        '[aria-label*="Add an item"], [title*="Add an item"], [aria-label*="Add a step"]'
      );
      if (btn) candidates.push(btn);
    }

    for (const el of candidates) {
      if (!el) continue;

      // Dispatch clicks up the 3 parent levels (span -> row div -> list item)
      let curr = el;
      for (let d = 0; d < 3 && curr && curr !== document.body; d++) {
        curr.focus?.();
        const opts = { bubbles: true, cancelable: true, view: window };
        curr.dispatchEvent(new PointerEvent('pointerdown', opts));
        curr.dispatchEvent(new MouseEvent('mousedown', opts));
        curr.dispatchEvent(new PointerEvent('pointerup', opts));
        curr.dispatchEvent(new MouseEvent('mouseup', opts));
        curr.dispatchEvent(new MouseEvent('click', opts));
        curr.click?.();

        const rk = Object.keys(curr).find((k) => k.startsWith('__reactProps') || k.startsWith('__reactEventHandlers'));
        if (rk && curr[rk] && typeof curr[rk].onClick === 'function') {
          try {
            curr[rk].onClick({
              bubbles: true,
              cancelable: true,
              preventDefault() {},
              stopPropagation() {},
              target: curr,
              currentTarget: curr,
            });
          } catch (e) {}
        }
        curr = curr.parentElement;
      }

      return true;
    }
    return false;
  }

  // 5. Wait for empty input to mount
  async function waitForEmptyInput(maxWaitMs = 1200) {
    const start = Date.now();
    while (Date.now() - start < maxWaitMs) {
      const inp = findEmptyChecklistInput();
      if (inp) return inp;
      await sleep(60);
    }
    return findEmptyChecklistInput();
  }

  // 6. Ensure empty input is ready
  async function ensureEmptyInputReady() {
    let inp = findEmptyChecklistInput();
    if (inp) {
      inp.focus?.();
      return inp;
    }

    await clickAddPlaceholder();
    inp = await waitForEmptyInput(1200);
    if (inp) {
      inp.focus?.();
      return inp;
    }

    // Active element fallback
    const active = document.activeElement;
    if (
      active &&
      (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA') &&
      !isForbiddenField(active)
    ) {
      return active;
    }

    return null;
  }

  let addedCount = 0;
  const orderedItems = [...items].reverse();

  for (let i = 0; i < orderedItems.length; i++) {
    const item = orderedItems[i];

    const inputEl = await ensureEmptyInputReady();
    if (!inputEl) {
      console.warn('[Daily Work Log] Could not get empty input for item:', item);
      break;
    }

    const text = `${item.project ? item.project + ' - ' : ''}${item.platform ? item.platform + ' - ' : ''}${item.task}`;

    inputEl.focus?.();
    await sleep(60);

    // Insert text
    let typed = false;
    try {
      inputEl.select?.();
      document.execCommand('selectAll', false, null);
      typed = document.execCommand('insertText', false, text);
    } catch {
      typed = false;
    }

    if (!typed || inputEl.value !== text) {
      if (inputEl.isContentEditable) {
        inputEl.textContent = text;
      } else {
        const proto = inputEl.tagName === 'TEXTAREA' ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
        const nativeSetter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
        if (nativeSetter) {
          nativeSetter.call(inputEl, text);
        } else {
          inputEl.value = text;
        }
      }
      inputEl.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
      inputEl.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
    }

    // Trigger React onChange / onInput
    const reactPropKey = Object.keys(inputEl).find((k) => k.startsWith('__reactProps') || k.startsWith('__reactEventHandlers'));
    if (reactPropKey && inputEl[reactPropKey]) {
      const p = inputEl[reactPropKey];
      if (typeof p.onChange === 'function') {
        try { p.onChange({ target: inputEl, currentTarget: inputEl, type: 'change' }); } catch (e) {}
      }
      if (typeof p.onInput === 'function') {
        try { p.onInput({ target: inputEl, currentTarget: inputEl, type: 'input' }); } catch (e) {}
      }
    }

    await sleep(100);

    // Prepare React synthetic Enter event
    const fakeEnter = {
      key: 'Enter',
      code: 'Enter',
      keyCode: 13,
      which: 13,
      charCode: 13,
      bubbles: true,
      cancelable: true,
      defaultPrevented: false,
      preventDefault() { this.defaultPrevented = true; },
      stopPropagation() {},
      persist() {},
      target: inputEl,
      currentTarget: inputEl,
    };

    let curr = inputEl;
    while (curr && curr !== document.body) {
      const rk = Object.keys(curr).find((k) => k.startsWith('__reactProps') || k.startsWith('__reactEventHandlers'));
      if (rk && curr[rk]) {
        if (typeof curr[rk].onKeyDown === 'function') {
          try { curr[rk].onKeyDown(fakeEnter); } catch (e) {}
        }
        if (typeof curr[rk].onKeyPress === 'function') {
          try { curr[rk].onKeyPress(fakeEnter); } catch (e) {}
        }
      }
      curr = curr.parentElement;
    }

    // Native KeyboardEvents for Enter
    const enterOpts = {
      key: 'Enter',
      code: 'Enter',
      keyCode: 13,
      which: 13,
      charCode: 13,
      bubbles: true,
      cancelable: true,
      composed: true,
    };
    inputEl.dispatchEvent(new KeyboardEvent('keydown', enterOpts));
    inputEl.dispatchEvent(new KeyboardEvent('keypress', enterOpts));
    inputEl.dispatchEvent(new KeyboardEvent('keyup', enterOpts));

    if (inputEl.form) {
      try { inputEl.form.requestSubmit(); } catch (e) {}
    }

    await sleep(200);

    const isLastItem = i === orderedItems.length - 1;

    // Check if Enter automatically focused the NEXT empty checklist input
    const nextActive = document.activeElement;
    const isNextEmptyActive =
      nextActive &&
      nextActive !== inputEl &&
      (nextActive.tagName === 'INPUT' || nextActive.tagName === 'TEXTAREA') &&
      !isForbiddenField(nextActive) &&
      (!nextActive.value || nextActive.value.trim() === '');

    if (isNextEmptyActive && !isLastItem) {
      // Planner automatically opened next line! Keep it focused for next item.
    } else {
      // Blur inputEl to commit to Planner
      inputEl.dispatchEvent(new Event('blur', { bubbles: true, composed: true }));
      inputEl.blur?.();
      if (reactPropKey && inputEl[reactPropKey] && typeof inputEl[reactPropKey].onBlur === 'function') {
        try { inputEl[reactPropKey].onBlur({ target: inputEl, currentTarget: inputEl, type: 'blur' }); } catch (e) {}
      }
    }

    addedCount++;
    await sleep(350); // Allow Planner to update list DOM
  }

  // After loop completes: If there's an empty trailing input open, blur it
  const finalActive = document.activeElement;
  if (
    finalActive &&
    !isForbiddenField(finalActive) &&
    (!finalActive.value || finalActive.value.trim() === '')
  ) {
    finalActive.dispatchEvent(new Event('blur', { bubbles: true, composed: true }));
    finalActive.blur?.();
  }

  if (addedCount === 0) {
    return {
      success: false,
      notFound: false,
      message: 'Could not enter checklist items. Please click "Add an item" in Planner first.',
    };
  }

  return {
    success: true,
    count: addedCount,
    message: `Added ${addedCount} of ${orderedItems.length} items to Planner checklist!`,
  };
}

// Start application
init();


