import { useTranslation } from "react-i18next";
import { useState, type KeyboardEvent } from "react";
import { observer } from "mobx-react-lite";
import { JBButton } from "jb-button/react";
import { JBTooltip } from "@jbui/tooltip/react";
import type { JBFormElementV1 } from "../../domain/form-document";
import { getLocalizedText, isContainerElement } from "../../domain/form-document";
import { getFormElementDisplayName, registryByType } from "../../component-data";
import { beginBuilderDrag, CANVAS_DRAG_TYPE, endBuilderDrag } from "../builder-drag";
import { CatalogIcon } from "../CatalogIcon/CatalogIcon";
import { useBuilderStore } from "../store/BuilderStoreContext";
import styles from "./FormCanvas.module.css";

/** Shared card contract used to represent root and nested form elements on the canvas. */
export interface CanvasCardProps {
  /** Portable element represented by the card. */
  element: JBFormElementV1;
  /** Position within the owning collection. */
  index: number;
  /** Number of siblings used for movement limits and accessible position copy. */
  count: number;
  /** Whether this element owns the active builder configuration selection. */
  isSelected: boolean;
  /** Whether a touch/non-hover device needs persistent visible actions. */
  alwaysShowActions: boolean;
  /** Selects the card's element. */
  onSelect: (elementId: string) => void;
  /** Selects the element and opens its configuration surface. */
  onConfigure: (elementId: string) => void;
  /** Moves the element one sibling position. */
  onMove: (elementId: string, offset: -1 | 1) => void;
  /** Creates an independent duplicate of the element. */
  onDuplicate: (elementId: string) => void;
  /** Starts removal confirmation for the element. */
  onRemove: (elementId: string) => void;
  /** Transfers keyboard focus to an adjacent card. */
  onFocusOffset: (index: number, offset: -1 | 1) => void;
}

/** Canvas-card inputs needed only by the action toolbar. */
type ActionProps = Pick<CanvasCardProps, "element" | "index" | "count" | "onConfigure" | "onMove" | "onDuplicate" | "onRemove">;

/** Renders selected-element configure, reorder, duplicate, and remove actions. */
function CanvasCardActions({ element, index, count, onConfigure, onMove, onDuplicate, onRemove }: ActionProps) {
  const { t } = useTranslation("formCanvas");
  /** Action whose animated icon is currently hovered or keyboard-focused. */
  const [activeIcon, setActiveIcon] = useState<"configure" | "remove" | null>(null);
  return (
    <div className={styles.cardActions}>
      <JBTooltip content={t("configure")} positionArea="top" tail>
        <JBButton
          square
          size="sm"
          variant="ghost"
          aria-label={t("configure")}
          onPointerEnter={() => setActiveIcon("configure")}
          onPointerLeave={() => setActiveIcon(null)}
          onFocus={() => setActiveIcon("configure")}
          onBlur={() => setActiveIcon(null)}
          onClick={() => onConfigure(element.id)}
        >
          <span className={styles.actionContent}>
            <CatalogIcon iconId="configure" active={activeIcon === "configure"} />
            <span className={styles.actionLabel}>{t("configure")}</span>
          </span>
        </JBButton>
      </JBTooltip>
      <JBTooltip content={t("moveUp")} positionArea="top" tail>
        <JBButton square size="sm" variant="ghost" aria-label={t("moveUp")} disabled={index === 0} onClick={() => onMove(element.id, -1)}>
          <span className={styles.actionContent}>
            <CatalogIcon iconId="move-up" />
            <span className={styles.actionLabel}>{t("moveUp")}</span>
          </span>
        </JBButton>
      </JBTooltip>
      <JBTooltip content={t("moveDown")} positionArea="top" tail>
        <JBButton square size="sm" variant="ghost" aria-label={t("moveDown")} disabled={index === count - 1} onClick={() => onMove(element.id, 1)}>
          <span className={styles.actionContent}>
            <CatalogIcon iconId="move-down" />
            <span className={styles.actionLabel}>{t("moveDown")}</span>
          </span>
        </JBButton>
      </JBTooltip>
      <JBTooltip content={t("duplicate")} positionArea="top" tail>
        <JBButton square size="sm" variant="ghost" aria-label={t("duplicate")} onClick={() => onDuplicate(element.id)}>
          <span className={styles.actionContent}>
            <CatalogIcon iconId="duplicate" />
            <span className={styles.actionLabel}>{t("duplicate")}</span>
          </span>
        </JBButton>
      </JBTooltip>
      <JBTooltip content={t("remove")} positionArea="top" tail>
        <JBButton
          id={`element-remove-${element.id}`}
          square
          size="sm"
          variant="ghost"
          aria-label={t("remove")}
          onPointerEnter={() => setActiveIcon("remove")}
          onPointerLeave={() => setActiveIcon(null)}
          onFocus={() => setActiveIcon("remove")}
          onBlur={() => setActiveIcon(null)}
          onClick={() => onRemove(element.id)}
        >
          <span className={styles.actionContent}>
            <CatalogIcon iconId="remove" active={activeIcon === "remove"} />
            <span className={styles.actionLabel}>{t("remove")}</span>
          </span>
        </JBButton>
      </JBTooltip>
    </div>
  );
}

/** Renders one selectable, draggable, keyboard-reorderable form element summary. */
export const CanvasCard = observer(function CanvasCard(props: CanvasCardProps) {
  const { t: tCommon } = useTranslation("common");
  const { t, i18n } = useTranslation("formCanvas");
  const store = useBuilderStore();
  /** Business data and callbacks supplied by the owning canvas collection. */
  const { element, index, count, isSelected, alwaysShowActions, onSelect, onConfigure, onMove, onDuplicate, onRemove, onFocusOffset } = props;
  const locale = store.editingLocale;
  const defaultLocale = store.document.localization.defaultLocale;
  /** Registry metadata that defines the element's display and icon identity. */
  const entry = registryByType.get(element.type);
  if (!entry) return null;
  /** Component name localized for the active builder interface. */
  const componentName = getFormElementDisplayName(entry, i18n.resolvedLanguage ?? i18n.language);
  /** Element-authored label or container name before registry fallback. */
  const fallbackLabel = isContainerElement(element) ? element.name : getLocalizedText(element.label, locale, defaultLocale);
  /** Final card label that distinguishes untranslated defaults from localized component names. */
  const label = !isContainerElement(element) && !element.label?.translations[locale] && fallbackLabel === entry.displayName ? componentName : fallbackLabel || componentName;
  /** Supports Alt+Arrow reordering and Arrow-only focus navigation between cards. */
  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.altKey && (event.key === "ArrowUp" || event.key === "ArrowDown")) {
      event.preventDefault();
      onMove(element.id, event.key === "ArrowUp" ? -1 : 1);
    } else if (event.key === "ArrowUp" || event.key === "ArrowDown") {
      event.preventDefault();
      onFocusOffset(index, event.key === "ArrowUp" ? -1 : 1);
    }
  };
  return (
    <div id={`element-card-${element.id}`} className={styles.canvasCard} data-selected={isSelected}>
      <JBButton
        square
        variant="ghost"
        draggable
        className={styles.dragHandle}
        aria-label={t("dragToReorder")}
        title={t("dragToReorder")}
        onDragStart={event => {
          event.dataTransfer.effectAllowed = "move";
          event.dataTransfer.setData(CANVAS_DRAG_TYPE, element.id);
          /** Full business card cloned for browser drag feedback. */
          const card = event.currentTarget.closest<HTMLElement>(`#element-card-${element.id}`);
          if (card) beginBuilderDrag(event.dataTransfer, card, styles.dragPreview, [`.${styles.dragHandle}`, `.${styles.cardActions}`]);
        }}
        onDragEnd={endBuilderDrag}
      >
        <CatalogIcon iconId="drag" />
      </JBButton>
      <button
        id={`element-select-${element.id}`}
        type="button"
        className={styles.canvasSelect}
        aria-pressed={isSelected}
        aria-label={`${componentName}: ${label}, ${index + 1} ${tCommon("of")} ${count}`}
        onClick={() => onSelect(element.id)}
        onKeyDown={handleKeyDown}
      >
        <span className={styles.canvasCardIcon}>
          <CatalogIcon iconId={entry.iconId} />
        </span>
        <span className={styles.canvasCardCopy}>
          <span>
            <strong>{label}</strong>
          </span>
          <span>
            <small>{componentName}</small>
          </span>
        </span>
      </button>
      {isSelected || alwaysShowActions ? (
        <CanvasCardActions
          element={element}
          index={index}
          count={count}
          onConfigure={onConfigure}
          onMove={onMove}
          onDuplicate={onDuplicate}
          onRemove={onRemove}
        />
      ) : null}
    </div>
  );
});
