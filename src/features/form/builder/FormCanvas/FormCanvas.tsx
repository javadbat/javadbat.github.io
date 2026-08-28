import { lazy, Suspense } from "react";
import { observer } from "mobx-react-lite";
import { getLocalizedText, isConditionElement, isContainerElement, isRepeatableGroupElement, isTabElement, isWizardElement } from "../../domain/form-document";
import type { FormMessages } from "../../i18n/locale-adapter";
import { getFormElementDisplayName } from "jb-form-builder/registry/form-element-registry";
import { useBuilderStore } from "../store/BuilderStoreContext";
import { CatalogIcon } from "../CatalogIcon/CatalogIcon";
import { ModalLoadingFallback } from "../../shell/ModalLoadingFallback";
import { CanvasCard } from "./CanvasCard";
import { TabCanvasCard } from "./TabCanvasCard";
import { ConditionCanvasCard } from "./ConditionCanvasCard";
import { WizardCanvasCard } from "./WizardCanvasCard";
import { RepeatableGroupCanvasCard } from "./RepeatableGroupCanvasCard";
import styles from "./FormCanvas.module.css";
import { useCanvasInteractions } from "./useCanvasInteractions";
import { InsertionTarget } from "./InsertionTarget";

const RemoveElementModal = lazy(() => import("./RemoveElementModal/RemoveElementModal").then(module => ({ default: module.RemoveElementModal })));

interface FormCanvasProps {
  messages: FormMessages;
  onOpenFormNameSettings?: () => void;
  onSelectElement?: (elementId: string) => void;
  onConfigureElement?: (elementId: string) => void;
}

export const FormCanvas = observer(function FormCanvas({ messages, onOpenFormNameSettings, onSelectElement, onConfigureElement }: FormCanvasProps) {
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
            <button type="button" className={styles.titleButton} onClick={onOpenFormNameSettings}>
              {store.formName}
            </button>
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
              <InsertionTarget active={dragOverIndex === index} onDragOver={event => markDropTarget(event, index)} onDrop={event => acceptDrop(event, index)}>
                <CatalogIcon iconId="drop" />{messages.dropHere}
              </InsertionTarget>
              {isTabElement(element) ? <TabCanvasCard
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
              /> : isConditionElement(element) ? <ConditionCanvasCard
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
              /> : isRepeatableGroupElement(element) ? <RepeatableGroupCanvasCard
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
              /> : isWizardElement(element) ? <WizardCanvasCard
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
              /> : <CanvasCard
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
              />}
              {index === count - 1 ? (
                <InsertionTarget active={dragOverIndex === count} onDragOver={event => markDropTarget(event, count)} onDrop={event => acceptDrop(event, count)}>
                  <CatalogIcon iconId="drop" />{messages.dropHere}
                </InsertionTarget>
              ) : null}
            </li>
          ))}
        </ol>
      )}
      <p className={styles.srOnly} aria-live="polite" aria-atomic="true">
        {store.announcement}
      </p>
      {pendingRemoval ? (
        <Suspense fallback={<ModalLoadingFallback label={messages.loadingModal} />}>
          <RemoveElementModal
            isOpen
            elementLabel={
              (isContainerElement(pendingRemoval) ? pendingRemoval.name : getLocalizedText(pendingRemoval.label, locale, defaultLocale)) ||
              (pendingRemovalEntry ? getFormElementDisplayName(pendingRemovalEntry, locale) : pendingRemoval.type)
            }
            messages={messages}
            onCancel={interactions.cancelRemoval}
            onConfirm={interactions.confirmRemoval}
          />
        </Suspense>
      ) : null}
    </main>
  );
});
