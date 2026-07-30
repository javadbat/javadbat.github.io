import type { HTMLAttributes } from "react";

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "jb-icon-triangle": HTMLAttributes<HTMLElement> & {
        class?: string;
        direction?: "up" | "right" | "down" | "inline-start" | "inline-end";
        size?: "xs" | "sm" | "md" | "lg" | "xl";
      };
    }
  }
}
