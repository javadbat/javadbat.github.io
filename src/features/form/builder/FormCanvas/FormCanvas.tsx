import { observer } from "mobx-react-lite";
import { getLocalizedText } from "../../domain/form-document";
import type { FormMessages } from "../../i18n/locale-adapter";
import { getFormElementDisplayName } from "../../registry/form-element-registry";
import { useBuilderStore } from "../BuilderStoreContext";
import { CatalogIcon } from "../CatalogIcon/CatalogIcon";
import { RemoveElementModal } from "../RemoveElementModal/RemoveElementModal";
import { CanvasCard } from "./CanvasCard";
import styles from "./FormCanvas.module.css";
import { useCanvasInteractions } from "./useCanvasInteractions";

interface FormCanvasProps {
  messages: FormMessages;
  onSelectElement?: (elementId: string) => void;
  onConfigureElement?: (elementId: string) => void;
}

export const FormCanvas = observer(function FormCanvas({ messages, onSelectElement, onConfigureElement }: FormCanvasProps) {
  const store = useBuilderStore();
  const locale = store.editingLocale;
  const defaultLocale = store.document.localization.defaultLocale;
  const count = store.document.elements.length;
  const interactions = useCanvasInteractions({ messages, onSelectElement, onConfigureElement });
  const { dragOverIndex, pendingRemoval, pendingRemovalEntry, acceptDrop, markDropTarget } = interactions;

  return (
    <main
      className={styles.canvas}
      data-builder-panel="canvas"
      aria-labelledby="form-canvas-title"
      onKeyDown={event => {
        if (event.key === "Escape" && dragOverIndex !== null) interactions.cancelDrag();
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
                defaultLocale={defaultLocale}
                messages={messages}
                onSelect={interactions.selectElement}
                onConfigure={interactions.configureElement}
                onMove={interactions.moveElement}
                onDuplicate={interactions.duplicateElement}
                onRemove={interactions.requestRemoval}
                onFocusOffset={interactions.focusOffset}
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
        elementLabel={
          pendingRemoval
            ? getLocalizedText(pendingRemoval.label, locale, defaultLocale) || (pendingRemovalEntry ? getFormElementDisplayName(pendingRemovalEntry, locale) : pendingRemoval.type)
            : ""
        }
        messages={messages}
        onCancel={interactions.cancelRemoval}
        onConfirm={interactions.confirmRemoval}
      />
    </main>
  );
});
