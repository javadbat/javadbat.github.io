import { useCallback, useState, type DragEvent, type KeyboardEvent } from "react";
import { observer } from "mobx-react-lite";
import { JBButton } from "jb-button/react";
import type { JBFormElementV1 } from "../domain/form-document";
import { getLocalizedText } from "../domain/form-document";
import type { FormMessages } from "../i18n/locale-adapter";
import { registryByType, type FormElementRegistryEntry } from "../registry/form-element-registry";
import { useBuilderStore } from "./BuilderStoreContext";
import { CANVAS_DRAG_TYPE, CATALOG_DRAG_TYPE } from "./builder-drag";
import { CatalogIcon } from "./CatalogIcon";
import { RemoveElementModal } from "./RemoveElementModal";
import styles from "./BuilderApp.module.css";

interface FormCanvasProps {
  messages: FormMessages;
}

interface CanvasCardProps {
  element: JBFormElementV1;
  index: number;
  count: number;
  isSelected: boolean;
  locale: string;
  messages: FormMessages;
  onConfigure: (elementId: string) => void;
  onMove: (elementId: string, offset: -1 | 1) => void;
  onDuplicate: (elementId: string) => void;
  onRemove: (elementId: string) => void;
  onFocusOffset: (index: number, offset: -1 | 1) => void;
}

function focusElementCard(elementId: string): void {
  requestAnimationFrame(() => {
    document.getElementById(`element-select-${elementId}`)?.focus();
    document.getElementById(`element-card-${elementId}`)?.scrollIntoView({ block: "nearest" });
  });
}

const CanvasCard = observer(function CanvasCard({
  element,
  index,
  count,
  isSelected,
  locale,
  messages,
  onConfigure,
  onMove,
  onDuplicate,
  onRemove,
  onFocusOffset,
}: CanvasCardProps) {
  const store = useBuilderStore();
  const entry = registryByType.get(element.type);
  if (!entry) {
    return null;
  }

  const label = getLocalizedText(element.label, locale) || entry.displayName;
  const position = index + 1;

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.altKey && (event.key === "ArrowUp" || event.key === "ArrowDown")) {
      event.preventDefault();
      onMove(element.id, event.key === "ArrowUp" ? -1 : 1);
      return;
    }

    if (event.key === "ArrowUp" || event.key === "ArrowDown") {
      event.preventDefault();
      onFocusOffset(index, event.key === "ArrowUp" ? -1 : 1);
    }
  };

  return (
    <div id={`element-card-${element.id}`} className={styles.canvasCard} data-selected={isSelected}>
      <button
        id={`element-select-${element.id}`}
        type="button"
        className={styles.canvasSelect}
        aria-pressed={isSelected}
        aria-label={`${entry.displayName}: ${label}, ${position} ${messages.of} ${count}`}
        onClick={() => store.selectElement(element.id)}
        onKeyDown={handleKeyDown}
      >
        <span className={styles.canvasCardIcon}>
          <CatalogIcon iconId={entry.iconId} />
        </span>
        <span className={styles.canvasCardCopy}>
          <span className={styles.cardTopline}>
            <strong>{label}</strong>
            {isSelected ? <em>{messages.selected}</em> : null}
          </span>
          <span>
            <code>{element.name || "—"}</code>
            <small>{entry.displayName}</small>
          </span>
        </span>
      </button>

      {isSelected ? (
        <div className={styles.cardActions}>
          <JBButton square size="sm" variant="ghost" aria-label={messages.configure} title={messages.configure} onClick={() => onConfigure(element.id)}>
            <CatalogIcon iconId="configure" />
          </JBButton>
          <JBButton square size="sm" variant="ghost" aria-label={messages.moveUp} title={messages.moveUp} disabled={index === 0} onClick={() => onMove(element.id, -1)}>
            <CatalogIcon iconId="move-up" />
          </JBButton>
          <JBButton square size="sm" variant="ghost" aria-label={messages.moveDown} title={messages.moveDown} disabled={index === count - 1} onClick={() => onMove(element.id, 1)}>
            <CatalogIcon iconId="move-down" />
          </JBButton>
          <JBButton square size="sm" variant="ghost" aria-label={messages.duplicate} title={messages.duplicate} onClick={() => onDuplicate(element.id)}>
            <CatalogIcon iconId="duplicate" />
          </JBButton>
          <JBButton id={`element-remove-${element.id}`} square size="sm" variant="ghost" aria-label={messages.remove} title={messages.remove} onClick={() => onRemove(element.id)}>
            <CatalogIcon iconId="remove" />
          </JBButton>
          <JBButton
            square
            size="sm"
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
        </div>
      ) : null}
    </div>
  );
});

export const FormCanvas = observer(function FormCanvas({ messages }: FormCanvasProps) {
  const store = useBuilderStore();
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [pendingRemovalId, setPendingRemovalId] = useState<string | null>(null);
  const locale = store.document.localization.defaultLocale;
  const count = store.document.elements.length;
  const pendingRemoval = pendingRemovalId ? (store.document.elements.find(element => element.id === pendingRemovalId) ?? null) : null;
  const pendingRemovalEntry = pendingRemoval ? registryByType.get(pendingRemoval.type) : undefined;

  const announcePosition = useCallback(
    (entry: FormElementRegistryEntry, action: string, position: number) => {
      store.announce(`${entry.displayName} ${action} ${position} ${messages.of} ${store.document.elements.length}`);
    },
    [messages.of, store],
  );

  const configureElement = useCallback(
    (elementId: string) => {
      store.selectElement(elementId);
      window.setTimeout(() => {
        document.getElementById(`element-name-${elementId}`)?.focus({ preventScroll: false });
      }, 0);
    },
    [store],
  );

  const moveElement = useCallback(
    (elementId: string, offset: -1 | 1) => {
      const element = store.document.elements.find(candidate => candidate.id === elementId);
      if (!element) {
        return;
      }
      const nextIndex = store.moveElementBy(elementId, offset);
      if (nextIndex === -1) {
        return;
      }
      const entry = registryByType.get(element.type);
      if (entry) {
        announcePosition(entry, messages.movedAnnouncement, nextIndex + 1);
      }
      focusElementCard(elementId);
    },
    [announcePosition, messages.movedAnnouncement, store],
  );

  const duplicateElement = useCallback(
    (elementId: string) => {
      const duplicateId = store.duplicateElement(elementId);
      if (!duplicateId) {
        return;
      }
      const duplicate = store.document.elements.find(element => element.id === duplicateId);
      const entry = duplicate ? registryByType.get(duplicate.type) : undefined;
      if (entry) {
        announcePosition(entry, messages.duplicatedAnnouncement, store.getElementPosition(duplicateId) + 1);
      }
      focusElementCard(duplicateId);
    },
    [announcePosition, messages.duplicatedAnnouncement, store],
  );

  const confirmRemoval = useCallback(() => {
    if (!pendingRemoval) {
      return;
    }
    const entry = registryByType.get(pendingRemoval.type);
    const nextSelectionId = store.removeElement(pendingRemoval.id);
    setPendingRemovalId(null);
    store.announce(`${entry?.displayName ?? pendingRemoval.type} ${messages.removedAnnouncement}`);
    if (nextSelectionId) {
      focusElementCard(nextSelectionId);
    } else {
      requestAnimationFrame(() => {
        document.getElementById("form-canvas-title")?.focus();
      });
    }
  }, [messages.removedAnnouncement, pendingRemoval, store]);

  const cancelRemoval = useCallback(() => {
    const elementId = pendingRemovalId;
    setPendingRemovalId(null);
    requestAnimationFrame(() => {
      if (elementId) {
        document.getElementById(`element-remove-${elementId}`)?.focus();
      }
    });
  }, [pendingRemovalId]);

  const focusOffset = useCallback(
    (index: number, offset: -1 | 1) => {
      const nextIndex = Math.max(0, Math.min(index + offset, count - 1));
      const nextElement = store.document.elements[nextIndex];
      if (nextElement) {
        document.getElementById(`element-select-${nextElement.id}`)?.focus();
      }
    },
    [count, store],
  );

  const acceptDrop = useCallback(
    (event: DragEvent, insertionIndex: number) => {
      event.preventDefault();
      setDragOverIndex(null);

      const elementType = event.dataTransfer.getData(CATALOG_DRAG_TYPE);
      const registryEntry = registryByType.get(elementType as FormElementRegistryEntry["type"]);
      if (registryEntry) {
        const elementId = store.addElement(registryEntry, insertionIndex);
        announcePosition(registryEntry, messages.addedAnnouncement, store.getElementPosition(elementId) + 1);
        focusElementCard(elementId);
        return;
      }

      const elementId = event.dataTransfer.getData(CANVAS_DRAG_TYPE);
      const element = store.document.elements.find(candidate => candidate.id === elementId);
      if (!element) {
        return;
      }
      const nextIndex = store.moveElementToInsertionIndex(elementId, insertionIndex);
      const entry = registryByType.get(element.type);
      if (entry && nextIndex >= 0) {
        announcePosition(entry, messages.movedAnnouncement, nextIndex + 1);
        focusElementCard(elementId);
      }
    },
    [announcePosition, messages.addedAnnouncement, messages.movedAnnouncement, store],
  );

  const markDropTarget = useCallback((event: DragEvent, insertionIndex: number) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = event.dataTransfer.types.includes(CATALOG_DRAG_TYPE) ? "copy" : "move";
    setDragOverIndex(insertionIndex);
  }, []);

  return (
    <main
      className={styles.canvas}
      aria-labelledby="form-canvas-title"
      onKeyDown={event => {
        if (event.key === "Escape" && dragOverIndex !== null) {
          setDragOverIndex(null);
        }
      }}
    >
      <div className={styles.canvasHeader}>
        <div>
          <p className={styles.eyebrow}>{messages.currentDraft}</p>
          <h1 id="form-canvas-title" tabIndex={-1}>
            {store.formName}
          </h1>
        </div>
        <span className={styles.fieldCount}>
          <strong>{count}</strong> {count === 1 ? messages.field : messages.fields}
        </span>
      </div>

      {count === 0 ? (
        <div className={styles.emptyCanvas} data-drop-active={dragOverIndex === 0} onDragOver={event => markDropTarget(event, 0)} onDrop={event => acceptDrop(event, 0)}>
          <span className={styles.emptyIllustration}>
            <CatalogIcon iconId="text-input" />
          </span>
          <h2>{messages.emptyFormTitle}</h2>
          <p>{messages.emptyFormDescription}</p>
        </div>
      ) : (
        <ol className={styles.canvasList}>
          {store.document.elements.map((element, index) => (
            <li className={styles.canvasListItem} key={element.id}>
              <div
                className={styles.insertionTarget}
                data-active={dragOverIndex === index}
                onDragOver={event => markDropTarget(event, index)}
                onDrop={event => acceptDrop(event, index)}
              />
              <CanvasCard
                element={element}
                index={index}
                count={count}
                isSelected={element.id === store.selectedElementId}
                locale={locale}
                messages={messages}
                onConfigure={configureElement}
                onMove={moveElement}
                onDuplicate={duplicateElement}
                onRemove={setPendingRemovalId}
                onFocusOffset={focusOffset}
              />
              {index === count - 1 ? (
                <div
                  className={styles.insertionTarget}
                  data-active={dragOverIndex === count}
                  onDragOver={event => markDropTarget(event, count)}
                  onDrop={event => acceptDrop(event, count)}
                />
              ) : null}
            </li>
          ))}
        </ol>
      )}

      <p className={styles.srOnly} aria-live="polite" aria-atomic="true">
        {store.announcement}
      </p>

      <RemoveElementModal
        isOpen={pendingRemoval !== null}
        elementLabel={pendingRemoval ? getLocalizedText(pendingRemoval.label, locale) || pendingRemovalEntry?.displayName || pendingRemoval.type : ""}
        messages={messages}
        onCancel={cancelRemoval}
        onConfirm={confirmRemoval}
      />
    </main>
  );
});
