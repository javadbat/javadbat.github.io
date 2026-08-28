import { memo } from "react";
import "jb-icons/arrow";
import "jb-icons/delete";
import "jb-icons/edit";
import "jb-icons/plus";
import "jb-icons/react";
import styles from "./CatalogIcon.module.css";

/** Business icon request shared by the catalog, canvas cards, and configuration actions. */
interface CatalogIconProps {
  /** Registry or action icon identifier to render. */
  iconId: string;
  /** Optional consumer style used to size or position the icon. */
  className?: string;
  /** Whether stateful action artwork should show its active variant. */
  active?: boolean;
}

/** Renders consistent builder action icons and registry-provided catalog symbols. */
export const CatalogIcon = memo(function CatalogIcon({ iconId, className, active = false }: CatalogIconProps) {
  /** Shared and consumer-provided classes applied to either icon implementation. */
  const classes = [styles.catalogIcon, className].filter(Boolean).join(" ");

  switch (iconId) {
    case "configure":
      return <jb-icon-edit className={classes} isActive={active} />;
    case "move-up":
      return <jb-icon-arrow className={classes} direction="up" />;
    case "move-down":
      return <jb-icon-arrow className={classes} direction="down" />;
    case "remove":
      return <jb-icon-delete className={classes} isOpen={active} />;
    case "drop":
      return <jb-icon-plus className={classes} />;
    default:
      break;
  }

  return (
    <svg className={classes} aria-hidden="true" focusable="false">
      <use href={`/form/catalog-icons.svg#${iconId}`} />
    </svg>
  );
});
