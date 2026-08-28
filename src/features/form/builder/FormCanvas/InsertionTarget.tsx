import type { DragEventHandler, ReactNode } from "react";
import styles from "./FormCanvas.module.css";

/** Shared drop-zone state and behavior for root and nested canvas collections. */
interface InsertionTargetProps {
  /** Whether current drag coordinates target this insertion position. */
  active: boolean;
  /** Handler that evaluates and enables compatible drag payloads. */
  onDragOver: DragEventHandler<HTMLDivElement>;
  /** Handler that commits the catalog insertion or element move. */
  onDrop: DragEventHandler<HTMLDivElement>;
  /** Localized insertion-position label. */
  children: ReactNode;
}

/** Renders a consistent accessible insertion target between canvas elements. */
export function InsertionTarget({ active, onDragOver, onDrop, children }: InsertionTargetProps) {
  return (
    <div className={styles.insertionTarget} data-active={active} onDragOver={onDragOver} onDrop={onDrop}>
      <span className={styles.insertionHitArea} aria-hidden="true" />
      <span className={styles.insertionLabel}>{children}</span>
    </div>
  );
}
