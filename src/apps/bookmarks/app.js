import { links } from "../../../data/bookmarks-data.js";
import { $id, on } from "../../shared/dom.js";
import { debounce } from "../../shared/ui/debounce.js";
import { ThemeController } from "../../shared/theme/themeController.js";
import { createGliderTracker } from "../../shared/ui/glider.js";
import { createState } from "./state.js";
import { scopeByGroup, searchLinks } from "./filter.js";
import { renderGroups, setActiveNavButton } from "./render/groups.js";
import { renderCards } from "./render/cards.js";

const state = createState(links);

function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
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
    navGliderHover: $id("groupNavGliderHover"),
  };

  const theme = new ThemeController({
    modeToggleButtonId: "dayNightSwitch",
    accentPickerRootId: "themePickerSet",
    accentStrategy: "class",
    storageKeys: {
      mode: "theme-mode",
      accent: "bookmarks-accent-color",
      colorMode: "bookmarks-color-mode",
      customColor: "bookmarks-custom-color",
    },
    defaultAccent: "red",
    customColorConfig: {
      modeSwitchId: "colorModeSwitch",
      mixerContainerId: "colorMixerContainer",
      sliderIds: ["colorSliderRed", "colorSliderGreen", "colorSliderBlue"],
    },
  });
  theme.init();

  const navGlider = createGliderTracker({
    root: el.groupNav,
    activeSelector: ".nav-option.active",
    hoverSelector: ".nav-option",
    activeGlider: el.navGlider,
    hoverGlider: el.navGliderHover,
    cssVars: { x: "--nav-glider-x", y: "--nav-glider-y", w: "--nav-glider-width", h: "--nav-glider-height" },
  });

  const themeGlider = createGliderTracker({
    root: el.themePickerSet,
    activeSelector: ".tp-input:checked + .tp-input-lbl",
    hoverSelector: ".tp-input-lbl",
    activeGlider: el.themePickerGlider,
    hoverGlider: el.themePickerGliderHover,
    cssVars: { x: "--glider-x", y: "--glider-y", w: "--glider-width", h: "--glider-height" },
  });

  function render() {
    const scoped = scopeByGroup(state.allLinks, state.activeGroup);
    const filtered = searchLinks(scoped, state.searchQuery);

    renderCards({ linkGrid: el.linkGrid, cardTemplate: el.cardTemplate, links: filtered });

    const parts = [`Showing ${filtered.length} of ${scoped.length} links`];
    if (state.activeGroup) parts.push(`Group: ${state.activeGroup}`);
    if (state.searchQuery) parts.push(`Search: "${state.searchQuery}"`);
    el.resultMeta.textContent = parts.join(" — ");
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
    state.activeGroup = state.activeGroup === group || (state.activeGroup === null && group === null) ? null : group;
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
