import { useCallback, useState, type DragEvent } from "react";
import type { FormMessages } from "../../i18n/locale-adapter";
import { getFormElementDisplayName, registryByType, type FormElementRegistryEntry } from "../../registry/form-element-registry";
import { CANVAS_DRAG_TYPE, CATALOG_DRAG_TYPE } from "../builder-drag";
import { useBuilderStore } from "../store/BuilderStoreContext";

interface CanvasInteractionOptions {
  messages: FormMessages;
  onSelectElement?: (elementId: string) => void;
  onConfigureElement?: (elementId: string) => void;
}

function focusElementCard(elementId: string): void {
  requestAnimationFrame(() => {
    document.getElementById(`element-select-${elementId}`)?.focus();
    document.getElementById(`element-card-${elementId}`)?.scrollIntoView({ block: "nearest" });
  });
}

export function useCanvasInteractions({ messages, onSelectElement, onConfigureElement }: CanvasInteractionOptions) {
  const store = useBuilderStore();
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [pendingRemovalId, setPendingRemovalId] = useState<string | null>(null);
  const count = store.document.elements.length;
  const pendingRemoval = pendingRemovalId ? (store.document.elements.find(element => element.id === pendingRemovalId) ?? null) : null;
  const pendingRemovalEntry = pendingRemoval ? registryByType.get(pendingRemoval.type) : undefined;

  const announcePosition = useCallback(
    (entry: FormElementRegistryEntry, action: string, position: number) => {
      store.announce(`${getFormElementDisplayName(entry, store.editingLocale)} ${action} ${position} ${messages.of} ${store.document.elements.length}`);
    },
    [messages.of, store],
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
      const element = store.document.elements.find(candidate => candidate.id === elementId);
      if (!element) return;
      const nextIndex = store.moveElementBy(elementId, offset);
      if (nextIndex === -1) return;
      const entry = registryByType.get(element.type);
      if (entry) announcePosition(entry, messages.movedAnnouncement, nextIndex + 1);
      focusElementCard(elementId);
    },
    [announcePosition, messages.movedAnnouncement, store],
  );

  const duplicateElement = useCallback(
    (elementId: string) => {
      const duplicateId = store.duplicateElement(elementId);
      if (!duplicateId) return;
      const duplicate = store.document.elements.find(element => element.id === duplicateId);
      const entry = duplicate ? registryByType.get(duplicate.type) : undefined;
      if (entry) announcePosition(entry, messages.duplicatedAnnouncement, store.getElementPosition(duplicateId) + 1);
      focusElementCard(duplicateId);
    },
    [announcePosition, messages.duplicatedAnnouncement, store],
  );

  const confirmRemoval = useCallback(() => {
    if (!pendingRemoval) return;
    const entry = registryByType.get(pendingRemoval.type);
    const nextSelectionId = store.removeElement(pendingRemoval.id);
    setPendingRemovalId(null);
    store.announce(`${entry ? getFormElementDisplayName(entry, store.editingLocale) : pendingRemoval.type} ${messages.removedAnnouncement}`);
    if (nextSelectionId) focusElementCard(nextSelectionId);
    else requestAnimationFrame(() => document.getElementById("form-canvas-title")?.focus());
  }, [messages.removedAnnouncement, pendingRemoval, store]);

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
      if (!element) return;
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
