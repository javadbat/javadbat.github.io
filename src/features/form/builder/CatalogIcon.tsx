import { memo } from "react";
import styles from "./BuilderApp.module.css";

interface CatalogIconProps {
  iconId: string;
  className?: string;
}

export const CatalogIcon = memo(function CatalogIcon({ iconId, className }: CatalogIconProps) {
  const classes = [styles.catalogIcon, className].filter(Boolean).join(" ");

  return (
    <svg className={classes} aria-hidden="true" focusable="false">
      <use href={`/form/catalog-icons.svg#${iconId}`} />
    </svg>
  );
});
