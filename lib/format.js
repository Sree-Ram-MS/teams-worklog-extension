/**
 * Text formatting, clipboard, and export utilities for Daily Work Log
 */

/**
 * Format a list of entries for a given date into Microsoft Teams / Slack daily update markdown
 * Example output:
 * Daily Work Updates
 * Date: September 17, 2026
 *
 * - ColorLand - Jira - Fixed login bug
 * - Project Alpha - GitHub - Reviewed PR #42
 */
export function formatDayCopy(dateStr, entries) {
  const dateObj = new Date(dateStr + 'T00:00:00');
  const formattedDate = dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  let text = `Daily Work Updates\nDate: ${formattedDate}\n\n`;
  if (!entries || entries.length === 0) {
    text += `(No tasks logged for this day)`;
    return text;
  }

  entries.forEach((e) => {
    text += `- ${e.project || 'General'} - ${e.platform || 'Task'} - ${e.task}\n`;
  });

  return text.trim();
}

/**
 * Format a list of entries into Microsoft Teams weekly update markdown grouped by project
 * Example output:
 * Weekly Work Updates
 *
 * ColorLand
 * - Live Push and CSS error check
 *
 * Internal Task
 * - DAsh
 * - KPI
 */
export function formatWeeklyCopy(entries, options = {}) {
  const { useBrackets = false } = options;

  if (!entries || entries.length === 0) {
    return 'Weekly Work Updates\n\n(No tasks logged for this period)';
  }

  // Group tasks by project
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

/**
 * Format a single entry line
 */
export function formatSingleEntry(entry) {
  return `- ${entry.project || 'General'} - ${entry.platform || 'Task'} - ${entry.task}`;
}

/**
 * Copy text to clipboard reliably across extension popups and standard browser environments
 */
export async function copyToClipboard(text) {
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      console.warn('navigator.clipboard failed, attempting fallback:', err);
    }
  }

  // Fallback for popup/iframe/insecure context
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
    console.error('Clipboard copy failed completely:', err);
    return false;
  }
}

/**
 * Convert entries to CSV string
 */
export function convertEntriesToCSV(entries) {
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

/**
 * Trigger browser file download (CSV or JSON)
 */
export function downloadFile(content, fileName, mimeType) {
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
