import { useEffect, useState, type DragEvent } from "react";
import { observer } from "mobx-react-lite";
import { JBButton } from "jb-button/react";
import { getLocalizedText, type JBFormWizardElementV1 } from "../../domain/form-document";
import { registryByType } from "../../registry/form-element-registry";
import { BUILDER_DRAG_END_EVENT, CANVAS_DRAG_TYPE, CATALOG_DRAG_TYPE, endBuilderDrag } from "../builder-drag";
import { useBuilderStore } from "../store/BuilderStoreContext";
import { CatalogIcon } from "../CatalogIcon/CatalogIcon";
import { CanvasCard, type CanvasCardProps } from "./CanvasCard";
import styles from "./FormCanvas.module.css";
import { InsertionTarget } from "./InsertionTarget";

interface WizardCanvasCardProps extends Omit<CanvasCardProps, "element"> {
  element: JBFormWizardElementV1;
}

export const WizardCanvasCard = observer(function WizardCanvasCard(props: WizardCanvasCardProps) {
  const { element, locale, defaultLocale, messages } = props;
  const store = useBuilderStore();
  const [activeStepId, setActiveStepId] = useState(element.steps[0]?.id ?? "");
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const activeStep = element.steps.find(step => step.id === activeStepId) ?? element.steps[0];

  useEffect(() => {
    const clearDropTarget = () => setDragOverIndex(null);
    window.addEventListener(BUILDER_DRAG_END_EVENT, clearDropTarget);
    return () => window.removeEventListener(BUILDER_DRAG_END_EVENT, clearDropTarget);
  }, []);

  useEffect(() => {
    if (!element.steps.some(step => step.id === activeStepId)) setActiveStepId(element.steps[0]?.id ?? "");
  }, [activeStepId, element.steps]);

  useEffect(() => {
    if (activeStep) store.setActiveContainerTab(element.id, activeStep.id);
  }, [activeStep?.id, element.id, store]);

  const activateStep = (stepId: string) => {
    setActiveStepId(stepId);
    store.setActiveContainerTab(element.id, stepId);
    props.onConfigure(element.id);
    requestAnimationFrame(() => document.getElementById(`wizard-step-editor-${stepId}`)?.focus({ preventScroll: true }));
  };

  const markDropTarget = (event: DragEvent, insertionIndex: number) => {
    const entry = registryByType.get(event.dataTransfer.getData(CATALOG_DRAG_TYPE) as never);
    if (entry?.isContainer) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = event.dataTransfer.types.includes(CATALOG_DRAG_TYPE) ? "copy" : "move";
    setDragOverIndex(insertionIndex);
  };

  const acceptDrop = (event: DragEvent, insertionIndex: number) => {
    event.preventDefault();
    endBuilderDrag();
    setDragOverIndex(null);
    if (!activeStep) return;
    const entry = registryByType.get(event.dataTransfer.getData(CATALOG_DRAG_TYPE) as never);
    if (entry && !entry.isContainer) {
      const id = store.addElementToWizard(element.id, activeStep.id, entry, insertionIndex);
      if (id) requestAnimationFrame(() => document.getElementById(`element-select-${id}`)?.focus());
      return;
    }
    const childId = event.dataTransfer.getData(CANVAS_DRAG_TYPE);
    if (childId) store.moveElementToWizardInsertionIndex(childId, element.id, activeStep.id, insertionIndex);
  };

  return (
    <div className={styles.tabContainerCard}>
      <CanvasCard {...props} element={element} />
      <div className={styles.builderTabList} aria-label={locale.toLowerCase().startsWith("fa") ? "مراحل فرم" : "Wizard steps"}>
        {element.steps.map((step, index) => (
          <button
            key={step.id}
            type="button"
            className={styles.builderTabTrigger}
            data-active={step.id === activeStep?.id}
            aria-current={step.id === activeStep?.id ? "step" : undefined}
            onClick={() => activateStep(step.id)}
          >
            {index + 1}. {getLocalizedText(step.label, locale, defaultLocale)}
          </button>
        ))}
        <JBButton size="sm" variant="ghost" aria-label={locale.toLowerCase().startsWith("fa") ? "افزودن مرحله" : "Add wizard step"} onClick={() => {
          const id = store.addWizardStep(element.id);
          if (id) activateStep(id);
        }}>+</JBButton>
      </div>
      {activeStep ? (
        <div className={styles.tabPanel} aria-label={getLocalizedText(activeStep.label, locale, defaultLocale)}>
          {activeStep.children.length === 0 ? (
            <div className={styles.tabEmptyDrop} data-drop-active={dragOverIndex === 0} onDragOver={event => markDropTarget(event, 0)} onDrop={event => acceptDrop(event, 0)}>
              {locale.toLowerCase().startsWith("fa") ? "اجزای فرم را در این مرحله رها کنید" : "Drop form elements into this step"}
            </div>
          ) : (
            <ol className={styles.tabChildList}>
              {activeStep.children.map((child, index) => (
                <li key={child.id}>
                  <InsertionTarget active={dragOverIndex === index} onDragOver={event => markDropTarget(event, index)} onDrop={event => acceptDrop(event, index)}><CatalogIcon iconId="drop" />{messages.dropHere}</InsertionTarget>
                  <CanvasCard
                    {...props}
                    element={child}
                    index={index}
                    count={activeStep.children.length}
                    isSelected={child.id === store.selectedElementId}
                    onFocusOffset={(currentIndex, offset) => {
                      const target = activeStep.children[Math.max(0, Math.min(currentIndex + offset, activeStep.children.length - 1))];
                      if (target) document.getElementById(`element-select-${target.id}`)?.focus();
                    }}
                  />
                  {index === activeStep.children.length - 1 ? (
                    <InsertionTarget active={dragOverIndex === activeStep.children.length} onDragOver={event => markDropTarget(event, activeStep.children.length)} onDrop={event => acceptDrop(event, activeStep.children.length)}><CatalogIcon iconId="drop" />{messages.dropHere}</InsertionTarget>
                  ) : null}
                </li>
              ))}
            </ol>
          )}
        </div>
      ) : null}
    </div>
  );
});
