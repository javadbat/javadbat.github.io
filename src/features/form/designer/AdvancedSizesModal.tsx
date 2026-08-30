import { useState } from "react";
import { JBButton } from "jb-button/react";
import { JBCheckbox } from "jb-checkbox/react";
import { JBInput } from "jb-input/react";
import { JBNumberInput } from "jb-number-input/react";
import { JBRangeInput } from "jb-range-input/react";
import { useFormLocale, type FormMessageKey } from "../i18n/locale-adapter";
import {
  GLOBAL_CONTROL_HEIGHT_TOKENS,
  GLOBAL_RADIUS_TOKENS,
  type DesignerThemeConfig,
  type GlobalThemeToken,
} from "./theme-config";
import {
  recalculateAllThemeSizes,
  updateBaseThemeSize,
  withCalculatedThemeSizes,
  type BaseThemeSizeToken,
} from "./theme-size-calculator";
import styles from "./DesignerApp.module.css";

type ThemeSizeCode = "xs" | "sm" | "md" | "lg" | "xl";

interface AdvancedSizesModalProps {
  values: DesignerThemeConfig["global"];
  defaults: Partial<Record<GlobalThemeToken, string>>;
  linkedGroups: Record<BaseThemeSizeToken, boolean>;
  onLinkChange: (token: BaseThemeSizeToken, linked: boolean) => void;
  onApply: (values: DesignerThemeConfig["global"]) => void;
  onClose: () => void;
}

function valueFromEvent(event: unknown): string {
  const candidate = event as { currentTarget?: { value?: unknown }; target?: { value?: unknown } };
  return String(candidate.currentTarget?.value ?? candidate.target?.value ?? "");
}

function numberFromEvent(event: unknown, fallback: number): number {
  const value = Number(valueFromEvent(event));
  return Number.isFinite(value) ? value : fallback;
}

function cssLengthToRem(value: string): number {
  const numeric = Number.parseFloat(value);
  if (!Number.isFinite(numeric)) return Number.NaN;
  if (value.trim().toLowerCase().endsWith("px") && typeof document !== "undefined") {
    const rootFontSize = Number.parseFloat(getComputedStyle(document.documentElement).fontSize);
    return rootFontSize > 0 ? numeric / rootFontSize : numeric / 16;
  }
  return numeric;
}

function SettingRange({
  label,
  message,
  value,
  onChange,
}: {
  label: string;
  message?: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className={styles.rangeSetting}>
      <span>{label}</span>
      <JBRangeInput
        aria-label={label}
        message={message}
        size="sm"
        min={0}
        max={2}
        step={0.125}
        tickStep={0.5}
        minorTickStep={null}
        value={value}
        onInput={event => onChange(numberFromEvent(event, value))}
      />
      <JBNumberInput
        aria-label={`${label} value`}
        size="sm"
        minValue={0}
        maxValue={2}
        step={0.125}
        value={value}
        onInput={event => onChange(numberFromEvent(event, value))}
      >
        <span className={styles.inputSuffix} slot="end-section" aria-hidden="true">rem</span>
      </JBNumberInput>
    </div>
  );
}

export default function AdvancedSizesModal({
  values,
  defaults,
  linkedGroups,
  onLinkChange,
  onApply,
  onClose,
}: AdvancedSizesModalProps) {
  const { messages } = useFormLocale("en");
  const [draft, setDraft] = useState<DesignerThemeConfig["global"]>(() => (
    withCalculatedThemeSizes(values) as DesignerThemeConfig["global"]
  ));
  const message = (key: FormMessageKey, replacements: Record<string, string | number> = {}) => Object.entries(replacements)
    .reduce((result, [name, value]) => result.replaceAll(`{${name}}`, String(value)), messages[key]);
  const sizeLabel = (size: ThemeSizeCode): string => ({
    xs: messages.designerExtraSmall,
    sm: messages.designerSmall,
    md: messages.designerMedium,
    lg: messages.designerLarge,
    xl: messages.designerExtraLarge,
  })[size];

  const updateBase = (token: BaseThemeSizeToken, value: string) => {
    setDraft(current => updateBaseThemeSize(current, token, value, linkedGroups[token]) as DesignerThemeConfig["global"]);
  };

  const radiusSize: Record<typeof GLOBAL_RADIUS_TOKENS[number], ThemeSizeCode> = {
    "--jb-radius": "md",
    "--jb-radius-xs": "xs",
    "--jb-radius-sm": "sm",
    "--jb-radius-lg": "lg",
    "--jb-radius-xl": "xl",
  };

  return (
    <div className={styles.modalBackdrop} role="presentation" onMouseDown={event => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section
        className={`${styles.exportModal} ${styles.advancedColorsModal}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="advanced-sizes-title"
        onKeyDown={event => { if (event.key === "Escape") onClose(); }}
      >
        <header>
          <div>
            <h2 id="advanced-sizes-title">{messages.designerAdvancedSizes}</h2>
            <p>{messages.designerAdvancedSizesModalHelp}</p>
          </div>
          <JBButton size="sm" variant="ghost" onClick={() => setDraft(recalculateAllThemeSizes(draft) as DesignerThemeConfig["global"])}>
            {messages.designerRestoreCalculatedSizes}
          </JBButton>
        </header>
        <div className={styles.advancedColorGroups}>
          <section className={styles.advancedColorGroup}>
            <header className={styles.advancedColorGroupHeader}>
              <div>
                <h3>{messages.designerControlHeightScale}</h3>
                <p>{messages.designerControlHeightScaleHelp}</p>
              </div>
            </header>
            <div className={styles.advancedBaseToken}>
              <span className={styles.baseColorBadge}>{messages.designerBaseSize}</span>
              <JBInput
                size="md"
                label={message("designerControlHeightLabel", { size: sizeLabel("md") })}
                message={linkedGroups["--jb-control-height-md"] ? messages.designerBaseSizeHelp : messages.designerBaseSizeIndependentHelp}
                value={draft["--jb-control-height-md"] ?? defaults["--jb-control-height-md"] ?? ""}
                onInput={event => updateBase("--jb-control-height-md", valueFromEvent(event))}
              />
              <JBCheckbox
                className={styles.baseSizeLink}
                size="sm"
                name="advanced-link-control-height-scale"
                label={messages.designerLinkCalculatedSizes}
                message={linkedGroups["--jb-control-height-md"] ? messages.designerLinkedSizesHelp : messages.designerUnlinkedSizesHelp}
                value={linkedGroups["--jb-control-height-md"]}
                onChange={event => onLinkChange("--jb-control-height-md", Boolean(event.target.value))}
              />
              <code>--jb-control-height-md</code>
            </div>
            <div className={styles.advancedDerivedGrid}>
              {GLOBAL_CONTROL_HEIGHT_TOKENS.filter(token => token !== "--jb-control-height-md").map(token => (
                <div className={`${styles.tokenField} ${styles.advancedDerivedToken}`} key={token}>
                  <JBInput
                    size="sm"
                    label={message("designerControlHeightLabel", { size: sizeLabel(token.slice("--jb-control-height-".length) as ThemeSizeCode) })}
                    value={draft[token] ?? defaults[token] ?? ""}
                    onInput={event => setDraft(current => ({ ...current, [token]: valueFromEvent(event) || null }))}
                  />
                  <code>{token}</code>
                </div>
              ))}
            </div>
          </section>

          <section className={styles.advancedColorGroup}>
            <header className={styles.advancedColorGroupHeader}>
              <div>
                <h3>{messages.designerRadiusScale}</h3>
                <p>{messages.designerRadiusScaleHelp}</p>
              </div>
            </header>
            <div className={styles.advancedBaseToken}>
              <span className={styles.baseColorBadge}>{messages.designerBaseSize}</span>
              <SettingRange
                label={message("designerCornerRadiusLabel", { size: sizeLabel("md") })}
                message={linkedGroups["--jb-radius"] ? messages.designerBaseSizeHelp : messages.designerBaseSizeIndependentHelp}
                value={cssLengthToRem(draft["--jb-radius"] ?? defaults["--jb-radius"] ?? "")}
                onChange={value => updateBase("--jb-radius", `${value}rem`)}
              />
              <JBCheckbox
                className={styles.baseSizeLink}
                size="sm"
                name="advanced-link-radius-scale"
                label={messages.designerLinkCalculatedSizes}
                message={linkedGroups["--jb-radius"] ? messages.designerLinkedSizesHelp : messages.designerUnlinkedSizesHelp}
                value={linkedGroups["--jb-radius"]}
                onChange={event => onLinkChange("--jb-radius", Boolean(event.target.value))}
              />
              <code>--jb-radius</code>
            </div>
            <div className={styles.advancedDerivedGrid}>
              {GLOBAL_RADIUS_TOKENS.filter(token => token !== "--jb-radius").map(token => {
                const radius = cssLengthToRem(draft[token] ?? defaults[token] ?? "");
                return (
                  <div className={`${styles.tokenField} ${styles.advancedDerivedToken}`} key={token}>
                    <SettingRange
                      label={message("designerCornerRadiusLabel", { size: sizeLabel(radiusSize[token]) })}
                      value={Number.isFinite(radius) ? radius : 0}
                      onChange={value => setDraft(current => ({ ...current, [token]: `${value}rem` }))}
                    />
                    <code>{token}</code>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
        <footer>
          <span>{messages.designerAdvancedSizesApplyOnSave}</span>
          <div>
            <JBButton variant="ghost" onClick={onClose}>{messages.designerCancel}</JBButton>
            <JBButton color="primary" onClick={() => onApply(draft)}>{messages.designerApplySizes}</JBButton>
          </div>
        </footer>
      </section>
    </div>
  );
}
