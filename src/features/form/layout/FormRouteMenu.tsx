import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { JBPopover } from "jb-popover/react";
import { JBOption } from "jb-select/option/react";
import { JBSelect } from "jb-select/react";
import { formPageHref, type FormPage } from "../application/form-page-url";
import type { FormMessages } from "../i18n/locale-adapter";
import styles from "./FormRouteMenu.module.css";

export interface FormRouteLanguageOption {
  value: string;
  label: string;
}

export interface FormRouteMenuProps {
  currentPage: FormPage;
  messages: FormMessages;
  language: string;
  onLanguageChange: (language: string) => void;
  languageOptions?: readonly FormRouteLanguageOption[];
  languageLabel?: string;
  formSlug?: string;
  themeSlug?: string;
  className?: string;
}

type MenuLinkProps = {
  current: boolean;
  href: string;
  icon: ReactNode;
  label: string;
  onNavigate?: () => void;
};

function FormsIcon() {
  return <svg className={styles.icon} viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5.5h14M5 12h14M5 18.5h14" /><circle cx="3" cy="5.5" r=".75" /><circle cx="3" cy="12" r=".75" /><circle cx="3" cy="18.5" r=".75" /></svg>;
}

function BuilderIcon() {
  return <svg className={`${styles.icon} ${styles.builderIcon}`} viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 3.5h7v7h-7zM13.5 3.5h7v7h-7zM3.5 13.5h7v7h-7zM13.5 13.5h7v7h-7z" /></svg>;
}

function DesignerIcon() {
  return <svg className={styles.icon} viewBox="0 0 24 24" aria-hidden="true"><path d="m14.5 5.5 4 4M4 20l4.2-1 10.3-10.3a2.8 2.8 0 0 0-4-4L4.2 15 4 20Z" /><path d="m12.3 7.7 4 4" /></svg>;
}

function LanguageIcon() {
  return <svg className={styles.icon} viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M3.5 12h17M12 3c2.3 2.5 3.5 5.5 3.5 9S14.3 18.5 12 21M12 3C9.7 5.5 8.5 8.5 8.5 12s1.2 6.5 3.5 9" /></svg>;
}

function MenuIcon() {
  return <svg className={styles.icon} viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" /></svg>;
}

function FormRouteMenuLink({ current, href, icon, label, onNavigate }: MenuLinkProps) {
  return (
    <a className={styles.link} href={href} aria-current={current ? "page" : undefined} onClick={onNavigate}>
      {icon}
      <span>{label}</span>
    </a>
  );
}

export function FormRouteMenu({
  currentPage,
  messages,
  language,
  onLanguageChange,
  languageOptions = [{ value: "en", label: "EN" }, { value: "fa", label: "FA" }],
  languageLabel = messages.interfaceLanguage,
  formSlug,
  themeSlug,
  className,
}: FormRouteMenuProps) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverId = `form-route-menu-${useId().replaceAll(":", "")}`;
  const close = () => setOpen(false);

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      triggerRef.current?.focus();
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [open]);

  const selectLanguage = (nextLanguage: string) => {
    onLanguageChange(nextLanguage);
    close();
  };

  const links = (onNavigate?: () => void) => (
    <nav className={styles.links} aria-label={messages.formNavigation}>
      <FormRouteMenuLink current={currentPage === "landing"} href={formPageHref("landing")} icon={<FormsIcon />} label={messages.backToForms} onNavigate={onNavigate} />
      <FormRouteMenuLink current={currentPage === "builder"} href={formPageHref("builder", formSlug)} icon={<BuilderIcon />} label={messages.builder} onNavigate={onNavigate} />
      <FormRouteMenuLink current={currentPage === "designer"} href={formPageHref("designer", formSlug, themeSlug)} icon={<DesignerIcon />} label={messages.designer} onNavigate={onNavigate} />
    </nav>
  );

  const languageSelect = (name: string) => (
    <div className={styles.languageControl} title={languageLabel}>
      <LanguageIcon />
      <JBSelect<string>
        name={name}
        aria-label={languageLabel}
        size="sm"
        value={language}
        hideClear
        onChange={event => selectLanguage(String(event.target.value))}
      >
        {languageOptions.map(option => <JBOption key={option.value} value={option.value}>{option.label}</JBOption>)}
      </JBSelect>
    </div>
  );

  return (
    <div className={`${styles.menu} ${className ?? ""}`}>
      <div className={styles.desktopMenu}>
        {links()}
        {languageSelect("formRouteLanguage")}
      </div>
      <div className={styles.mobileMenu}>
        <button
          ref={triggerRef}
          type="button"
          className={styles.mobileTrigger}
          aria-label={messages.openFormNavigation}
          aria-expanded={open}
          aria-controls={popoverId}
          onClick={() => setOpen(current => !current)}
        >
          <MenuIcon />
        </button>
        <JBPopover
          id={popoverId}
          className={styles.popover}
          anchor={triggerRef}
          isOpen={open}
          positionArea={{ block: "after", inline: "end" }}
          overflowHandler="SLIDE"
          onClose={close}
        >
          <div className={styles.popoverContent}>
            {links(close)}
            {languageSelect("formRouteMobileLanguage")}
          </div>
        </JBPopover>
      </div>
    </div>
  );
}
