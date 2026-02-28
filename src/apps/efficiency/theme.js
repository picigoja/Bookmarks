import { ThemeController } from "../../shared/theme/themeController.js";

export function initEfficiencyTheme() {
  const theme = new ThemeController({
    modeToggleButtonId: "eaDayNightSwitch",
    accentPickerRootId: "eaThemePickerSet",
    accentStrategy: "cssVar",
    storageKeys: {
      mode: "theme-mode",
      accent: "efficiency-theme-accent",
    },
    defaultAccent: "#ff6b6b",
  });
  theme.init();
  return theme;
}
