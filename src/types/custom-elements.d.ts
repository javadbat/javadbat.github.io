import type { HTMLAttributes } from "react";

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "jb-form-delete": HTMLAttributes<HTMLElement> & {
        "form-id"?: string;
        label?: string;
      };
    }
  }
}
