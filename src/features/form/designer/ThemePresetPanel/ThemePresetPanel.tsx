import type { FormMessages } from "../../i18n/locale-adapter";
import { THEME_PRESETS, type DesignerThemeConfig } from "../theme-config";
import styles from "./ThemePresetPanel.module.css";

export interface ThemePresetPanelProps {
  activePreset: string;
  messages: FormMessages;
  onSelect: (theme: DesignerThemeConfig, presetId: string) => void;
}

export function ThemePresetPanel({ activePreset, messages, onSelect }: ThemePresetPanelProps) {
  return (
    <section className={styles.presets}>
      <h2>{messages.designerPresets}</h2>
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
