import { useTranslation } from "react-i18next";
import { useCallback, useEffect, useState, type DragEvent } from "react";
import { getFormElementDisplayName, registryByType, type FormElementRegistryEntry } from "../../component-data";
import { BUILDER_DRAG_END_EVENT, CANVAS_DRAG_TYPE, CATALOG_DRAG_TYPE, endBuilderDrag } from "../builder-drag";
import { useBuilderStore } from "../store/BuilderStoreContext";

interface CanvasInteractionOptions {
  onSelectElement?: (elementId: string) => void;
  onConfigureElement?: (elementId: string) => void;
}

function focusElementCard(elementId: string): void {
  requestAnimationFrame(() => {
    document.getElementById(`element-select-${elementId}`)?.focus();
    document.getElementById(`element-card-${elementId}`)?.scrollIntoView({ block: "nearest" });
  });
}

export function useCanvasInteractions({ onSelectElement, onConfigureElement }: CanvasInteractionOptions) {
  const { t: tCommon } = useTranslation("common");
  const { t, i18n } = useTranslation("formCanvas");
  const store = useBuilderStore();
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [pendingRemovalId, setPendingRemovalId] = useState<string | null>(null);
  const count = store.document.elements.length;
  const pendingRemoval = pendingRemovalId ? store.findElement(pendingRemovalId) : null;
  const pendingRemovalEntry = pendingRemoval ? registryByType.get(pendingRemoval.type) : undefined;

  useEffect(() => {
    const clearDropTarget = () => setDragOverIndex(null);
    window.addEventListener(BUILDER_DRAG_END_EVENT, clearDropTarget);
    return () => window.removeEventListener(BUILDER_DRAG_END_EVENT, clearDropTarget);
  }, []);

  const announcePosition = useCallback(
    (entry: FormElementRegistryEntry, action: string, position: number) => {
      store.announce(`${getFormElementDisplayName(entry, i18n.resolvedLanguage ?? i18n.language)} ${action} ${position} ${tCommon("of")} ${store.document.elements.length}`);
    },
    [i18n, tCommon, store],
  );

  const selectElement = useCallback(
    (elementId: string) => {
      store.selectElement(elementId);
      onSelectElement?.(elementId);
    },
    [onSelectElement, store],
  );

  const configureElement = useCallback(
    (elementId: string) => {
      store.selectElement(elementId);
      onConfigureElement?.(elementId);
      window.setTimeout(() => document.getElementById(`element-name-${elementId}`)?.focus({ preventScroll: false }), 0);
    },
    [onConfigureElement, store],
  );

  const moveElement = useCallback(
    (elementId: string, offset: -1 | 1) => {
      const element = store.findElement(elementId);
      if (!element) return;
      const nextIndex = store.moveElementBy(elementId, offset);
      if (nextIndex === -1) return;
      const entry = registryByType.get(element.type);
      if (entry) announcePosition(entry, t("movedAnnouncement"), nextIndex + 1);
      focusElementCard(elementId);
    },
    [announcePosition, t, store],
  );

  const duplicateElement = useCallback(
    (elementId: string) => {
      const duplicateId = store.duplicateElement(elementId);
      if (!duplicateId) return;
      const duplicate = store.findElement(duplicateId);
      const entry = duplicate ? registryByType.get(duplicate.type) : undefined;
      if (entry) announcePosition(entry, t("duplicatedAnnouncement"), store.getElementPosition(duplicateId) + 1);
      focusElementCard(duplicateId);
    },
    [announcePosition, t, store],
  );

  const confirmRemoval = useCallback(() => {
    if (!pendingRemoval) return;
    const entry = registryByType.get(pendingRemoval.type);
    const nextSelectionId = store.removeElement(pendingRemoval.id);
    setPendingRemovalId(null);
    store.announce(`${entry ? getFormElementDisplayName(entry, i18n.resolvedLanguage ?? i18n.language) : pendingRemoval.type} ${t("removedAnnouncement")}`);
    if (nextSelectionId) focusElementCard(nextSelectionId);
    else requestAnimationFrame(() => document.getElementById("form-canvas-title")?.focus());
  }, [i18n, t, pendingRemoval, store]);

  const cancelRemoval = useCallback(() => {
    const elementId = pendingRemovalId;
    setPendingRemovalId(null);
    requestAnimationFrame(() => elementId && document.getElementById(`element-remove-${elementId}`)?.focus());
  }, [pendingRemovalId]);

  const focusOffset = useCallback(
    (index: number, offset: -1 | 1) => {
      const nextElement = store.document.elements[Math.max(0, Math.min(index + offset, count - 1))];
      if (nextElement) document.getElementById(`element-select-${nextElement.id}`)?.focus();
    },
    [count, store],
  );

  const acceptDrop = useCallback(
    (event: DragEvent, insertionIndex: number) => {
      event.preventDefault();
      endBuilderDrag();
      setDragOverIndex(null);
      const elementType = event.dataTransfer.getData(CATALOG_DRAG_TYPE);
      const registryEntry = registryByType.get(elementType as FormElementRegistryEntry["type"]);
      if (registryEntry) {
        const elementId = store.addElement(registryEntry, insertionIndex);
        announcePosition(registryEntry, tCommon("addedAnnouncement"), store.getElementPosition(elementId) + 1);
        focusElementCard(elementId);
        return;
      }
      const elementId = event.dataTransfer.getData(CANVAS_DRAG_TYPE);
      const element = store.findElement(elementId);
      if (!element) return;
      const nextIndex = store.moveElementToInsertionIndex(elementId, insertionIndex);
      const entry = registryByType.get(element.type);
      if (entry && nextIndex >= 0) {
        announcePosition(entry, t("movedAnnouncement"), nextIndex + 1);
        focusElementCard(elementId);
      }
    },
    [announcePosition, tCommon, t, store],
  );

  const markDropTarget = useCallback((event: DragEvent, insertionIndex: number) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = event.dataTransfer.types.includes(CATALOG_DRAG_TYPE) ? "copy" : "move";
    setDragOverIndex(insertionIndex);
  }, []);

  const cancelDrag = useCallback(() => setDragOverIndex(null), []);

  return {
    dragOverIndex,
    pendingRemoval,
    pendingRemovalEntry,
    selectElement,
    configureElement,
    moveElement,
    duplicateElement,
    confirmRemoval,
    cancelRemoval,
    focusOffset,
    acceptDrop,
    markDropTarget,
    cancelDrag,
    requestRemoval: setPendingRemovalId,
  };
}
