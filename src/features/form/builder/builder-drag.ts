export const CATALOG_DRAG_TYPE = "application/x-jb-form-element-type";
export const CANVAS_DRAG_TYPE = "application/x-jb-form-element-id";
export const BUILDER_DRAG_END_EVENT = "jb-form-builder-drag-end";

export function beginBuilderDrag(dataTransfer: DataTransfer, source: HTMLElement, previewClassName: string, removeSelectors: string[] = []): void {
  document.body.dataset.formBuilderDragging = "true";
  const sourceBounds = source.getBoundingClientRect();
  const preview = source.cloneNode(true) as HTMLElement;
  preview.removeAttribute("id");
  preview.querySelectorAll<HTMLElement>("[id]").forEach(element => element.removeAttribute("id"));
  for (const selector of removeSelectors) preview.querySelectorAll(selector).forEach(element => element.remove());
  preview.classList.add(previewClassName);
  preview.style.inlineSize = `${Math.min(sourceBounds.width, 448)}px`;
  preview.setAttribute("aria-hidden", "true");
  document.body.append(preview);

  const bounds = preview.getBoundingClientRect();
  dataTransfer.setDragImage(preview, Math.min(32, bounds.width / 2), Math.max(18, bounds.height / 2));
  requestAnimationFrame(() => preview.remove());
}

export function endBuilderDrag(): void {
  delete document.body.dataset.formBuilderDragging;
  window.dispatchEvent(new CustomEvent(BUILDER_DRAG_END_EVENT));
}
