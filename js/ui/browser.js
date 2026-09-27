/*
 * Browser utilities that must work when the page is opened from file://:
 * clipboard (with a fallback for when the Clipboard API is unavailable), file download, and file reading.
 */
(function (SP) {
  'use strict';

  function copyWithSelection(text) {
    const active = document.activeElement;
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.top = '-1000px';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    let ok = false;
    try {
      ok = document.execCommand('copy');
    } catch (e) {
      ok = false;
    }
    area.remove();
    if (active && typeof active.focus === 'function') active.focus();
    return ok;
  }

  /** Copies text to the clipboard. Resolves to true on success. */
  async function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch (e) {
        // Permission denied or unsupported: fall through to the selection fallback.
      }
    }
    return copyWithSelection(text);
  }

  function downloadFile(filename, content, type) {
    const url = URL.createObjectURL(new Blob([content], { type }));
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function readFileAsText(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsText(file);
    });
  }

  /** Local date as YYYY-MM-DD, for file names. */
  function today() {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }

  SP.browser = { copyText, downloadFile, readFileAsText, today };
})((globalThis.SkillPath = globalThis.SkillPath || {}));
