import type { ComponentPropsWithoutRef, ReactNode } from "react";
import styles from "./FormRouteLayout.module.css";

type HeaderProps = ComponentPropsWithoutRef<"header"> & {
  layout?: "default" | "editor";
};
type BrandMarkProps = ComponentPropsWithoutRef<"span">;
type BrandProps = ComponentPropsWithoutRef<"a"> & {
  title: ReactNode;
  subtitle: ReactNode;
};

/** Shared outer header container for every interactive `/form` sub-route. */
export function FormRouteHeader({ className, layout = "default", ...props }: HeaderProps) {
  return <header className={`${styles.header} ${layout === "editor" ? styles.editorHeader : ""} ${className ?? ""}`} {...props} />;
}

/** Shared JB identity tile used inside form-route headers. */
export function FormRouteBrandMark({ className, children = "JB", ...props }: BrandMarkProps) {
  return <span className={`${styles.brandMark} ${className ?? ""}`} {...props}>{children}</span>;
}

/** Shared product identity block; title and subtitle remain route-specific. */
export function FormRouteBrand({ className, title, subtitle, ...props }: BrandProps) {
  return (
    <a className={`${styles.brand} ${className ?? ""}`} {...props}>
      <FormRouteBrandMark />
      <span className={styles.brandCopy}>
        <strong>{title}</strong>
        <small>{subtitle}</small>
      </span>
    </a>
  );
}
