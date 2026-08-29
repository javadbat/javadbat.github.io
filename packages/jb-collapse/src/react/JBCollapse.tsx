import {
  createElement,
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  type HTMLAttributes,
  type PropsWithChildren,
  type ReactElement,
  type ReactNode,
} from "react";
import { defineJBCollapse } from "../define.js";
import type { JBCollapseWebComponent } from "../jb-collapse.js";
import type { JBCollapseChangeEvent, JBCollapseVariant } from "../types.js";

defineJBCollapse();

interface JBCollapseOwnProps {
  title: ReactNode;
  defaultOpen?: boolean;
  open?: boolean;
  variant?: JBCollapseVariant;
  onOpenChange?: (open: boolean, event: JBCollapseChangeEvent) => void;
}

export type JBCollapseProps = PropsWithChildren<JBCollapseOwnProps> &
  Omit<HTMLAttributes<HTMLElement>, keyof JBCollapseOwnProps | "children">;

export const JBCollapse = forwardRef<JBCollapseWebComponent, JBCollapseProps>(function JBCollapse(
  { title, children, defaultOpen = false, open, variant = "card", onOpenChange, ...hostAttributes },
  forwardedRef,
): ReactElement {
  const element = useRef<JBCollapseWebComponent | null>(null);

  useImperativeHandle(forwardedRef, () => element.current as JBCollapseWebComponent, []);

  useEffect(() => {
    const current = element.current;
    if (!current || open === undefined) return;
    current.open = open;
  }, [open]);

  useEffect(() => {
    const current = element.current;
    if (!current || !onOpenChange) return;
    const listener = (event: Event) => {
      const collapseEvent = event as JBCollapseChangeEvent;
      onOpenChange(collapseEvent.detail.open, collapseEvent);
    };
    current.addEventListener("collapse-change", listener);
    return () => current.removeEventListener("collapse-change", listener);
  }, [onOpenChange]);

  return createElement(
    "jb-collapse",
    { ...hostAttributes, ref: element, defaultOpen, variant },
    createElement("span", { slot: "title" }, title),
    children,
  );
});
