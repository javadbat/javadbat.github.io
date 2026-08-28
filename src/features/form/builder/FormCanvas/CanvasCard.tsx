import { useState, type KeyboardEvent } from "react";
import { observer } from "mobx-react-lite";
import { JBButton } from "jb-button/react";
import { JBTooltip } from "@jbui/tooltip/react";
import type { JBFormElementV1 } from "../../domain/form-document";
import { getLocalizedText, isContainerElement } from "../../domain/form-document";
import type { FormMessages } from "../../i18n/locale-adapter";
import { getFormElementDisplayName, registryByType } from "jb-form-builder/registry/form-element-registry";
import { beginBuilderDrag, CANVAS_DRAG_TYPE, endBuilderDrag } from "../builder-drag";
import { CatalogIcon } from "../CatalogIcon/CatalogIcon";
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
  /** Locale currently edited by the builder. */
  locale: string;
  /** Document fallback locale for missing element text. */
  defaultLocale: string;
  /** Localized builder-interface copy. */
  messages: FormMessages;
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
type ActionProps = Pick<CanvasCardProps, "element" | "index" | "count" | "messages" | "onConfigure" | "onMove" | "onDuplicate" | "onRemove">;

/** Renders selected-element configure, reorder, duplicate, and remove actions. */
function CanvasCardActions({ element, index, count, messages, onConfigure, onMove, onDuplicate, onRemove }: ActionProps) {
  /** Action whose animated icon is currently hovered or keyboard-focused. */
  const [activeIcon, setActiveIcon] = useState<"configure" | "remove" | null>(null);
  return (
    <div className={styles.cardActions}>
      <JBTooltip content={messages.configure} positionArea="top" tail>
        <JBButton
          square
          size="sm"
          variant="ghost"
          aria-label={messages.configure}
          onPointerEnter={() => setActiveIcon("configure")}
          onPointerLeave={() => setActiveIcon(null)}
          onFocus={() => setActiveIcon("configure")}
          onBlur={() => setActiveIcon(null)}
          onClick={() => onConfigure(element.id)}
        >
          <CatalogIcon iconId="configure" active={activeIcon === "configure"} />
        </JBButton>
      </JBTooltip>
      <JBTooltip content={messages.moveUp} positionArea="top" tail>
        <JBButton square size="sm" variant="ghost" aria-label={messages.moveUp} disabled={index === 0} onClick={() => onMove(element.id, -1)}>
          <CatalogIcon iconId="move-up" />
        </JBButton>
      </JBTooltip>
      <JBTooltip content={messages.moveDown} positionArea="top" tail>
        <JBButton square size="sm" variant="ghost" aria-label={messages.moveDown} disabled={index === count - 1} onClick={() => onMove(element.id, 1)}>
          <CatalogIcon iconId="move-down" />
        </JBButton>
      </JBTooltip>
      <JBTooltip content={messages.duplicate} positionArea="top" tail>
        <JBButton square size="sm" variant="ghost" aria-label={messages.duplicate} onClick={() => onDuplicate(element.id)}>
          <CatalogIcon iconId="duplicate" />
        </JBButton>
      </JBTooltip>
      <JBTooltip content={messages.remove} positionArea="top" tail>
        <JBButton
          id={`element-remove-${element.id}`}
          square
          size="sm"
          variant="ghost"
          aria-label={messages.remove}
          onPointerEnter={() => setActiveIcon("remove")}
          onPointerLeave={() => setActiveIcon(null)}
          onFocus={() => setActiveIcon("remove")}
          onBlur={() => setActiveIcon(null)}
          onClick={() => onRemove(element.id)}
        >
          <CatalogIcon iconId="remove" active={activeIcon === "remove"} />
        </JBButton>
      </JBTooltip>
    </div>
  );
}

/** Renders one selectable, draggable, keyboard-reorderable form element summary. */
export const CanvasCard = observer(function CanvasCard(props: CanvasCardProps) {
  /** Business data and callbacks supplied by the owning canvas collection. */
  const { element, index, count, isSelected, locale, defaultLocale, messages, onSelect, onConfigure, onMove, onDuplicate, onRemove, onFocusOffset } = props;
  /** Registry metadata that defines the element's display and icon identity. */
  const entry = registryByType.get(element.type);
  if (!entry) return null;
  /** Component name localized for the active builder interface. */
  const componentName = getFormElementDisplayName(entry, locale);
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
        aria-label={messages.dragToReorder}
        title={messages.dragToReorder}
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
        aria-label={`${componentName}: ${label}, ${index + 1} ${messages.of} ${count}`}
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
            <code>{element.name || "—"}</code>
            <small>{componentName}</small>
          </span>
        </span>
      </button>
      {isSelected ? (
        <CanvasCardActions
          element={element}
          index={index}
          count={count}
          messages={messages}
          onConfigure={onConfigure}
          onMove={onMove}
          onDuplicate={onDuplicate}
          onRemove={onRemove}
        />
      ) : null}
    </div>
  );
});
