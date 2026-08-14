import { memo } from "react";
import "jb-icons/arrow";
import "jb-icons/delete";
import "jb-icons/edit";
import "jb-icons/react";
import styles from "./CatalogIcon.module.css";

interface CatalogIconProps {
  iconId: string;
  className?: string;
  active?: boolean;
}

export const CatalogIcon = memo(function CatalogIcon({ iconId, className, active = false }: CatalogIconProps) {
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
    default:
      break;
  }

  return (
    <svg className={classes} aria-hidden="true" focusable="false">
      <use href={`/form/catalog-icons.svg#${iconId}`} />
    </svg>
  );
});
