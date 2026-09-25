/**
 * Daily Work Log - Content Script for Microsoft Teams / Planner
 * Injects a direct "⚡ Fill Tasks" button inside the Checklist header of Microsoft Planner tasks.
 */

(function () {
  if (window.__dwl_injected) return;
  window.__dwl_injected = true;

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  function getTodayDateString() {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Retrieve today's entries safely from chrome storage
  async function getTodayEntries() {
    return new Promise((resolve) => {
      try {
        if (typeof chrome === 'undefined' || !chrome.runtime || !chrome.runtime.id || !chrome.storage || !chrome.storage.local) {
          showPageToast('Extension updated. Please refresh Teams (F5)', 'warn');
          resolve([]);
          return;
        }

        chrome.storage.local.get(['wl_entries'], (result) => {
          if (chrome.runtime.lastError) {
            console.warn('[Daily Work Log] Storage error:', chrome.runtime.lastError);
            resolve([]);
            return;
          }
          const all = result && result.wl_entries ? result.wl_entries : [];
          const todayStr = getTodayDateString();
          const todayTasks = all.filter((e) => e.date === todayStr);
          resolve(todayTasks);
        });
      } catch (err) {
        console.warn('[Daily Work Log] Context invalidated or error:', err);
        showPageToast('Extension updated. Please refresh Teams tab (F5)', 'warn');
        resolve([]);
      }
    });
  }

  // Floating on-page toast notification
  let activeToastTimeout = null;
  function showPageToast(message, type = 'success') {
    let toast = document.getElementById('dwl-page-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'dwl-page-toast';
      toast.className = 'dwl-toast';
      document.body.appendChild(toast);
    }

    toast.className = `dwl-toast dwl-toast-${type}`;
    const iconChar = type === 'success' ? '✓' : type === 'warn' ? '⚠' : '⚡';
    toast.innerHTML = `<span class="dwl-toast-icon">${iconChar}</span><span>${message}</span>`;
    toast.classList.remove('dwl-hidden');

    if (activeToastTimeout) clearTimeout(activeToastTimeout);
    activeToastTimeout = setTimeout(() => {
      toast?.classList.add('dwl-hidden');
    }, 2800);
  }

  // Strictly filter out non-checklist fields (Start Date, Due Date, Notes, Title, Search)
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

    const badWords = [
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
    for (const w of badWords) {
      if (ph.includes(w) || aria.includes(w) || name.includes(w) || id.includes(w) || className.includes(w)) {
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

  // Find any empty checklist input
  function findEmptyChecklistInput() {
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

    const allInputs = Array.from(
      document.querySelectorAll('input:not([type="checkbox"]), textarea, [contenteditable="true"]')
    ).filter((inp) => !isForbiddenField(inp));

    const empty = allInputs.find((inp) => {
      const val = inp.value !== undefined ? inp.value : inp.textContent;
      return !val || val.trim() === '';
    });
    if (empty) return empty;

    return null;
  }

  // Click the "Add an item" or "Add steps" placeholder
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

        const rk = Object.keys(curr).find(
          (k) => k.startsWith('__reactProps') || k.startsWith('__reactEventHandlers')
        );
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

  async function waitForEmptyInput(maxWaitMs = 1200) {
    const start = Date.now();
    while (Date.now() - start < maxWaitMs) {
      const inp = findEmptyChecklistInput();
      if (inp) return inp;
      await sleep(60);
    }
    return findEmptyChecklistInput();
  }

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

  // Core function to inject items into Planner Checklist
  async function fillPlannerChecklist(items) {
    if (!items || items.length === 0) {
      showPageToast('No tasks logged for today in Daily Work Log', 'warn');
      return;
    }

    showPageToast(`Adding ${items.length} ${items.length === 1 ? 'task' : 'tasks'} to Checklist...`, 'info');

    let addedCount = 0;
    const ordered = [...items].reverse();

    for (let i = 0; i < ordered.length; i++) {
      const item = ordered[i];
      const inputEl = await ensureEmptyInputReady();
      if (!inputEl) {
        console.warn('[Daily Work Log] No empty input found for item:', item);
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

      // Trigger React props
      const reactPropKey = Object.keys(inputEl).find(
        (k) => k.startsWith('__reactProps') || k.startsWith('__reactEventHandlers')
      );
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

      // Synthetic React Enter
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
        const rk = Object.keys(curr).find(
          (k) => k.startsWith('__reactProps') || k.startsWith('__reactEventHandlers')
        );
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

      const isLastItem = i === ordered.length - 1;

      // Check if Enter automatically focused the next empty line
      const nextActive = document.activeElement;
      const isNextEmptyActive =
        nextActive &&
        nextActive !== inputEl &&
        (nextActive.tagName === 'INPUT' || nextActive.tagName === 'TEXTAREA') &&
        !isForbiddenField(nextActive) &&
        (!nextActive.value || nextActive.value.trim() === '');

      if (isNextEmptyActive && !isLastItem) {
        // Planner automatically opened next line - preserve focus!
      } else {
        // Blur to commit
        inputEl.dispatchEvent(new Event('blur', { bubbles: true, composed: true }));
        inputEl.blur?.();
        if (reactPropKey && inputEl[reactPropKey] && typeof inputEl[reactPropKey].onBlur === 'function') {
          try { inputEl[reactPropKey].onBlur({ target: inputEl, currentTarget: inputEl, type: 'blur' }); } catch (e) {}
        }
      }

      addedCount++;
      await sleep(350);
    }

    // Clean trailing blank line if present
    const finalActive = document.activeElement;
    if (
      finalActive &&
      !isForbiddenField(finalActive) &&
      (!finalActive.value || finalActive.value.trim() === '')
    ) {
      finalActive.dispatchEvent(new Event('blur', { bubbles: true, composed: true }));
      finalActive.blur?.();
    }

    if (addedCount > 0) {
      showPageToast(`✓ Added ${addedCount} of ${ordered.length} tasks to Checklist!`, 'success');
    } else {
      showPageToast('Could not fill checklist. Please click "Add an item" first in Planner.', 'warn');
    }
  }

  // Inject inline button next to Checklist heading when task modal opens
  function checkAndInjectInlineButton() {
    if (document.getElementById('dwl-inline-checklist-btn')) return;

    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
    let node;
    while ((node = walker.nextNode())) {
      const val = (node.nodeValue || '').trim();
      if (val.startsWith('Checklist')) {
        const headerEl = node.parentElement;
        if (headerEl && !headerEl.querySelector('#dwl-inline-checklist-btn')) {
          const btn = document.createElement('button');
          btn.id = 'dwl-inline-checklist-btn';
          btn.type = 'button';
          btn.className = 'dwl-inline-btn';
          btn.title = 'Auto-fill today\'s tasks from Daily Work Log';
          btn.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            <span>⚡ Fill Tasks</span>
          `;

          btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            e.preventDefault();
            const tasks = await getTodayEntries();
            await fillPlannerChecklist(tasks);
          });

          headerEl.appendChild(btn);
          break;
        }
      }
    }
  }

  // Watch for DOM changes (modal openings, navigation, checklist mounting)
  const observer = new MutationObserver(() => {
    checkAndInjectInlineButton();
  });

  observer.observe(document.body, { childList: true, subtree: true });

  // Initial check in case modal is already open
  checkAndInjectInlineButton();
})();
