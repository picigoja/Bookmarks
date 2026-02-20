/**
 * bookmarks.js
 * Handles group navigation, search filtering, theming, and rendering of link cards.
 * Expects a global 'links' array from bookmarks-data.js.
 */

const ACCENT_OPTIONS = ["red", "green", "blue", "yellow", "purple", "orange"];
const STORAGE_KEYS = {
  themeMode: "bookmarks-theme-mode",
  accentColor: "bookmarks-accent-color",
  colorMode: "bookmarks-color-mode",
  customColor: "bookmarks-custom-color"
};

const COLOR_MODE = {
  PRESET: "preset",
  CUSTOM: "custom"
};

const elements = {
  groupNav: document.getElementById("groupNav"),
  linkGrid: document.getElementById("linkGrid"),
  searchInput: document.getElementById("searchInput"),
  resultMeta: document.getElementById("resultMeta"),
  themeSwitch: document.getElementById("dayNightSwitch"),
  themePicker: document.getElementById("themePickerSet"),
  colorModeSwitch: document.getElementById("colorModeSwitch"),
  themeSliders: null
};


const templates = {
  cardTemplate: document.getElementById("cardTemplate"),
  navButtonTemplate: document.getElementById("groupOptionTemplate")
};

const state = {
  allLinks: [],
  activeGroup: null,
  searchQuery: "",
  themeMode: "day",
  accentColor: "red",
  colorMode: COLOR_MODE.PRESET,
  customColor: { r: 50, g: 50, b: 50 }
};

let navHoverItem = null;

function init() {
  if (!elements.groupNav || !elements.linkGrid || !templates.cardTemplate) {
    console.error("Bookmarks: Missing DOM elements.");
    return;
  }

  state.allLinks =
    typeof window.links !== "undefined" && Array.isArray(window.links)
      ? window.links.slice()
      : [];

  loadPreferences();
  applyTheme();
  applyAccent();
  syncControls();

  renderGroupNav();
  filterLinks();

  elements.searchInput?.addEventListener("input", onSearchInput);
  elements.searchInput?.addEventListener("keydown", onSearchKeydown);
  elements.themeSwitch?.addEventListener("click", toggleThemeMode);
  elements.themePicker?.addEventListener("change", onAccentChange);
  elements.groupNav?.addEventListener("click", onNavClick);
  elements.groupNav?.addEventListener("pointerover", onNavHoverIn);
  elements.groupNav?.addEventListener("pointerout", onNavHoverOut);
  elements.groupNav?.addEventListener("focusin", onNavFocusIn);
  elements.groupNav?.addEventListener("focusout", onNavFocusOut);

  // color mode toggle and sliders (if present)
  elements.colorModeSwitch = document.getElementById("colorModeSwitch");
  if (elements.colorModeSwitch) {
    elements.colorModeSwitch.addEventListener("click", toggleColorMode);
  }

  elements.themeSliders = [
    document.getElementById("colorSliderRed"),
    document.getElementById("colorSliderGreen"),
    document.getElementById("colorSliderBlue")
  ].filter(Boolean);

  elements.themeSliders.forEach((s) => s.addEventListener("input", onCustomSliderInput));

  applyColorMode();

  initThemeGlider();
  initNavGlider();
}

function loadPreferences() {
  try {
    const storedTheme = localStorage.getItem(STORAGE_KEYS.themeMode);
    const storedAccent = localStorage.getItem(STORAGE_KEYS.accentColor);
    const storedColorMode = localStorage.getItem(STORAGE_KEYS.colorMode);
    const storedCustom = localStorage.getItem(STORAGE_KEYS.customColor);

    if (storedTheme === "dark" || storedTheme === "day") {
      state.themeMode = storedTheme;
    }

    if (ACCENT_OPTIONS.includes(storedAccent)) {
      state.accentColor = storedAccent;
    }

    if (storedColorMode === COLOR_MODE.CUSTOM || storedColorMode === COLOR_MODE.PRESET) {
      state.colorMode = storedColorMode;
    }

    if (storedCustom) {
      const parts = storedCustom.split(",").map((n) => parseInt(n, 10));
      if (parts.length === 3 && parts.every((n) => Number.isFinite(n))) {
        state.customColor = { r: parts[0], g: parts[1], b: parts[2] };
      }
    }
  } catch (error) {
    console.warn("Bookmarks: Unable to load preferences.", error);
  }
}

function syncControls() {
  if (elements.themeSwitch) {
    elements.themeSwitch.setAttribute(
      "aria-pressed",
      state.themeMode === "dark" ? "true" : "false"
    );
  }

  if (elements.themePicker) {
    const selectedInput = elements.themePicker.querySelector(
      `.tp-input[value="${state.accentColor}"]`
    );
    if (selectedInput) {
      selectedInput.checked = true;
    }

    // reflect color mode UI state
    elements.themePicker.classList.toggle(
      "theme-picker-custom",
      state.colorMode === COLOR_MODE.CUSTOM
    );
    const customBlock = document.getElementById("colorMixerContainer");
    if (customBlock) {
      customBlock.setAttribute(
        "aria-hidden",
        state.colorMode === COLOR_MODE.PRESET ? "true" : "false"
      );
    }
  }

  if (elements.colorModeSwitch) {
    elements.colorModeSwitch.setAttribute(
      "aria-pressed",
      state.colorMode === COLOR_MODE.CUSTOM ? "true" : "false"
    );
  }

  // sync sliders
  if (!elements.themeSliders) {
    elements.themeSliders = [
      document.getElementById("colorSliderRed"),
      document.getElementById("colorSliderGreen"),
      document.getElementById("colorSliderBlue")
    ].filter(Boolean);
  }

  if (elements.themeSliders && elements.themeSliders.length === 3) {
    elements.themeSliders[0].value = state.customColor.r;
    elements.themeSliders[1].value = state.customColor.g;
    elements.themeSliders[2].value = state.customColor.b;
  }
}

function toggleThemeMode() {
  state.themeMode = state.themeMode === "dark" ? "day" : "dark";
  persistPreference(STORAGE_KEYS.themeMode, state.themeMode);
  applyTheme();
}

function applyTheme() {
  const root = document.documentElement;
  root.classList.toggle("theme-dark", state.themeMode === "dark");

  if (elements.themeSwitch) {
    elements.themeSwitch.setAttribute(
      "aria-pressed",
      state.themeMode === "dark" ? "true" : "false"
    );
  }
}

function onAccentChange(event) {
  const input = event.target.closest(".tp-input");
  if (!input || !input.value) return;

  state.accentColor = input.value;
  persistPreference(STORAGE_KEYS.accentColor, state.accentColor);
  applyAccent();
}

function applyAccent() {
  const root = document.documentElement;
  ACCENT_OPTIONS.forEach((accent) => {
    root.classList.remove(`accent-${accent}`);
  });
  root.classList.add(`accent-${state.accentColor}`);

  // If using preset mode, ensure the variable isn't overridden
  if (state.colorMode === COLOR_MODE.PRESET) {
    root.style.removeProperty("--theme-color");
  }
}

function persistPreference(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch (error) {
    console.warn("Bookmarks: Unable to save preferences.", error);
  }
}

function toggleColorMode() {
  state.colorMode =
    state.colorMode === COLOR_MODE.CUSTOM ? COLOR_MODE.PRESET : COLOR_MODE.CUSTOM;
  persistPreference(STORAGE_KEYS.colorMode, state.colorMode);
  applyColorMode();
}

function applyColorMode() {
  const root = document.documentElement;

  if (elements.themePicker) {
    elements.themePicker.classList.toggle(
      "theme-picker-custom",
      state.colorMode === COLOR_MODE.CUSTOM
    );
    const customBlock = document.getElementById("colorMixerContainer");
    if (customBlock) {
      customBlock.setAttribute(
        "aria-hidden",
        state.colorMode === COLOR_MODE.PRESET ? "true" : "false"
      );
    }
  }

  if (state.colorMode === COLOR_MODE.CUSTOM) {
    const { r, g, b } = state.customColor;
    root.style.setProperty("--theme-color", `rgb(${r}, ${g}, ${b})`);
  } else {
    root.style.removeProperty("--theme-color");
  }

  if (elements.colorModeSwitch) {
    elements.colorModeSwitch.setAttribute(
      "aria-pressed",
      state.colorMode === COLOR_MODE.CUSTOM ? "true" : "false"
    );
  }

  // Layout may change when swapping preset/custom controls; keep nav gliders aligned.
  requestAnimationFrame(() => {
    updateNavGlider();
    updateNavHoverGlider();
  });
}

function onCustomSliderInput() {
  const r = parseInt(document.getElementById("colorSliderRed")?.value || 0, 10);
  const g = parseInt(document.getElementById("colorSliderGreen")?.value || 0, 10);
  const b = parseInt(document.getElementById("colorSliderBlue")?.value || 0, 10);

  state.customColor = { r, g, b };
  persistPreference(STORAGE_KEYS.customColor, `${r},${g},${b}`);

  // auto-switch to custom when user manipulates sliders
  if (state.colorMode !== COLOR_MODE.CUSTOM) {
    state.colorMode = COLOR_MODE.CUSTOM;
    persistPreference(STORAGE_KEYS.colorMode, state.colorMode);
    if (elements.themePicker) {
      elements.themePicker.classList.add("theme-picker-custom");
    }
    if (elements.colorModeSwitch) {
      elements.colorModeSwitch.setAttribute("aria-pressed", "true");
    }
  }

  applyColorMode();
}

function renderGroupNav() {
  if (!elements.groupNav || !templates.navButtonTemplate) return;

  // The groupNav gliders now live *inside* the <nav>. Don't wipe them out.
  const activeGlider =
    elements.groupNav.querySelector("#groupNavGlider") ||
    document.getElementById("groupNavGlider");
  const hoverGlider =
    elements.groupNav.querySelector("#groupNavGliderHover") ||
    document.getElementById("groupNavGliderHover");

  // Clear only nav options, preserving gliders.
  elements.groupNav.replaceChildren(
    ...[activeGlider, hoverGlider].filter(Boolean)
  );

  navHoverItem = null;

  const groupCounts = {};
  state.allLinks.forEach((link) => {
    (link.groups || []).forEach((group) => {
      groupCounts[group] = (groupCounts[group] || 0) + 1;
    });
  });

  const total = state.allLinks.length;
  elements.groupNav.appendChild(createNavButton("All", total, null));

  Object.keys(groupCounts)
    .sort((a, b) => a.localeCompare(b))
    .forEach((group) => {
      elements.groupNav.appendChild(
        createNavButton(group, groupCounts[group], group)
      );
    });

  updateNavActiveState(true);

  // Ensure gliders align after DOM updates.
  requestAnimationFrame(() => {
    updateNavGlider();
    updateNavHoverGlider();
  });
}


function createNavButton(label, count, groupKey) {
  const fragment = templates.navButtonTemplate.content.cloneNode(true);
  const button = fragment.querySelector(".nav-option");
  if (!button) return fragment;

  const labelSpan = button.querySelector(".group-lbl");
  if (labelSpan) labelSpan.textContent = `${label} (${count})`;
  button.dataset.group = groupKey === null ? "" : String(groupKey);
  button.setAttribute("aria-pressed", "false");

  return fragment;
}

function onNavClick(event) {
  const button = event.target.closest(".nav-option");
  if (!button || !elements.groupNav?.contains(button)) return;

  const group = button.dataset.group || "";
  if (state.activeGroup === group || (state.activeGroup === null && group === "")) {
    setActiveGroup(null);
  } else {
    setActiveGroup(group || null);
  }
}

function onNavHoverIn(event) {
  const button = event.target.closest(".nav-option");
  if (!button || !elements.groupNav?.contains(button)) return;

  navHoverItem = button;
  requestAnimationFrame(updateNavHoverGlider);
}

function onNavHoverOut(event) {
  const button = event.target.closest(".nav-option");
  if (!button || !elements.groupNav?.contains(button)) return;

  if (event.relatedTarget && button.contains(event.relatedTarget)) return;

  navHoverItem = null;
  requestAnimationFrame(updateNavHoverGlider);
}

function onNavFocusIn(event) {
  const button = event.target.closest(".nav-option");
  if (!button || !elements.groupNav?.contains(button)) return;

  navHoverItem = button;
  requestAnimationFrame(updateNavHoverGlider);
}

function onNavFocusOut(event) {
  const button = event.target.closest(".nav-option");
  if (!button || !elements.groupNav?.contains(button)) return;

  if (event.relatedTarget && button.contains(event.relatedTarget)) return;

  navHoverItem = null;
  requestAnimationFrame(updateNavHoverGlider);
}

function updateNavActiveState(skipGlider = false) {
  const buttons = elements.groupNav?.querySelectorAll(".nav-option") || [];

  buttons.forEach((button) => {
    const group = button.dataset.group || null;
    const isActive =
      (state.activeGroup === null && (group === "" || group === null)) ||
      (state.activeGroup !== null && group === String(state.activeGroup));

    button.classList.toggle("active", isActive);
    button.setAttribute("aria-pressed", isActive ? "true" : "false");
  });

  if (!skipGlider) {
    requestAnimationFrame(() => {
      updateNavGlider();
      updateNavHoverGlider();
    });
  }
}

function setActiveGroup(group) {
  state.activeGroup = group === "" ? null : group;
  updateNavActiveState();
  filterLinks();
}

function onSearchInput(event) {
  const val = event.target.value || "";
  clearTimeout(onSearchInput.timer);

  onSearchInput.timer = setTimeout(() => {
    state.searchQuery = val;
    filterLinks();
  }, 150);
}

function onSearchKeydown(event) {
  if (event.key !== "Escape") return;

  clearTimeout(onSearchInput.timer);

  if (elements.searchInput) {
    elements.searchInput.value = "";
  }
  state.searchQuery = "";
  filterLinks();
}

function filterLinks() {
  const query = (state.searchQuery || "").trim().toLowerCase();

  // 1) Always scope results to the active group (unless "All" is active)
  let scoped = state.allLinks;
  if (state.activeGroup) {
    scoped = state.allLinks.filter((link) =>
      (link.groups || []).some((g) => String(g) === String(state.activeGroup))
    );
  }

  // 2) Search only within the scoped set
  let filtered = scoped;
  if (query) {
    filtered = scoped.filter((link) => {
      const inTitle = (link.title || "").toLowerCase().includes(query);
      const inUrl = (link.url || "").toLowerCase().includes(query);
      return inTitle || inUrl;
    });
  }

  renderLinks(filtered);
  updateResultMeta(filtered.length, scoped.length);
}

function updateResultMeta(visibleCount, totalCount) {
  const parts = [`Showing ${visibleCount} of ${totalCount} links`];
  if (state.activeGroup) parts.push(`Group: ${state.activeGroup}`);
  if (state.searchQuery) parts.push(`Search: "${state.searchQuery}"`);

  if (elements.resultMeta) {
    elements.resultMeta.textContent = parts.join(" — ");
  }
}

function normalizeBgText(raw) {
  if (typeof raw !== "string") return "";

  const cleaned = raw
    .trim()
    .replace(/\s+/g, " ")
    // keep it fairly "logo-like"; allow letters, numbers, spaces, &, +, -, and _
    .replace(/[^0-9A-Za-z &+\-_]/g, "")
    .trim();

  return cleaned;
}

const BG_TEXT_MAX_CHARS = 7;
// Must match the horizontal squeeze used in CSS for .card-bg-text (scaleX).
const BG_WATERMARK_SQUEEZE_X = 0.55;


function bgTextFromTitle(title) {
  // Keep spaces in the watermark text (don't split on spaces) and let SVG fitting handle it.
  return normalizeBgText(title);
}



function bgTextFromHostname(url) {
  if (typeof url !== "string" || !url.trim()) return "";

  try {
    const u = new URL(url);
    const host = (u.hostname || "").replace(/^www\./i, "");
    if (!host) return "";

    // Take the primary label (e.g. stackoverflow from stackoverflow.com)
    const primary = host.split(".").filter(Boolean)[0] || host;
    return normalizeBgText(primary);
  } catch {
    // If URL is invalid, do a best-effort fallback
    const stripped = url.replace(/^https?:\/\//i, "").replace(/^www\./i, "");
    const primary = stripped.split(/[/?#]/)[0].split(".")[0] || "";
    return normalizeBgText(primary);
  }
}

function getCardBgText(link) {
  // 1) Explicit override
  const explicit = normalizeBgText(link?.["bg-text"]);
  if (explicit) return explicit.toUpperCase().slice(0, BG_TEXT_MAX_CHARS);

  // 2) Title
  const fromTitle = bgTextFromTitle(link?.title);
  if (fromTitle) return fromTitle.toUpperCase().slice(0, BG_TEXT_MAX_CHARS);

  // 3) Hostname
  const fromHost = bgTextFromHostname(link?.url);
  if (fromHost) return fromHost.toUpperCase().slice(0, BG_TEXT_MAX_CHARS);

  return "";
}


function createCardBgSvg(text) {
  const SVG_NS = "http://www.w3.org/2000/svg";

  const svg = document.createElementNS(SVG_NS, "svg");
  svg.classList.add("card-bg-svg");

  // Uniform watermark coordinate system across cards.
  svg.setAttribute("viewBox", "0 0 200 100");
  svg.setAttribute("preserveAspectRatio", "none");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("focusable", "false");

  const t = document.createElementNS(SVG_NS, "text");
  t.classList.add("card-bg-text");

    // Bottom-left alignment.
  const padX = 12;
  const padY = 12;
  const y = 100 - padY;

  t.setAttribute("y", String(y));
  t.setAttribute("text-anchor", "start");
  t.setAttribute("dominant-baseline", "text-after-edge");

  // Divide available width into BG_TEXT_MAX_CHARS equal "character positions"
  // and place each character at its index slot.
  const safeText = String(text || "").slice(0, BG_TEXT_MAX_CHARS);

  const usableWidth = 200 - (padX * 2);
  const slot = usableWidth / BG_TEXT_MAX_CHARS;

  // Make the watermark as large as the available space allows.
  // Limit by available vertical space, and limit by per-character slot width.
  const usableHeight = 200 - (padY * 2);
  const maxByWidth = (slot / BG_WATERMARK_SQUEEZE_X) * 0.98;
  const fontSize = Math.floor(Math.min(usableHeight, maxByWidth));
  t.setAttribute("font-size", String(fontSize));


  for (let i = 0; i < safeText.length; i += 1) {
    const span = document.createElementNS(SVG_NS, "tspan");
    span.setAttribute("x", String(padX + (i * slot)));
    span.textContent = safeText[i];
    t.appendChild(span);
  }

  svg.appendChild(t);
  return svg;
}


function renderLinks(list) {
  if (!elements.linkGrid || !templates.cardTemplate) return;

  elements.linkGrid.innerHTML = "";

  if (!list || list.length === 0) {
    const empty = document.createElement("div");
    empty.className = "card-grid-empty";
    empty.textContent = "No links found matching your criteria.";
    elements.linkGrid.appendChild(empty);
    return;
  }

  const fragment = document.createDocumentFragment();

  list.forEach((link) => {
    const clone = templates.cardTemplate.content.cloneNode(true);
    const card = clone.querySelector(".card");

    const titleEl = clone.querySelector(".card-title");
    const linkAnchor = document.createElement("a");
    linkAnchor.href = link.url || "#";
    linkAnchor.textContent = link.title || link.url || "Untitled";
    linkAnchor.className = "card-link";
    linkAnchor.target = "_blank";
    linkAnchor.rel = "noopener noreferrer";

    if (titleEl) {
      titleEl.innerHTML = "";
      titleEl.appendChild(linkAnchor);
    }

    const bodyEl = clone.querySelector(".card-body");
    if (bodyEl) {
      bodyEl.textContent = link.url || "";
    }

    if (card) {
      const bgText = getCardBgText(link);
      if (bgText) {
        card.dataset.bgText = bgText;
        card.prepend(createCardBgSvg(bgText));
      }
    }

    fragment.appendChild(clone);
  });

  elements.linkGrid.appendChild(fragment);
}


function updateNavGlider() {
  if (!elements.groupNav) return;

  const glider = document.getElementById("groupNavGlider");
  if (!glider) return;

  const activeButton = elements.groupNav.querySelector(".nav-option.active");
  if (!activeButton) {
    glider.style.opacity = "0";
    glider.style.setProperty("--nav-glider-x", "0px");
    glider.style.setProperty("--nav-glider-y", "0px");
    glider.style.setProperty("--nav-glider-width", "0px");
    glider.style.setProperty("--nav-glider-height", "0px");
    return;
  }

  // Gliders now live inside #groupNav, so we can measure relative to it.
  const x = activeButton.offsetLeft;
  const y = activeButton.offsetTop;
  const w = activeButton.offsetWidth;
  const h = activeButton.offsetHeight;

  glider.style.opacity = "1";
  glider.style.setProperty("--nav-glider-x", `${x}px`);
  glider.style.setProperty("--nav-glider-y", `${y}px`);
  glider.style.setProperty("--nav-glider-width", `${w}px`);
  glider.style.setProperty("--nav-glider-height", `${h}px`);
}

function updateNavHoverGlider() {
  if (!elements.groupNav) return;

  const glider = document.getElementById("groupNavGliderHover");
  if (!glider) return;

  if (!navHoverItem || !navHoverItem.isConnected) {
    glider.style.opacity = "0";
    return;
  }

  const activeButton = elements.groupNav.querySelector(".nav-option.active");
  if (activeButton && navHoverItem === activeButton) {
    glider.style.opacity = "0";
    return;
  }

  const x = navHoverItem.offsetLeft;
  const y = navHoverItem.offsetTop;
  const w = navHoverItem.offsetWidth;
  const h = navHoverItem.offsetHeight;

  glider.style.opacity = "1";
  glider.style.setProperty("--nav-glider-x", `${x}px`);
  glider.style.setProperty("--nav-glider-y", `${y}px`);
  glider.style.setProperty("--nav-glider-width", `${w}px`);
  glider.style.setProperty("--nav-glider-height", `${h}px`);
}


function initNavGlider() {
  if (!elements.groupNav) return;

  window.addEventListener("resize", () => {
    requestAnimationFrame(() => {
      updateNavGlider();
      updateNavHoverGlider();
    });
  });

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      updateNavGlider();
      updateNavHoverGlider();
    });
  });
}

function initThemeGlider() {
  if (!elements.themePicker) return;

  const activeGlider = document.getElementById("themePickerGlider");
  const hoverGlider = document.getElementById("themePickerGliderHover");
  if (!activeGlider || !hoverGlider) return;

  const inputs = Array.from(elements.themePicker.querySelectorAll(".tp-input"));
  const labels = Array.from(
    elements.themePicker.querySelectorAll(".tp-input-lbl")
  );

  let hoverLabel = null;

  function getCheckedInput() {
    return elements.themePicker.querySelector(".tp-input:checked");
  }

  function updateActiveGlider() {
    const checkedInput = getCheckedInput();
    if (!checkedInput) return;

    const label = elements.themePicker.querySelector(
      `label[for="${checkedInput.id}"]`
    );
    if (!label) return;

    const x = label.offsetLeft;
    const y = label.offsetTop;
    const w = label.offsetWidth;
    const h = label.offsetHeight;

    activeGlider.style.setProperty("--glider-x", `${x}px`);
    activeGlider.style.setProperty("--glider-y", `${y}px`);
    activeGlider.style.setProperty("--glider-width", `${w}px`);
    activeGlider.style.setProperty("--glider-height", `${h}px`);
  }

  function updateHoverGlider() {
    if (!hoverLabel || !hoverLabel.isConnected) {
      hoverGlider.style.opacity = "0";
      return;
    }

    const checkedInput = getCheckedInput();
    if (checkedInput && hoverLabel.htmlFor === checkedInput.id) {
      hoverGlider.style.opacity = "0";
      return;
    }

    const x = hoverLabel.offsetLeft;
    const y = hoverLabel.offsetTop;
    const w = hoverLabel.offsetWidth;
    const h = hoverLabel.offsetHeight;

    hoverGlider.style.opacity = "1";
    hoverGlider.style.setProperty("--glider-x", `${x}px`);
    hoverGlider.style.setProperty("--glider-y", `${y}px`);
    hoverGlider.style.setProperty("--glider-width", `${w}px`);
    hoverGlider.style.setProperty("--glider-height", `${h}px`);
  }

  labels.forEach((label) => {
    label.addEventListener("mouseenter", () => {
      hoverLabel = label;
      requestAnimationFrame(updateHoverGlider);
    });

    label.addEventListener("mouseleave", () => {
      hoverLabel = null;
      requestAnimationFrame(updateHoverGlider);
    });
  });

  inputs.forEach((input) => {
    input.addEventListener("focus", () => {
      const label = elements.themePicker.querySelector(`label[for="${input.id}"]`);
      hoverLabel = label;
      requestAnimationFrame(updateHoverGlider);
    });

    input.addEventListener("blur", () => {
      hoverLabel = null;
      requestAnimationFrame(updateHoverGlider);
    });

    input.addEventListener("change", () => {
      updateActiveGlider();
      updateHoverGlider();
    });
  });

  window.addEventListener("resize", () => {
    requestAnimationFrame(() => {
      updateActiveGlider();
      updateHoverGlider();
    });
  });

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      updateActiveGlider();
      updateHoverGlider();
    });
  });
}

if (document.readyState === "complete") {
  init();
} else {
  window.addEventListener("load", init);
}
