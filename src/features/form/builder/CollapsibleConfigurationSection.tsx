import { useId, useState, type ReactNode } from "react";
import "jb-icons/triangle";
import "jb-icons/react";
import styles from "./BuilderApp.module.css";

interface CollapsibleConfigurationSectionProps {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
}

/**
 * Keeps disclosure behavior local to the section because it is presentational
 * state and is not shared with any other Builder surface.
 */
export function CollapsibleConfigurationSection({ title, children, defaultOpen = true }: CollapsibleConfigurationSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const contentId = useId();

  return (
    <fieldset className={styles.configurationSection}>
      <legend>
        <button type="button" className={styles.configurationSectionToggle} aria-expanded={isOpen} aria-controls={contentId} onClick={() => setIsOpen(current => !current)}>
          {/* The logical direction keeps the collapsed arrow correct in both
              LTR and RTL locales without duplicating locale-specific CSS. */}
          <span className={styles.configurationSectionIcon} aria-hidden="true">
            <jb-icon-triangle direction="inline-end" spin={isOpen?90:0} size="xs" />
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
