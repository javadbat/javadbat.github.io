import { useTranslation } from "react-i18next";
import { THEME_PRESETS, type DesignerThemeConfig } from "../theme-config";
import styles from "./ThemePresetPanel.module.css";

export interface ThemePresetPanelProps {
  activePreset: string;
  onSelect: (theme: DesignerThemeConfig, presetId: string) => void;
}

export function ThemePresetPanel({ activePreset, onSelect }: ThemePresetPanelProps) {
  const { t } = useTranslation("themePresetPanel");
  return (
    <section className={styles.presets}>
      <h2>{t("designerPresets")}</h2>
      <div className={styles.presetRow}>
        {THEME_PRESETS.slice(0, 4).map(preset => (
          <button
            key={preset.id}
            type="button"
            className={activePreset === preset.id ? styles.presetSelected : styles.presetButton}
            onClick={() => onSelect(preset.config, preset.id)}
          >
            <span><img src={preset.thumbnail} alt="" /></span>
            <small>{preset.label}</small>
          </button>
        ))}
      </div>
    </section>
  );
}
