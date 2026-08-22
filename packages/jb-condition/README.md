# jb-condition

`<jb-condition>` conditionally connects its slotted content from a supplied value object. Unmatched nodes are retained in a `DocumentFragment`, so they do not participate in an owning form while their runtime state is preserved.

```js
import "jb-condition";

const condition = document.querySelector("jb-condition");
condition.conditions = {
  match: "all",
  rules: [{ id: "adult", fieldName: "age", operator: "greaterThanOrEqual", value: 18 }],
};
condition.value = { age: 20 };
```

The package has no dependency on `jb-form` or any framework. It also exports `evaluateConditions` for non-DOM use.
