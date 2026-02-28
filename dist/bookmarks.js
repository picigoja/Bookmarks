(() => {
  // data/bookmarks-data.js
  var links = [
    {
      "title": "Github",
      "groups": ["Group_1", "Group_2"],
      "url": "https://github.com",
      "bg-text": "GITHUB"
    },
    {
      "title": "Stack Overflow",
      "groups": ["Group_2", "Group_3"],
      "url": "https://stackoverflow.com",
      "bg-text": ""
    },
    {
      "title": "Mozilla Dev",
      "groups": ["Group_3", "Group_1"],
      "url": "https://developer.mozilla.org",
      "bg-text": ""
    },
    {
      "title": "Y Combinator",
      "groups": ["Group_1", "Group_2"],
      "url": "https://news.ycombinator.com",
      "bg-text": ""
    },
    {
      "title": "Product Hunt",
      "groups": ["Group_2", "Group_3"],
      "url": "https://www.producthunt.com",
      "bg-text": ""
    },
    {
      "title": "Notion",
      "groups": ["Group_3", "Group_1"],
      "url": "https://notion.so",
      "bg-text": ""
    },
    {
      "title": "Google Calendar",
      "groups": ["Group_1", "Group_2"],
      "url": "https://calendar.google.com",
      "bg-text": ""
    },
    {
      "title": "Reddit",
      "groups": ["Group_2", "Group_3"],
      "url": "https://www.reddit.com",
      "bg-text": ""
    },
    {
      "title": "Twitter",
      "groups": ["Group_3", "Group_1"],
      "url": "https://twitter.com",
      "bg-text": ""
    },
    {
      "title": "LinkedIn",
      "groups": ["Group_1", "Group_2"],
      "url": "https://www.linkedin.com",
      "bg-text": ""
    },
    {
      "title": "YouTube",
      "groups": ["Group_2", "Group_3"],
      "url": "https://www.youtube.com",
      "bg-text": ""
    },
    {
      "title": "Netflix",
      "groups": ["Group_3", "Group_1"],
      "url": "https://www.netflix.com",
      "bg-text": ""
    },
    {
      "title": "Amazon",
      "groups": ["Group_1"],
      "url": "https://www.amazon.com",
      "bg-text": ""
    },
    {
      "title": "Wikipedia",
      "groups": ["Group_2", "Group_3"],
      "url": "https://www.wikipedia.org",
      "bg-text": ""
    },
    {
      "title": "Google",
      "groups": ["Group_3"],
      "url": "https://www.google.com",
      "bg-text": ""
    },
    {
      "title": "Gmail",
      "groups": ["Group_1", "Group_2"],
      "url": "https://mail.google.com",
      "bg-text": ""
    },
    {
      "title": "Google Drive",
      "groups": ["Group_2", "Group_3"],
      "url": "https://drive.google.com",
      "bg-text": ""
    },
    {
      "title": "Dropbox",
      "groups": ["Group_3", "Group_1"],
      "url": "https://www.dropbox.com",
      "bg-text": ""
    },
    {
      "title": "Spotify",
      "groups": ["Group_1", "Group_2"],
      "url": "https://www.spotify.com",
      "bg-text": ""
    },
    {
      "title": "Pinterest",
      "groups": ["Group_2", "Group_3"],
      "url": "https://www.pinterest.com",
      "bg-text": ""
    },
    {
      "title": "Figma",
      "groups": ["Group_3", "Group_1"],
      "url": "https://www.figma.com",
      "bg-text": ""
    },
    {
      "title": "Medium",
      "groups": ["Group_1", "Group_2"],
      "url": "https://medium.com",
      "bg-text": ""
    },
    {
      "title": "Quora",
      "groups": ["Group_2", "Group_3"],
      "url": "https://www.quora.com",
      "bg-text": ""
    },
    {
      "title": "Twitch",
      "groups": ["Group_3", "Group_1"],
      "url": "https://www.twitch.tv",
      "bg-text": ""
    },
    {
      "title": "Discord",
      "groups": ["Group_1", "Group_2"],
      "url": "https://discord.com",
      "bg-text": ""
    },
    {
      "title": "Slack",
      "groups": ["Group_2", "Group_3"],
      "url": "https://slack.com",
      "bg-text": ""
    },
    {
      "title": "Trello",
      "groups": ["Group_3", "Group_1"],
      "url": "https://trello.com",
      "bg-text": ""
    },
    {
      "title": "Asana",
      "groups": ["Group_1", "Group_2"],
      "url": "https://asana.com",
      "bg-text": ""
    },
    {
      "title": "Jira",
      "groups": ["Group_2", "Group_3"],
      "url": "https://www.atlassian.com/software/jira",
      "bg-text": ""
    },
    {
      "title": "Efficiency Analysis",
      "groups": ["utils"],
      "url": "Efficiency%20Analysis/index.html",
      "bg-text": ""
    }
  ];

  // src/shared/dom.js
  var $id = (id) => document.getElementById(id);
  function qs(root, selector) {
    const context = root instanceof Element || root instanceof Document ? root : document;
    return context.querySelector(selector);
  }
  function on(el, eventName, handler, options) {
    if (!el) return;
    el.addEventListener(eventName, handler, options);
  }

  // src/shared/ui/debounce.js
  function debounce(fn, delay = 150) {
    let timer = null;
    return (...args) => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => fn(...args), delay);
    };
  }

  // src/shared/storage.js
  function get(key, fallback = null) {
    try {
      const value = localStorage.getItem(key);
      return value === null ? fallback : value;
    } catch {
      return fallback;
    }
  }
  function set(key, value) {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch {
      return false;
    }
  }
  function getEnum(key, allowed, fallback) {
    const value = get(key, fallback);
    return allowed.includes(value) ? value : fallback;
  }

  // src/shared/theme/accentPresets.js
  var ACCENT_CLASS_PRESETS = ["red", "green", "blue", "yellow", "purple", "orange"];

  // src/shared/theme/themeController.js
  var ThemeController = class {
    constructor(options) {
      this.options = options;
      this.root = document.documentElement;
      this.modeSwitch = $id(options.modeToggleButtonId);
      this.accentRoot = $id(options.accentPickerRootId);
      this.mode = getEnum(options.storageKeys.mode, ["day", "dark"], "day");
      this.colorMode = options.storageKeys.colorMode ? getEnum(options.storageKeys.colorMode, ["preset", "custom"], "preset") : "preset";
      this.accent = this.resolveInitialAccent();
      this.customColor = this.resolveCustomColor();
      this.customConfig = options.customColorConfig || null;
    }
    resolveInitialAccent() {
      const fallback = this.options.defaultAccent || (this.options.accentStrategy === "class" ? "red" : "#ff6b6b");
      if (this.options.accentStrategy === "class") {
        return getEnum(this.options.storageKeys.accent, ACCENT_CLASS_PRESETS, fallback);
      }
      return get(this.options.storageKeys.accent, fallback);
    }
    resolveCustomColor() {
      if (!this.options.storageKeys.customColor) return { r: 50, g: 50, b: 50 };
      const raw = get(this.options.storageKeys.customColor, "50,50,50");
      const [r, g, b] = String(raw).split(",").map((n) => Number.parseInt(n, 10));
      return [r, g, b].every((n) => Number.isFinite(n)) ? { r, g, b } : { r: 50, g: 50, b: 50 };
    }
    init() {
      this.applyMode();
      this.applyAccent();
      this.syncControls();
      on(this.modeSwitch, "click", () => {
        this.mode = this.mode === "dark" ? "day" : "dark";
        set(this.options.storageKeys.mode, this.mode);
        this.applyMode();
      });
      on(this.accentRoot, "change", (event) => {
        const input = event.target.closest(".tp-input");
        if (!input?.value) return;
        this.accent = input.value;
        set(this.options.storageKeys.accent, this.accent);
        this.applyAccent();
      });
      if (this.customConfig) {
        const colorModeSwitch = $id(this.customConfig.modeSwitchId);
        const mixer = $id(this.customConfig.mixerContainerId);
        const sliderEls = this.customConfig.sliderIds.map((id) => $id(id)).filter(Boolean);
        on(colorModeSwitch, "click", () => {
          this.colorMode = this.colorMode === "custom" ? "preset" : "custom";
          set(this.options.storageKeys.colorMode, this.colorMode);
          this.applyAccent();
          this.syncControls();
        });
        sliderEls.forEach((slider, idx) => {
          on(slider, "input", () => {
            const k = ["r", "g", "b"][idx];
            this.customColor[k] = Number.parseInt(slider.value, 10) || 0;
            this.colorMode = "custom";
            set(this.options.storageKeys.colorMode, this.colorMode);
            set(this.options.storageKeys.customColor, `${this.customColor.r},${this.customColor.g},${this.customColor.b}`);
            this.applyAccent();
            this.syncControls();
          });
        });
        if (mixer) mixer.setAttribute("aria-hidden", this.colorMode === "custom" ? "false" : "true");
      }
    }
    applyMode() {
      this.root.classList.toggle("theme-dark", this.mode === "dark");
      this.modeSwitch?.setAttribute("aria-pressed", this.mode === "dark" ? "true" : "false");
    }
    applyAccent() {
      if (this.options.accentStrategy === "class") {
        ACCENT_CLASS_PRESETS.forEach((name) => this.root.classList.remove(`accent-${name}`));
        this.root.classList.add(`accent-${this.accent}`);
        if (this.colorMode === "custom") {
          this.root.style.setProperty("--theme-color", `rgb(${this.customColor.r}, ${this.customColor.g}, ${this.customColor.b})`);
        } else {
          this.root.style.removeProperty("--theme-color");
        }
      } else {
        this.root.style.setProperty("--theme-color", this.accent);
      }
      this.syncControls();
    }
    syncControls() {
      if (this.accentRoot) {
        const selected = qs(this.accentRoot, `.tp-input[value="${this.accent}"]`);
        if (selected) selected.checked = true;
      }
      if (this.customConfig) {
        const modeSwitch = $id(this.customConfig.modeSwitchId);
        const mixer = $id(this.customConfig.mixerContainerId);
        const pickerSet = this.accentRoot;
        modeSwitch?.setAttribute("aria-pressed", this.colorMode === "custom" ? "true" : "false");
        pickerSet?.classList.toggle("theme-picker-custom", this.colorMode === "custom");
        if (mixer) mixer.setAttribute("aria-hidden", this.colorMode === "custom" ? "false" : "true");
        this.customConfig.sliderIds.forEach((id, idx) => {
          const key = ["r", "g", "b"][idx];
          const el = $id(id);
          if (el) el.value = String(this.customColor[key]);
        });
      }
    }
  };

  // src/shared/ui/glider.js
  function createGliderTracker({
    root,
    activeSelector,
    hoverSelector,
    activeGlider,
    hoverGlider,
    cssVars
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

  // src/apps/bookmarks/state.js
  function createState(allLinks) {
    return {
      allLinks: [...allLinks],
      activeGroup: null,
      searchQuery: ""
    };
  }
  function groupCounts(links2) {
    const counts = {};
    links2.forEach((link) => {
      (link.groups || []).forEach((group) => {
        counts[group] = (counts[group] || 0) + 1;
      });
    });
    return counts;
  }

  // src/apps/bookmarks/filter.js
  function scopeByGroup(links2, activeGroup) {
    if (!activeGroup) return links2;
    return links2.filter((link) => (link.groups || []).some((group) => String(group) === String(activeGroup)));
  }
  function searchLinks(links2, query) {
    const q = String(query || "").trim().toLowerCase();
    if (!q) return links2;
    return links2.filter((link) => {
      const title = String(link.title || "").toLowerCase();
      const url = String(link.url || "").toLowerCase();
      return title.includes(q) || url.includes(q);
    });
  }

  // src/apps/bookmarks/render/groups.js
  function renderGroups({
    nav,
    template,
    links: links2,
    activeGroup
  }) {
    const activeGlider = nav.querySelector("#groupNavGlider");
    const hoverGlider = nav.querySelector("#groupNavGliderHover");
    nav.replaceChildren(...[activeGlider, hoverGlider].filter(Boolean));
    const counts = groupCounts(links2);
    const makeBtn = (label, count, groupKey) => {
      const frag = template.content.cloneNode(true);
      const button = frag.querySelector(".nav-option");
      const labelSpan = button.querySelector(".group-lbl");
      labelSpan.textContent = `${label} (${count})`;
      button.dataset.group = groupKey || "";
      const isActive = activeGroup === null && !groupKey || activeGroup !== null && String(activeGroup) === String(groupKey);
      button.classList.toggle("active", isActive);
      button.setAttribute("aria-pressed", isActive ? "true" : "false");
      return frag;
    };
    nav.appendChild(makeBtn("All", links2.length, null));
    Object.keys(counts).sort((a, b) => a.localeCompare(b)).forEach((group) => {
      nav.appendChild(makeBtn(group, counts[group], group));
    });
  }
  function setActiveNavButton(nav, activeGroup) {
    nav.querySelectorAll(".nav-option").forEach((button) => {
      const group = button.dataset.group || null;
      const isActive = activeGroup === null && (group === null || group === "") || activeGroup !== null && String(group) === String(activeGroup);
      button.classList.toggle("active", isActive);
      button.setAttribute("aria-pressed", isActive ? "true" : "false");
    });
  }

  // src/apps/bookmarks/render/watermark.js
  var BG_TEXT_MAX_CHARS = 7;
  var BG_WATERMARK_SQUEEZE_X = 0.55;
  function normalizeBgText(raw) {
    if (typeof raw !== "string") return "";
    return raw.trim().replace(/\s+/g, " ").replace(/[^0-9A-Za-z &+\-_]/g, "").trim();
  }
  function bgTextFromHostname(url) {
    if (!url) return "";
    try {
      const host = new URL(url).hostname.replace(/^www\./i, "");
      return normalizeBgText(host.split(".")[0] || host);
    } catch {
      return normalizeBgText(String(url).replace(/^https?:\/\//i, "").replace(/^www\./i, "").split(/[/?#]/)[0].split(".")[0]);
    }
  }
  function getCardBgText(link) {
    const explicit = normalizeBgText(link?.["bg-text"]);
    if (explicit) return explicit.toUpperCase().slice(0, BG_TEXT_MAX_CHARS);
    const title = normalizeBgText(link?.title || "");
    if (title) return title.toUpperCase().slice(0, BG_TEXT_MAX_CHARS);
    const host = bgTextFromHostname(link?.url || "");
    return host.toUpperCase().slice(0, BG_TEXT_MAX_CHARS);
  }
  function createCardBgSvg(text) {
    const ns = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(ns, "svg");
    svg.classList.add("card-bg-svg");
    svg.setAttribute("viewBox", "0 0 200 100");
    svg.setAttribute("preserveAspectRatio", "none");
    const t = document.createElementNS(ns, "text");
    t.classList.add("card-bg-text");
    const padX = 12;
    const padY = 12;
    const y = 100 - padY;
    const safeText = String(text || "").slice(0, BG_TEXT_MAX_CHARS);
    const usableWidth = 200 - padX * 2;
    const slot = usableWidth / BG_TEXT_MAX_CHARS;
    const usableHeight = 200 - padY * 2;
    const maxByWidth = slot / BG_WATERMARK_SQUEEZE_X * 0.98;
    t.setAttribute("y", String(y));
    t.setAttribute("text-anchor", "start");
    t.setAttribute("dominant-baseline", "text-after-edge");
    t.setAttribute("font-size", String(Math.floor(Math.min(usableHeight, maxByWidth))));
    for (let i = 0; i < safeText.length; i += 1) {
      const span = document.createElementNS(ns, "tspan");
      span.setAttribute("x", String(padX + i * slot));
      span.textContent = safeText[i];
      t.appendChild(span);
    }
    svg.appendChild(t);
    return svg;
  }

  // src/apps/bookmarks/render/cards.js
  function renderCards({ linkGrid, cardTemplate, links: links2 }) {
    linkGrid.innerHTML = "";
    if (!links2.length) {
      const empty = document.createElement("div");
      empty.className = "card-grid-empty";
      empty.textContent = "No links found matching your criteria.";
      linkGrid.appendChild(empty);
      return;
    }
    const fragment = document.createDocumentFragment();
    links2.forEach((link) => {
      const clone = cardTemplate.content.cloneNode(true);
      const card = clone.querySelector(".card");
      const titleEl = clone.querySelector(".card-title");
      const bodyEl = clone.querySelector(".card-body");
      const href = link.url || "#";
      const isExternal = /^https?:\/\//i.test(href);
      const anchor = document.createElement("a");
      anchor.className = "card-link";
      anchor.href = href;
      anchor.textContent = link.title || link.url || "Untitled";
      if (isExternal) {
        anchor.target = "_blank";
        anchor.rel = "noopener noreferrer";
      }
      if (titleEl) {
        titleEl.innerHTML = "";
        titleEl.appendChild(anchor);
      }
      if (bodyEl) bodyEl.textContent = link.url || "";
      if (card) {
        const bgText = getCardBgText(link);
        if (bgText) card.prepend(createCardBgSvg(bgText));
      }
      fragment.appendChild(clone);
    });
    linkGrid.appendChild(fragment);
  }

  // src/apps/bookmarks/app.js
  var state = createState(links);
  function registerServiceWorker() {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("./sw.js").catch(() => {
      });
    }
  }
  function main() {
    const el = {
      groupNav: $id("groupNav"),
      linkGrid: $id("linkGrid"),
      searchInput: $id("searchInput"),
      resultMeta: $id("resultMeta"),
      cardTemplate: $id("cardTemplate"),
      groupTemplate: $id("groupOptionTemplate"),
      themePickerSet: $id("themePickerSet"),
      themePickerGlider: $id("themePickerGlider"),
      themePickerGliderHover: $id("themePickerGliderHover"),
      navGlider: $id("groupNavGlider"),
      navGliderHover: $id("groupNavGliderHover")
    };
    const theme = new ThemeController({
      modeToggleButtonId: "dayNightSwitch",
      accentPickerRootId: "themePickerSet",
      accentStrategy: "class",
      storageKeys: {
        mode: "theme-mode",
        accent: "bookmarks-accent-color",
        colorMode: "bookmarks-color-mode",
        customColor: "bookmarks-custom-color"
      },
      defaultAccent: "red",
      customColorConfig: {
        modeSwitchId: "colorModeSwitch",
        mixerContainerId: "colorMixerContainer",
        sliderIds: ["colorSliderRed", "colorSliderGreen", "colorSliderBlue"]
      }
    });
    theme.init();
    const navGlider = createGliderTracker({
      root: el.groupNav,
      activeSelector: ".nav-option.active",
      hoverSelector: ".nav-option",
      activeGlider: el.navGlider,
      hoverGlider: el.navGliderHover,
      cssVars: { x: "--nav-glider-x", y: "--nav-glider-y", w: "--nav-glider-width", h: "--nav-glider-height" }
    });
    const themeGlider = createGliderTracker({
      root: el.themePickerSet,
      activeSelector: ".tp-input:checked + .tp-input-lbl",
      hoverSelector: ".tp-input-lbl",
      activeGlider: el.themePickerGlider,
      hoverGlider: el.themePickerGliderHover,
      cssVars: { x: "--glider-x", y: "--glider-y", w: "--glider-width", h: "--glider-height" }
    });
    function render() {
      const scoped = scopeByGroup(state.allLinks, state.activeGroup);
      const filtered = searchLinks(scoped, state.searchQuery);
      renderCards({ linkGrid: el.linkGrid, cardTemplate: el.cardTemplate, links: filtered });
      const parts = [`Showing ${filtered.length} of ${scoped.length} links`];
      if (state.activeGroup) parts.push(`Group: ${state.activeGroup}`);
      if (state.searchQuery) parts.push(`Search: "${state.searchQuery}"`);
      el.resultMeta.textContent = parts.join(" \u2014 ");
    }
    renderGroups({ nav: el.groupNav, template: el.groupTemplate, links: state.allLinks, activeGroup: state.activeGroup });
    render();
    requestAnimationFrame(() => {
      navGlider.update();
      themeGlider.update();
    });
    on(el.groupNav, "click", (event) => {
      const button = event.target.closest(".nav-option");
      if (!button) return;
      const group = button.dataset.group || null;
      state.activeGroup = state.activeGroup === group || state.activeGroup === null && group === null ? null : group;
      setActiveNavButton(el.groupNav, state.activeGroup);
      render();
      navGlider.update();
    });
    const onSearch = debounce((value) => {
      state.searchQuery = value;
      render();
    }, 150);
    on(el.searchInput, "input", (event) => onSearch(event.target.value || ""));
    on(el.searchInput, "keydown", (event) => {
      if (event.key !== "Escape") return;
      el.searchInput.value = "";
      state.searchQuery = "";
      render();
    });
    registerServiceWorker();
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", main);
  } else {
    main();
  }
})();
