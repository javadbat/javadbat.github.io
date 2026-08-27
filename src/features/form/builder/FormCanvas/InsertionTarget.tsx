import type { DragEventHandler, ReactNode } from "react";
import styles from "./FormCanvas.module.css";

interface InsertionTargetProps {
  active: boolean;
  onDragOver: DragEventHandler<HTMLDivElement>;
  onDrop: DragEventHandler<HTMLDivElement>;
  children: ReactNode;
}

export function InsertionTarget({ active, onDragOver, onDrop, children }: InsertionTargetProps) {
  return (
    <div className={styles.insertionTarget} data-active={active} onDragOver={onDragOver} onDrop={onDrop}>
      <span className={styles.insertionHitArea} aria-hidden="true" />
      <span className={styles.insertionLabel}>{children}</span>
    </div>
  );
}
