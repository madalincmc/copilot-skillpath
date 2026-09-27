/*
 * Template registry. Template content files call SkillPath.templates.register({...}).
 * Invalid templates are rejected at registration so authoring mistakes surface immediately.
 */
(function (SP) {
  'use strict';

  const byId = new Map();

  function register(template) {
    const errors = SP.engine.validateTemplate(template);
    if (errors.length) throw new SP.engine.TemplateError(errors.join('\n'));
    if (byId.has(template.id)) throw new SP.engine.TemplateError('Template "' + template.id + '" is already registered');
    byId.set(template.id, Object.freeze(Object.assign({}, template)));
    return template;
  }

  function get(id) {
    return byId.get(id) || null;
  }

  function list(filter) {
    const all = Array.from(byId.values());
    if (!filter) return all;
    return all.filter((t) => {
      if (filter.category && t.category !== filter.category) return false;
      if (filter.domain) {
        const domains = t.domains || ['*'];
        if (!domains.includes('*') && !domains.includes(filter.domain)) return false;
      }
      return true;
    });
  }

  SP.templates = { register, get, list };
})((globalThis.SkillPath = globalThis.SkillPath || {}));
