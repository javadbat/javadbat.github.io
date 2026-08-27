import { useEffect, useState, type DragEvent } from "react";
import { observer } from "mobx-react-lite";
import type { JBRepeatableGroupElementV1 } from "../../domain/form-document";
import { registryByType } from "../../registry/form-element-registry";
import { BUILDER_DRAG_END_EVENT, CANVAS_DRAG_TYPE, CATALOG_DRAG_TYPE, endBuilderDrag } from "../builder-drag";
import { useBuilderStore } from "../store/BuilderStoreContext";
import { CatalogIcon } from "../CatalogIcon/CatalogIcon";
import { CanvasCard, type CanvasCardProps } from "./CanvasCard";
import styles from "./FormCanvas.module.css";
import { InsertionTarget } from "./InsertionTarget";

interface Props extends Omit<CanvasCardProps, "element"> { element: JBRepeatableGroupElementV1; }

export const RepeatableGroupCanvasCard = observer(function RepeatableGroupCanvasCard(props: Props) {
  const { element, messages } = props;
  const store = useBuilderStore();
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  useEffect(() => {
    const clearDropTarget = () => setDragOverIndex(null);
    window.addEventListener(BUILDER_DRAG_END_EVENT, clearDropTarget);
    return () => window.removeEventListener(BUILDER_DRAG_END_EVENT, clearDropTarget);
  }, []);
  const acceptDrop = (event: DragEvent, insertionIndex: number) => {
    event.preventDefault(); endBuilderDrag(); setDragOverIndex(null);
    const entry = registryByType.get(event.dataTransfer.getData(CATALOG_DRAG_TYPE) as never);
    if (entry && !entry.isContainer) {
      const id = store.addElementToRepeatableGroup(element.id, entry, insertionIndex);
      if (id) requestAnimationFrame(() => document.getElementById(`element-select-${id}`)?.focus());
      return;
    }
    const childId = event.dataTransfer.getData(CANVAS_DRAG_TYPE);
    if (childId) store.moveElementToRepeatableGroupInsertionIndex(childId, element.id, insertionIndex);
  };
  const markDropTarget = (event: DragEvent, insertionIndex: number) => {
    if (registryByType.get(event.dataTransfer.getData(CATALOG_DRAG_TYPE) as never)?.isContainer) return;
    event.preventDefault(); event.dataTransfer.dropEffect = event.dataTransfer.types.includes(CATALOG_DRAG_TYPE) ? "copy" : "move"; setDragOverIndex(insertionIndex);
  };
  return <div className={styles.tabContainerCard}>
    <CanvasCard {...props} element={element} />
    <div className={styles.tabPanel}>
      {element.children.length === 0 ? <div className={styles.tabEmptyDrop} data-drop-active={dragOverIndex === 0} onDragOver={event => markDropTarget(event, 0)} onDrop={event => acceptDrop(event, 0)}>Drop form elements into this repeatable group</div> :
        <ol className={styles.tabChildList}>{element.children.map((child, index) => <li key={child.id}>
          <InsertionTarget active={dragOverIndex === index} onDragOver={event => markDropTarget(event, index)} onDrop={event => acceptDrop(event, index)}><CatalogIcon iconId="drop" />{messages.dropHere}</InsertionTarget>
          <CanvasCard {...props} element={child} index={index} count={element.children.length} onFocusOffset={(current, offset) => { const target = element.children[Math.max(0, Math.min(current + offset, element.children.length - 1))]; if (target) document.getElementById(`element-select-${target.id}`)?.focus(); }} />
          {index === element.children.length - 1 ? <InsertionTarget active={dragOverIndex === element.children.length} onDragOver={event => markDropTarget(event, element.children.length)} onDrop={event => acceptDrop(event, element.children.length)}><CatalogIcon iconId="drop" />{messages.dropHere}</InsertionTarget> : null}
        </li>)}</ol>}
    </div>
  </div>;
});
