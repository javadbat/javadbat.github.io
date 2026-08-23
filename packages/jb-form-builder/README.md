# jb-form-builder

`<jb-form-builder>` renders a portable version-1 JB form document into a runtime `jb-form`. It is framework-independent by default and provides an optional React wrapper.

```ts
import "jb-form-builder";
import { loadDependencies } from "jb-form-builder/dependency-loader";

const renderer = document.querySelector("jb-form-builder");
renderer.loadDependencies = loadDependencies;
renderer.formDocument = formDocument;
```

Use `jb-form-builder/define` for explicit, idempotent custom-element registration and `jb-form-builder/react` for the React component. The portable document types are exported from `jb-form-builder/contract`.

The renderer is route- and storage-agnostic. It discovers the controls used by a document and can lazy-load their JB packages through the supplied dependency loader.
