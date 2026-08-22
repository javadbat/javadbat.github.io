import { useEffect, useState, type DragEvent } from "react";
import { observer } from "mobx-react-lite";
import { JBButton } from "jb-button/react";
import { getLocalizedText, type JBTabElementV1 } from "../../domain/form-document";
import { registryByType } from "../../registry/form-element-registry";
import { CANVAS_DRAG_TYPE, CATALOG_DRAG_TYPE } from "../builder-drag";
import { useBuilderStore } from "../store/BuilderStoreContext";
import { CanvasCard, type CanvasCardProps } from "./CanvasCard";
import styles from "./FormCanvas.module.css";

interface TabCanvasCardProps extends Omit<CanvasCardProps, "element"> {
  element: JBTabElementV1;
}

export const TabCanvasCard = observer(function TabCanvasCard(props: TabCanvasCardProps) {
  const { element, locale, defaultLocale, messages } = props;
  const store = useBuilderStore();
  const initialTab = element.tabs.find(tab => tab.value === element.props.defaultValue && !tab.disabled) ?? element.tabs.find(tab => !tab.disabled) ?? element.tabs[0];
  const [activeTabId, setActiveTabId] = useState(initialTab?.id ?? "");
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const activeTab = element.tabs.find(tab => tab.id === activeTabId) ?? initialTab;

  useEffect(() => {
    if (!element.tabs.some(tab => tab.id === activeTabId && !tab.disabled)) setActiveTabId(initialTab?.id ?? "");
  }, [activeTabId, element.tabs, initialTab?.id]);

  const acceptDrop = (event: DragEvent, insertionIndex: number) => {
    event.preventDefault();
    setDragOverIndex(null);
    if (!activeTab) return;
    const catalogType = event.dataTransfer.getData(CATALOG_DRAG_TYPE);
    const entry = registryByType.get(catalogType as never);
    if (entry && !entry.isContainer) {
      const id = store.addElementToTab(element.id, activeTab.id, entry, insertionIndex);
      if (id) requestAnimationFrame(() => document.getElementById(`element-select-${id}`)?.focus());
      return;
    }
    const childId = event.dataTransfer.getData(CANVAS_DRAG_TYPE);
    if (!childId) return;
    const index = store.moveElementToTabInsertionIndex(childId, element.id, activeTab.id, insertionIndex);
    if (index >= 0) requestAnimationFrame(() => document.getElementById(`element-select-${childId}`)?.focus());
  };

  const markDropTarget = (event: DragEvent, insertionIndex: number) => {
    const catalogType = event.dataTransfer.getData(CATALOG_DRAG_TYPE);
    const entry = registryByType.get(catalogType as never);
    if (entry?.isContainer) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = event.dataTransfer.types.includes(CATALOG_DRAG_TYPE) ? "copy" : "move";
    setDragOverIndex(insertionIndex);
  };

  return (
    <div className={styles.tabContainerCard}>
      <CanvasCard {...props} element={element} />
      <div className={styles.builderTabList} role="tablist" aria-label={typeof element.props.ariaLabel === "object" ? getLocalizedText(element.props.ariaLabel as never, locale, defaultLocale) : "Form sections"}>
        {element.tabs.map(tab => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={tab.id === activeTab?.id}
            disabled={tab.disabled}
            className={styles.builderTabTrigger}
            data-active={tab.id === activeTab?.id}
            style={tab.color ? { borderBlockEndColor: tab.color } : undefined}
            onClick={() => {
              setActiveTabId(tab.id);
              store.setActiveContainerTab(element.id, tab.id);
            }}
          >
            {getLocalizedText(tab.label, locale, defaultLocale)}
          </button>
        ))}
        <JBButton size="sm" variant="ghost" onClick={() => {
          const id = store.addTab(element.id);
          if (id) setActiveTabId(id);
        }}>+</JBButton>
      </div>
      {activeTab ? (
        <div className={styles.tabPanel} role="tabpanel">
          {activeTab.children.length === 0 ? (
            <div className={styles.tabEmptyDrop} data-drop-active={dragOverIndex === 0} onDragOver={event => markDropTarget(event, 0)} onDrop={event => acceptDrop(event, 0)}>
              Drop form elements into this tab
            </div>
          ) : (
            <ol className={styles.tabChildList}>
              {activeTab.children.map((child, index) => (
                <li key={child.id}>
                  <div className={styles.insertionTarget} data-active={dragOverIndex === index} onDragOver={event => markDropTarget(event, index)} onDrop={event => acceptDrop(event, index)} />
                  <CanvasCard
                    {...props}
                    element={child}
                    index={index}
                    count={activeTab.children.length}
                    onFocusOffset={(currentIndex, offset) => {
                      const target = activeTab.children[Math.max(0, Math.min(currentIndex + offset, activeTab.children.length - 1))];
                      if (target) document.getElementById(`element-select-${target.id}`)?.focus();
                    }}
                  />
                  {index === activeTab.children.length - 1 ? (
                    <div className={styles.insertionTarget} data-active={dragOverIndex === activeTab.children.length} onDragOver={event => markDropTarget(event, activeTab.children.length)} onDrop={event => acceptDrop(event, activeTab.children.length)} />
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
