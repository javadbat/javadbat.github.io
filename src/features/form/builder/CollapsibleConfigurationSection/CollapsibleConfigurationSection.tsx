import { useId, useState, type ReactNode } from "react";
import "jb-icons/triangle";
import styles from "./CollapsibleConfigurationSection.module.css";

/** Content and initial disclosure state for a reusable configuration group. */
interface CollapsibleConfigurationSectionProps {
  /** Business category shown in the section legend. */
  title: string;
  /** Configuration controls governed by this disclosure. */
  children: ReactNode;
  /** Initial visibility; subsequent state remains local to this presentation. */
  defaultOpen?: boolean;
}

/**
 * Keeps disclosure behavior local to the section because it is presentational
 * state and is not shared with any other Builder surface.
 */
export function CollapsibleConfigurationSection({ title, children, defaultOpen = true }: CollapsibleConfigurationSectionProps) {
  /** Current user-controlled visibility of this configuration category. */
  const [isOpen, setIsOpen] = useState(defaultOpen);
  /** Stable accessibility link between the disclosure button and controlled content. */
  const contentId = useId();

  return (
    <fieldset className={styles.configurationSection}>
      <legend>
        <button type="button" className={styles.configurationSectionToggle} aria-expanded={isOpen} aria-controls={contentId} onClick={() => setIsOpen(current => !current)}>
          {/* The logical direction keeps the collapsed arrow correct in both
              LTR and RTL locales without duplicating locale-specific CSS. */}
          <span className={styles.configurationSectionIcon} aria-hidden="true">
            <jb-icon-triangle direction="inline-end" spin={isOpen ? 90 : 0} size="xs" />
          </span>
          <span>{title}</span>
        </button>
      </legend>
      {/* `hidden` preserves mounted control state while removing collapsed
          content from layout and the accessibility tree. */}
      <div id={contentId} className={styles.configurationSectionContent} hidden={!isOpen}>
        {children}
      </div>
    </fieldset>
  );
}
