import { useState, type KeyboardEvent } from "react";
import { observer } from "mobx-react-lite";
import { JBButton } from "jb-button/react";
import { JBTooltip } from "@jbui/tooltip/react";
import type { JBFormElementV1 } from "../../domain/form-document";
import { getLocalizedText } from "../../domain/form-document";
import type { FormMessages } from "../../i18n/locale-adapter";
import { getFormElementDisplayName, registryByType } from "../../registry/form-element-registry";
import { CANVAS_DRAG_TYPE } from "../builder-drag";
import { CatalogIcon } from "../CatalogIcon/CatalogIcon";
import styles from "./FormCanvas.module.css";

interface CanvasCardProps {
  element: JBFormElementV1;
  index: number;
  count: number;
  isSelected: boolean;
  locale: string;
  defaultLocale: string;
  messages: FormMessages;
  onSelect: (elementId: string) => void;
  onConfigure: (elementId: string) => void;
  onMove: (elementId: string, offset: -1 | 1) => void;
  onDuplicate: (elementId: string) => void;
  onRemove: (elementId: string) => void;
  onFocusOffset: (index: number, offset: -1 | 1) => void;
}

type ActionProps = Pick<CanvasCardProps, "element" | "index" | "count" | "messages" | "onConfigure" | "onMove" | "onDuplicate" | "onRemove">;

function CanvasCardActions({ element, index, count, messages, onConfigure, onMove, onDuplicate, onRemove }: ActionProps) {
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

export const CanvasCard = observer(function CanvasCard(props: CanvasCardProps) {
  const { element, index, count, isSelected, locale, defaultLocale, messages, onSelect, onConfigure, onMove, onDuplicate, onRemove, onFocusOffset } = props;
  const entry = registryByType.get(element.type);
  if (!entry) return null;
  const componentName = getFormElementDisplayName(entry, locale);
  const fallbackLabel = getLocalizedText(element.label, locale, defaultLocale);
  const label = !element.label?.translations[locale] && fallbackLabel === entry.displayName ? componentName : fallbackLabel || componentName;
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
        }}
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
