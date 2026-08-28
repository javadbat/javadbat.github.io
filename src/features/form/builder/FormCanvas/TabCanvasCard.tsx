import { useEffect, useState, type DragEvent, type KeyboardEvent } from "react";
import { observer } from "mobx-react-lite";
import { JBButton } from "jb-button/react";
import { getLocalizedText, type JBTabElementV1 } from "../../domain/form-document";
import { registryByType } from "jb-form-builder/registry/form-element-registry";
import { BUILDER_DRAG_END_EVENT, CANVAS_DRAG_TYPE, CATALOG_DRAG_TYPE, endBuilderDrag } from "../builder-drag";
import { useBuilderStore } from "../store/BuilderStoreContext";
import { CatalogIcon } from "../CatalogIcon/CatalogIcon";
import { CanvasCard, type CanvasCardProps } from "./CanvasCard";
import styles from "./FormCanvas.module.css";
import { InsertionTarget } from "./InsertionTarget";

interface TabCanvasCardProps extends Omit<CanvasCardProps, "element"> {
  element: JBTabElementV1;
}

function focusTabEditorRow(tabId: string): void {
  // Let selection and responsive panel changes render before moving focus.
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      const editorRow = document.getElementById(`tab-editor-${tabId}`);
      if (!editorRow) return;
      editorRow.focus({ preventScroll: true });
      editorRow.scrollIntoView?.({ behavior: "smooth", block: "nearest", inline: "nearest" });
    });
  });
}

export const TabCanvasCard = observer(function TabCanvasCard(props: TabCanvasCardProps) {
  const { element, locale, defaultLocale, messages } = props;
  const store = useBuilderStore();
  const initialTab = element.tabs.find(tab => tab.value === element.props.defaultValue && !tab.disabled) ?? element.tabs.find(tab => !tab.disabled) ?? element.tabs[0];
  const [activeTabId, setActiveTabId] = useState(initialTab?.id ?? "");
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const activeTab = element.tabs.find(tab => tab.id === activeTabId) ?? initialTab;

  useEffect(() => {
    const clearDropTarget = () => setDragOverIndex(null);
    window.addEventListener(BUILDER_DRAG_END_EVENT, clearDropTarget);
    return () => window.removeEventListener(BUILDER_DRAG_END_EVENT, clearDropTarget);
  }, []);

  const activateTab = (tabId: string) => {
    setActiveTabId(tabId);
    store.setActiveContainerTab(element.id, tabId);
    props.onConfigure(element.id);
    focusTabEditorRow(tabId);
  };

  const handleTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>, tabIndex: number) => {
    const enabledTabs = element.tabs.filter(tab => !tab.disabled);
    if (enabledTabs.length < 2) return;

    const direction = getComputedStyle(event.currentTarget).direction;
    const offset = direction === "rtl"
      ? event.key === "ArrowRight" ? -1 : 1
      : event.key === "ArrowRight" ? 1 : -1;
    const currentEnabledIndex = enabledTabs.findIndex(tab => tab.id === element.tabs[tabIndex]?.id);
    let nextIndex = currentEnabledIndex;
    if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = enabledTabs.length - 1;
    else if (event.key === "ArrowLeft" || event.key === "ArrowRight") nextIndex = (currentEnabledIndex + offset + enabledTabs.length) % enabledTabs.length;
    else return;

    event.preventDefault();
    const nextTab = enabledTabs[nextIndex];
    activateTab(nextTab.id);
    requestAnimationFrame(() => document.getElementById(`builder-tab-trigger-${nextTab.id}`)?.focus());
  };

  useEffect(() => {
    if (!element.tabs.some(tab => tab.id === activeTabId && !tab.disabled)) setActiveTabId(initialTab?.id ?? "");
  }, [activeTabId, element.tabs, initialTab?.id]);

  const acceptDrop = (event: DragEvent, insertionIndex: number) => {
    event.preventDefault();
    endBuilderDrag();
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
        {element.tabs.map((tab, tabIndex) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            id={`builder-tab-trigger-${tab.id}`}
            aria-selected={tab.id === activeTab?.id}
            aria-controls={`builder-tab-panel-${tab.id}`}
            tabIndex={tab.id === activeTab?.id ? 0 : -1}
            disabled={tab.disabled}
            className={styles.builderTabTrigger}
            data-active={tab.id === activeTab?.id}
            style={tab.color ? { borderBlockEndColor: tab.color } : undefined}
            onClick={() => activateTab(tab.id)}
            onKeyDown={event => handleTabKeyDown(event, tabIndex)}
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
        <div
          className={styles.tabPanel}
          id={`builder-tab-panel-${activeTab.id}`}
          role="tabpanel"
          aria-labelledby={`builder-tab-trigger-${activeTab.id}`}
          tabIndex={0}
        >
          {activeTab.children.length === 0 ? (
            <div className={styles.tabEmptyDrop} data-drop-active={dragOverIndex === 0} onDragOver={event => markDropTarget(event, 0)} onDrop={event => acceptDrop(event, 0)}>
              Drop form elements into this tab
            </div>
          ) : (
            <ol className={styles.tabChildList}>
              {activeTab.children.map((child, index) => (
                <li key={child.id}>
                  <InsertionTarget active={dragOverIndex === index} onDragOver={event => markDropTarget(event, index)} onDrop={event => acceptDrop(event, index)}><CatalogIcon iconId="drop" />{messages.dropHere}</InsertionTarget>
                  <CanvasCard
                    {...props}
                    element={child}
                    index={index}
                    count={activeTab.children.length}
                    isSelected={child.id === store.selectedElementId}
                    onFocusOffset={(currentIndex, offset) => {
                      const target = activeTab.children[Math.max(0, Math.min(currentIndex + offset, activeTab.children.length - 1))];
                      if (target) document.getElementById(`element-select-${target.id}`)?.focus();
                    }}
                  />
                  {index === activeTab.children.length - 1 ? (
                    <InsertionTarget active={dragOverIndex === activeTab.children.length} onDragOver={event => markDropTarget(event, activeTab.children.length)} onDrop={event => acceptDrop(event, activeTab.children.length)}><CatalogIcon iconId="drop" />{messages.dropHere}</InsertionTarget>
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
