import { on } from "../dom.js";

export function createGliderTracker({
  root,
  activeSelector,
  hoverSelector,
  activeGlider,
  hoverGlider,
  cssVars,
}) {
  let hoverEl = null;

  function move(glider, target) {
    if (!glider) return;
    if (!target || !target.isConnected) {
      glider.style.opacity = "0";
      return;
    }
    glider.style.opacity = "1";
    glider.style.setProperty(cssVars.x, `${target.offsetLeft}px`);
    glider.style.setProperty(cssVars.y, `${target.offsetTop}px`);
    glider.style.setProperty(cssVars.w, `${target.offsetWidth}px`);
    glider.style.setProperty(cssVars.h, `${target.offsetHeight}px`);
  }

  function update() {
    const activeEl = root.querySelector(activeSelector);
    move(activeGlider, activeEl);
    if (hoverSelector) {
      const matchedHover = hoverEl?.closest?.(hoverSelector);
      if (matchedHover && matchedHover === activeEl) {
        hoverGlider.style.opacity = "0";
      } else {
        move(hoverGlider, matchedHover);
      }
    }
  }

  if (hoverSelector && hoverGlider) {
    on(root, "pointerover", (event) => {
      hoverEl = event.target.closest(hoverSelector);
      requestAnimationFrame(update);
    });
    on(root, "pointerout", () => {
      hoverEl = null;
      requestAnimationFrame(update);
    });
    on(root, "focusin", (event) => {
      hoverEl = event.target.closest(hoverSelector);
      requestAnimationFrame(update);
    });
    on(root, "focusout", () => {
      hoverEl = null;
      requestAnimationFrame(update);
    });
  }

  on(window, "resize", () => requestAnimationFrame(update));
  requestAnimationFrame(() => requestAnimationFrame(update));

  return { update };
}
