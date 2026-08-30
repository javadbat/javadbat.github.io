import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { JBButton } from "jb-button/react";
import styles from "./FormRouteLayout.module.css";

type HeaderProps = ComponentPropsWithoutRef<"header"> & {
  layout?: "default" | "editor";
};
type BrandMarkProps = ComponentPropsWithoutRef<"span">;
type BrandProps = ComponentPropsWithoutRef<"a"> & {
  title: ReactNode;
  subtitle: ReactNode;
};
type LinkButtonProps = ComponentPropsWithoutRef<"a"> & {
  variant?: "ghost" | "outline" | "solid";
  square?: boolean;
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

/** Semantic route link with the visual treatment used by header buttons. */
export function FormRouteLinkButton({ className, variant = "ghost", square = false, ...props }: LinkButtonProps) {
  const { children, ...linkProps } = props;
  return (
    <a
      className={`${styles.linkButton} ${className ?? ""}`}
      {...linkProps}
    >
      <JBButton
        variant={variant}
        color={variant === "solid" ? "primary" : undefined}
        size="sm"
        square={square}
        tabIndex={-1}
      >
        {children}
      </JBButton>
    </a>
  );
}
