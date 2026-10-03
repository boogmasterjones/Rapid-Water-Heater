/* Progressive contact forms.
   Opt a form in with data-progressive-fields (optionally "=N" for how many groups show at first).
   Fields are grouped either by section labels (direct-child .field-label spans, as in the quote
   forms) or by field wrappers (.form-group, .field, label). Only the first group(s) show at load;
   the next group appears as soon as the visible ones are filled in. Hidden required fields are
   relaxed until they are shown, and an early submit reveals everything that is left before the
   browser validates, so nothing can be silently blocked by an invisible field. */
(function () {
  'use strict';
  var FIELD = 'input:not([type=hidden]):not([type=submit]):not([type=button]), select, textarea';
  var SKIP = 'button, [type=submit], input[type=hidden], .form-progress, .form-note, .form-privacy, .eyebrow, h1, h2, h3, h4';

  function isHidden(el, form) {
    for (var n = el; n && n !== form; n = n.parentElement) {
      if (n.hidden || n.getAttribute('aria-hidden') === 'true') return true;
      var cs = getComputedStyle(n);
      if (cs.display === 'none' || cs.visibility === 'hidden') return true;
      var box = n.getBoundingClientRect();
      if (box.width <= 1 && box.height <= 1) return true; // visually-hidden honeypot wrappers
    }
    return false;
  }
  function fieldsIn(nodes) {
    var out = [];
    nodes.forEach(function (n) {
      if (n.matches(FIELD)) out.push(n);
      out.push.apply(out, Array.prototype.slice.call(n.querySelectorAll(FIELD)));
    });
    return out;
  }
  function filled(nodes) {
    return fieldsIn(nodes).some(function (f) {
      return f.type === 'checkbox' || f.type === 'radio' ? f.checked : f.value.trim() !== '';
    });
  }
  function hasRequired(nodes) {
    return fieldsIn(nodes).some(function (f) { return f.required || f.hasAttribute('data-pf-required'); });
  }
  function groupsBySection(form) {
    var groups = [], current = null;
    Array.prototype.forEach.call(form.children, function (el) {
      if (el.matches(SKIP) || isHidden(el, form)) return;
      if (el.classList.contains('field-label')) { current = [el]; groups.push(current); }
      else if (current) current.push(el);
    });
    return groups;
  }
  function groupsByField(form) {
    var groups = [], seen = [];
    Array.prototype.forEach.call(form.querySelectorAll(FIELD), function (f) {
      if (isHidden(f, form)) return;
      var wrap = f.closest('.form-group, .field, .qf-group, label');
      if (!wrap || wrap === form || !form.contains(wrap)) wrap = f;
      if (seen.indexOf(wrap) < 0) { seen.push(wrap); groups.push([wrap]); }
    });
    return groups;
  }

  function setup(form) {
    var sectioned = form.querySelector(':scope > .field-label') !== null;
    var groups = sectioned ? groupsBySection(form) : groupsByField(form);
    var wanted = parseInt(form.getAttribute('data-progressive-fields'), 10);
    var show = wanted > 0 ? wanted : (sectioned ? 1 : 2);
    if (groups.length <= show) return;
    var pending = groups.slice(show);

    pending.forEach(function (g) {
      g.forEach(function (el) { el.setAttribute('data-pf-hidden', ''); });
      fieldsIn(g).forEach(function (f) {
        if (f.required) { f.required = false; f.setAttribute('data-pf-required', ''); }
      });
    });
    function reveal(g) {
      g.forEach(function (el) { el.removeAttribute('data-pf-hidden'); el.setAttribute('data-pf-revealed', ''); });
      fieldsIn(g).forEach(function (f) {
        if (f.hasAttribute('data-pf-required')) { f.required = true; f.removeAttribute('data-pf-required'); }
      });
    }
    function next() { var g = pending.shift(); if (g) reveal(g); }
    function check() {
      if (!pending.length) return;
      var shown = groups.slice(0, groups.length - pending.length);
      var last = shown[shown.length - 1];
      var requiredDone = shown.every(function (g) { return !hasRequired(g) || filled(g); });
      if (filled(last) || requiredDone) next();
    }
    form.addEventListener('input', check);
    form.addEventListener('change', check);
    form.addEventListener('submit', function (e) {
      if (!pending.length) return;
      while (pending.length) next();
      if (!form.checkValidity()) { e.preventDefault(); e.stopImmediatePropagation(); form.reportValidity(); }
    }, true);
  }

  var style = document.createElement('style');
  style.textContent = '[data-pf-hidden]{display:none!important}[data-pf-revealed]{animation:pf-reveal .3s ease}@keyframes pf-reveal{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:none}}';
  document.head.appendChild(style);

  function init() { Array.prototype.forEach.call(document.querySelectorAll('form[data-progressive-fields]'), setup); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
