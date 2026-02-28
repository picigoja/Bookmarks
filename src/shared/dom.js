export const $id = (id) => document.getElementById(id);

export function qs(root, selector) {
  const context = root instanceof Element || root instanceof Document ? root : document;
  return context.querySelector(selector);
}

export function qsa(root, selector) {
  const context = root instanceof Element || root instanceof Document ? root : document;
  return Array.from(context.querySelectorAll(selector));
}

export function on(el, eventName, handler, options) {
  if (!el) return;
  el.addEventListener(eventName, handler, options);
}
