/** Drag payload key for creating a catalog element on the canvas. */
export const CATALOG_DRAG_TYPE = "application/x-jb-form-element-type";
/** Drag payload key for moving an existing canvas element. */
export const CANVAS_DRAG_TYPE = "application/x-jb-form-element-id";
/** Cross-component event announcing that any builder drag session has ended. */
export const BUILDER_DRAG_END_EVENT = "jb-form-builder-drag-end";

/**
 * Starts shared builder drag feedback by marking global drag state and creating
 * a bounded, accessibility-hidden preview from the business item being moved.
 */
export function beginBuilderDrag(dataTransfer: DataTransfer, source: HTMLElement, previewClassName: string, removeSelectors: string[] = []): void {
  document.body.dataset.formBuilderDragging = "true";
  /** Bounds of the source card used to keep the preview visually proportional. */
  const sourceBounds = source.getBoundingClientRect();
  /** Temporary visual representation supplied to the browser drag operation. */
  const preview = source.cloneNode(true) as HTMLElement;
  preview.removeAttribute("id");
  preview.querySelectorAll<HTMLElement>("[id]").forEach(element => element.removeAttribute("id"));
  for (const selector of removeSelectors) preview.querySelectorAll(selector).forEach(element => element.remove());
  preview.classList.add(previewClassName);
  preview.style.inlineSize = `${Math.min(sourceBounds.width, 448)}px`;
  preview.setAttribute("aria-hidden", "true");
  document.body.append(preview);

  /** Rendered preview bounds used to position the pointer hotspot. */
  const bounds = preview.getBoundingClientRect();
  dataTransfer.setDragImage(preview, Math.min(32, bounds.width / 2), Math.max(18, bounds.height / 2));
  requestAnimationFrame(() => preview.remove());
}

/** Clears shared drag state and tells all canvas insertion targets to reset. */
export function endBuilderDrag(): void {
  delete document.body.dataset.formBuilderDragging;
  window.dispatchEvent(new CustomEvent(BUILDER_DRAG_END_EVENT));
}
