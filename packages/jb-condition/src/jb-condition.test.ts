// @vitest-environment happy-dom

import { beforeAll, describe, expect, it } from "vitest";
import { JBConditionWebComponent } from "./jb-condition";

beforeAll(() => {
  if (!customElements.get("jb-condition-test")) customElements.define("jb-condition-test", class extends JBConditionWebComponent {});
});

describe("JBConditionWebComponent", () => {
  it("detaches unmatched content and restores the same node with its value", async () => {
    const condition = document.createElement("jb-condition-test") as JBConditionWebComponent;
    const input = document.createElement("input");
    input.value = "preserved";
    condition.append(input);
    condition.conditions = { match: "all", rules: [{ id: "rule", fieldName: "show", operator: "equals", value: true }] };
    condition.value = { show: false };
    document.body.append(condition);
    expect(condition.childNodes).toHaveLength(0);
    condition.value = { show: true };
    expect(condition.firstChild).toBe(input);
    expect(input.value).toBe("preserved");
    condition.remove();
  });
});
