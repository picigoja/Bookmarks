/**
 * bookmarks.js
 * Handles category navigation, search filtering, and rendering of link cards.
 * Expects a global 'links' array from bookmarks-data.js.
 */

const ACCENT_OPTIONS = ["red", "green", "blue", "yellow", "purple", "orange"];
const STORAGE_KEYS = {
  themeMode: "bookmarks-theme-mode",
  accentColor: "bookmarks-accent-color"
};

const elements = {
  categoryNav: document.getElementById("categoryNav"),
  linkGrid: document.getElementById("linkGrid"),
  searchInput: document.getElementById("searchInput"),
  resultMeta: document.getElementById("resultMeta"),
  themeSwitch: document.querySelector(".theme-switch"),
  themePicker: document.querySelector(".theme-picker")
};

const templates = {
  cardTemplate: document.getElementById("card-template"),
  navButtonTemplate: document.getElementById("nav-button-template"),
  tagTemplate: document.getElementById("tag-template")
};

const state = {
  allLinks: [],
  activeTag: null,
  searchQuery: "",
  themeMode: "day",
  accentColor: "red"
};

let navHoverItem = null;

function init() {
  if (!elements.categoryNav || !elements.linkGrid || !templates.cardTemplate) {
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

  renderCategoryNav();
  filterLinks();

  elements.searchInput?.addEventListener("input", onSearchInput);
  elements.searchInput?.addEventListener("keydown", onSearchKeydown);
  elements.themeSwitch?.addEventListener("click", toggleThemeMode);
  elements.themePicker?.addEventListener("change", onAccentChange);
  elements.categoryNav?.addEventListener("click", onNavClick);
  elements.categoryNav?.addEventListener("pointerover", onNavHoverIn);
  elements.categoryNav?.addEventListener("pointerout", onNavHoverOut);
  elements.categoryNav?.addEventListener("focusin", onNavFocusIn);
  elements.categoryNav?.addEventListener("focusout", onNavFocusOut);
  elements.linkGrid?.addEventListener("click", onTagClick);

  initThemeGlider();
  initNavGlider();
}

function loadPreferences() {
  try {
    const storedTheme = localStorage.getItem(STORAGE_KEYS.themeMode);
    const storedAccent = localStorage.getItem(STORAGE_KEYS.accentColor);

    if (storedTheme === "dark" || storedTheme === "day") {
      state.themeMode = storedTheme;
    }

    if (ACCENT_OPTIONS.includes(storedAccent)) {
      state.accentColor = storedAccent;
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
      `.theme-picker__input[value="${state.accentColor}"]`
    );
    if (selectedInput) {
      selectedInput.checked = true;
    }
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
  const input = event.target.closest(".theme-picker__input");
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
}

function persistPreference(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch (error) {
    console.warn("Bookmarks: Unable to save preferences.", error);
  }
}

function renderCategoryNav() {
  if (!elements.categoryNav || !templates.navButtonTemplate) return;

  elements.categoryNav.innerHTML = "";
  navHoverItem = null;

  const navHoverGlider = document.createElement("div");
  navHoverGlider.className = "nav__glider-hover";
  elements.categoryNav.appendChild(navHoverGlider);

  const navGlider = document.createElement("div");
  navGlider.className = "nav__glider";
  elements.categoryNav.appendChild(navGlider);

  const tagCounts = {};
  state.allLinks.forEach((link) => {
    (link.tags || []).forEach((tag) => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });
  });

  const total = state.allLinks.length;
  elements.categoryNav.appendChild(createNavButton("All", total, null));

  Object.keys(tagCounts)
    .sort((a, b) => a.localeCompare(b))
    .forEach((tag) => {
      elements.categoryNav.appendChild(createNavButton(tag, tagCounts[tag], tag));
    });

  updateNavActiveState();
}

function createNavButton(label, count, tagKey) {
  const fragment = templates.navButtonTemplate.content.cloneNode(true);
  const button = fragment.querySelector(".nav__item");
  if (!button) return fragment;

  button.textContent = `${label} (${count})`;
  button.dataset.tag = tagKey === null ? "" : String(tagKey);
  button.setAttribute("aria-pressed", "false");

  return fragment;
}

function onNavClick(event) {
  const button = event.target.closest(".nav__item");
  if (!button || !elements.categoryNav?.contains(button)) return;

  const tag = button.dataset.tag || "";
  if (state.activeTag === tag || (state.activeTag === null && tag === "")) {
    setActiveTag(null);
  } else {
    setActiveTag(tag || null);
  }
}

function onNavHoverIn(event) {
  const button = event.target.closest(".nav__item");
  if (!button || !elements.categoryNav?.contains(button)) return;

  navHoverItem = button;
  requestAnimationFrame(updateNavHoverGlider);
}

function onNavHoverOut(event) {
  const button = event.target.closest(".nav__item");
  if (!button || !elements.categoryNav?.contains(button)) return;

  if (event.relatedTarget && button.contains(event.relatedTarget)) return;

  navHoverItem = null;
  requestAnimationFrame(updateNavHoverGlider);
}

function onNavFocusIn(event) {
  const button = event.target.closest(".nav__item");
  if (!button || !elements.categoryNav?.contains(button)) return;

  navHoverItem = button;
  requestAnimationFrame(updateNavHoverGlider);
}

function onNavFocusOut(event) {
  const button = event.target.closest(".nav__item");
  if (!button || !elements.categoryNav?.contains(button)) return;

  if (event.relatedTarget && button.contains(event.relatedTarget)) return;

  navHoverItem = null;
  requestAnimationFrame(updateNavHoverGlider);
}

function updateNavActiveState() {
  const buttons = elements.categoryNav?.querySelectorAll(".nav__item") || [];

  buttons.forEach((button) => {
    const tag = button.dataset.tag || null;
    const isActive =
      (state.activeTag === null && (tag === "" || tag === null)) ||
      (state.activeTag !== null && tag === String(state.activeTag));

    button.classList.toggle("nav__item--active", isActive);
    button.setAttribute("aria-pressed", isActive ? "true" : "false");
  });

  requestAnimationFrame(() => {
    updateNavGlider();
    updateNavHoverGlider();
  });
}

function setActiveTag(tag) {
  state.activeTag = tag === "" ? null : tag;
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

  if (elements.searchInput) {
    elements.searchInput.value = "";
  }
  state.searchQuery = "";
  filterLinks();
}

function filterLinks() {
  const query = (state.searchQuery || "").trim().toLowerCase();

  const filtered = state.allLinks.filter((link) => {
    if (state.activeTag) {
      const hasTag = (link.tags || []).some(
        (tag) => String(tag) === String(state.activeTag)
      );
      if (!hasTag) return false;
    }

    if (!query) return true;

    const inTitle = (link.title || "").toLowerCase().includes(query);
    const inUrl = (link.url || "").toLowerCase().includes(query);
    const inTags = (link.tags || []).some((tag) =>
      String(tag).toLowerCase().includes(query)
    );

    return inTitle || inUrl || inTags;
  });

  renderLinks(filtered);
  updateResultMeta(filtered.length, state.allLinks.length);
}

function updateResultMeta(visibleCount, totalCount) {
  const parts = [`Showing ${visibleCount} of ${totalCount} links`];
  if (state.activeTag) parts.push(`Filter: ${state.activeTag}`);
  if (state.searchQuery) parts.push(`Search: "${state.searchQuery}"`);

  if (elements.resultMeta) {
    elements.resultMeta.textContent = parts.join(" — ");
  }
}

function renderLinks(list) {
  if (!elements.linkGrid || !templates.cardTemplate) return;

  elements.linkGrid.innerHTML = "";

  if (!list || list.length === 0) {
    const empty = document.createElement("div");
    empty.className = "card-grid__empty";
    empty.textContent = "No links found matching your criteria.";
    elements.linkGrid.appendChild(empty);
    return;
  }

  const fragment = document.createDocumentFragment();

  list.forEach((link) => {
    const clone = templates.cardTemplate.content.cloneNode(true);

    const titleEl = clone.querySelector(".card__title");
    const linkAnchor = document.createElement("a");
    linkAnchor.href = link.url || "#";
    linkAnchor.textContent = link.title || link.url || "Untitled";
    linkAnchor.className = "card__link";
    linkAnchor.target = "_blank";
    linkAnchor.rel = "noopener noreferrer";

    if (titleEl) {
      titleEl.innerHTML = "";
      titleEl.appendChild(linkAnchor);
    }

    const bodyEl = clone.querySelector(".card__body");
    if (bodyEl) {
      bodyEl.textContent = link.url || "";
    }

    const tagsContainer = clone.querySelector(".card__tags");
    (link.tags || []).forEach((tagName) => {
      const tagClone = templates.tagTemplate.content.cloneNode(true);
      const tagButton = tagClone.querySelector(".tag");
      const tagLabel = tagClone.querySelector(".tag__label");

      if (tagButton) {
        tagButton.dataset.tag = tagName;
      }

      if (tagLabel) {
        tagLabel.textContent = tagName;
      }

      tagsContainer?.appendChild(tagClone);
    });

    fragment.appendChild(clone);
  });

  elements.linkGrid.appendChild(fragment);
}

function onTagClick(event) {
  const button = event.target.closest(".tag");
  if (!button || !elements.linkGrid?.contains(button)) return;

  const tagName = button.dataset.tag;
  if (!tagName) return;

  if (state.activeTag === tagName) {
    setActiveTag(null);
  } else {
    setActiveTag(tagName);
  }
}

function updateNavGlider() {
  if (!elements.categoryNav) return;

  const glider = elements.categoryNav.querySelector(".nav__glider");
  if (!glider) return;

  const activeButton = elements.categoryNav.querySelector(".nav__item--active");
  if (!activeButton) {
    glider.style.opacity = "0";
    glider.style.setProperty("--nav-glider-x", "0px");
    glider.style.setProperty("--nav-glider-y", "0px");
    glider.style.setProperty("--nav-glider-width", "0px");
    glider.style.setProperty("--nav-glider-height", "0px");
    return;
  }

  const navRect = elements.categoryNav.getBoundingClientRect();
  const buttonRect = activeButton.getBoundingClientRect();

  const x = buttonRect.left - navRect.left;
  const y = buttonRect.top - navRect.top;
  const w = buttonRect.width;
  const h = buttonRect.height;

  glider.style.opacity = "1";
  glider.style.setProperty("--nav-glider-x", `${x}px`);
  glider.style.setProperty("--nav-glider-y", `${y}px`);
  glider.style.setProperty("--nav-glider-width", `${w}px`);
  glider.style.setProperty("--nav-glider-height", `${h}px`);
}

function updateNavHoverGlider() {
  if (!elements.categoryNav) return;

  const glider = elements.categoryNav.querySelector(".nav__glider-hover");
  if (!glider) return;

  if (!navHoverItem || !navHoverItem.isConnected) {
    glider.style.opacity = "0";
    return;
  }

  const activeButton = elements.categoryNav.querySelector(".nav__item--active");
  if (activeButton && navHoverItem === activeButton) {
    glider.style.opacity = "0";
    return;
  }

  const navRect = elements.categoryNav.getBoundingClientRect();
  const labelRect = navHoverItem.getBoundingClientRect();

  const x = labelRect.left - navRect.left;
  const y = labelRect.top - navRect.top;
  const w = labelRect.width;
  const h = labelRect.height;

  glider.style.opacity = "1";
  glider.style.setProperty("--nav-glider-x", `${x}px`);
  glider.style.setProperty("--nav-glider-y", `${y}px`);
  glider.style.setProperty("--nav-glider-width", `${w}px`);
  glider.style.setProperty("--nav-glider-height", `${h}px`);
}

function initNavGlider() {
  if (!elements.categoryNav) return;

  window.addEventListener("resize", () => {
    requestAnimationFrame(() => {
      updateNavGlider();
      updateNavHoverGlider();
    });
  });

  requestAnimationFrame(() => {
    updateNavGlider();
    updateNavHoverGlider();
  });
}

function initThemeGlider() {
  if (!elements.themePicker) return;

  const activeGlider = elements.themePicker.querySelector(".theme-picker__glider");
  const hoverGlider = elements.themePicker.querySelector(".theme-picker__glider-hover");
  if (!activeGlider || !hoverGlider) return;

  const inputs = Array.from(
    elements.themePicker.querySelectorAll(".theme-picker__input")
  );
  const labels = Array.from(
    elements.themePicker.querySelectorAll(".theme-picker__label")
  );

  let hoverLabel = null;

  function getCheckedInput() {
    return elements.themePicker.querySelector(".theme-picker__input:checked");
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
    updateActiveGlider();
    updateHoverGlider();
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}

