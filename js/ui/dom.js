/*
 * Minimal DOM helper. Builds elements with text nodes only (no innerHTML), so user-entered
 * values can never be interpreted as markup.
 */
(function (SP) {
  'use strict';

  /**
   * h('a', { href: '#/path', class: 'link', onClick: fn }, 'text', childEl, [more])
   * - attributes starting with "on" become event listeners
   * - null/false children are skipped; arrays are flattened
   */
  function h(tag, attrs, ...children) {
    const el = document.createElement(tag);
    for (const [key, value] of Object.entries(attrs || {})) {
      if (value == null || value === false) continue;
      if (key.startsWith('on') && typeof value === 'function') {
        el.addEventListener(key.slice(2).toLowerCase(), value);
      } else if (key === 'class') {
        el.className = value;
      } else if (value === true) {
        el.setAttribute(key, '');
      } else {
        el.setAttribute(key, String(value));
      }
    }
    append(el, children);
    return el;
  }

  function append(parent, children) {
    for (const child of children) {
      if (child == null || child === false) continue;
      if (Array.isArray(child)) append(parent, child);
      else parent.appendChild(child instanceof Node ? child : document.createTextNode(String(child)));
    }
  }

  function clear(el) {
    while (el.firstChild) el.removeChild(el.firstChild);
  }

  SP.dom = { h, clear };
})((globalThis.SkillPath = globalThis.SkillPath || {}));
