import { $id, on, qs } from "../dom.js";
import { getEnum, get, set } from "../storage.js";
import { ACCENT_CLASS_PRESETS } from "./accentPresets.js";

export class ThemeController {
  constructor(options) {
    this.options = options;
    this.root = document.documentElement;
    this.modeSwitch = $id(options.modeToggleButtonId);
    this.accentRoot = $id(options.accentPickerRootId);
    this.mode = getEnum(options.storageKeys.mode, ["day", "dark"], "day");
    this.colorMode = options.storageKeys.colorMode
      ? getEnum(options.storageKeys.colorMode, ["preset", "custom"], "preset")
      : "preset";
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
}
