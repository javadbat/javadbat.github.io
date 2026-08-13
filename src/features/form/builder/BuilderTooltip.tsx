import { createElement, type ReactElement, type ReactNode } from "react";
import "@jbui/tooltip";

interface BuilderTooltipProps {
  children: ReactElement;
  content: string;
  positionArea?: "top" | "right" | "bottom" | "left";
}

/**
 * Keeps tooltip usage typed while @jbui/tooltip remains framework-agnostic.
 * The child is the component's focus and pointer trigger.
 */
export function BuilderTooltip({ children, content, positionArea = "top" }: BuilderTooltipProps): ReactNode {
  if (typeof HTMLElement === "undefined" || typeof HTMLElement.prototype.attachInternals !== "function") {
    return children;
  }

  return createElement(
    "jb-tooltip",
    {
      content,
      "position-area": positionArea,
      tail: true,
    },
    children,
  );
}
