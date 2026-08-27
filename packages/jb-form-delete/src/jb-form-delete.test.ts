// @vitest-environment happy-dom

import { beforeEach, describe, expect, it } from "vitest";
import { JBFormDeleteWebComponent, defineJBFormDelete } from "./jb-form-delete";

describe("jb-form-delete", () => {
  beforeEach(() => {
    defineJBFormDelete();
    document.body.innerHTML = "";
  });

  it("emits an accessible delete request for the host to confirm", () => {
    const element = document.createElement("jb-form-delete") as JBFormDeleteWebComponent;
    element.setAttribute("form-id", "form-1");
    element.setAttribute("label", "Delete exam");
    const requests: unknown[] = [];
    element.addEventListener("delete-request", event => requests.push((event as CustomEvent).detail));
    document.body.append(element);
    (element.shadowRoot?.querySelector("button") as HTMLButtonElement).click();
    expect(requests).toEqual([{ formId: "form-1" }]);
    expect(element.shadowRoot?.querySelector("button")?.getAttribute("aria-label")).toBe("Delete exam");
  });

  it("disables itself until a form id exists", () => {
    const element = document.createElement("jb-form-delete");
    document.body.append(element);
    expect((element.shadowRoot?.querySelector("button") as HTMLButtonElement).disabled).toBe(true);
  });
});
