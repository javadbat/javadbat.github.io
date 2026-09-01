# jb-form-builder

`jb-form-builder` is a framework-independent web component that renders a portable JB Form Document v1 into a live `jb-form`. It owns rendering, validation wiring, value access, locale handling, and event forwarding. Persistence, routing, authentication, and server-side submission remain the responsibility of the host application.

## Install

```bash
npm install jb-form-builder
```

## Vanilla JavaScript

```ts
import "jb-form-builder";
import { loadDependencies } from "jb-form-builder/dependency-loader";

const builder = document.querySelector("jb-form-builder");
builder.loadDependencies = loadDependencies;
builder.formDocument = documentValue;
```

The default entry registers `<jb-form-builder>`. For explicit registration, use `jb-form-builder/define`:

```ts
import { defineJBFormBuilder } from "jb-form-builder/define";

defineJBFormBuilder();
```

## React

```tsx
import { JBFormBuilder, loadDependencies } from "jb-form-builder/react";

export function FormPreview({ documentValue }) {
  return (
    <JBFormBuilder
      formDocument={documentValue}
      loadDependencies={loadDependencies}
      locale="en"
      onSubmitValue={event => console.log(event.detail.value)}
      onFileUpload={event => {
        // Call preventDefault() to replace the built-in uploader.
        console.log(event.detail.endpoint);
      }}
    />
  );
}
```

## Form document

Documents are JSON-compatible version-1 values. The portable TypeScript contract and helpers are exported from `jb-form-builder/contract`:

```ts
import { createEmptyFormDocument } from "jb-form-builder/contract";

const documentValue = createEmptyFormDocument();
documentValue.elements = [
  {
    id: crypto.randomUUID(),
    type: "jb-input",
    adapterVersion: 1,
    name: "email",
    label: { translations: { en: "Email address" } },
    props: { type: "email" },
    validation: [],
  },
];
```

## Dependency loading

The renderer discovers the controls referenced by the document. The built-in loader dynamically imports and registers the required JB packages:

```ts
builder.loadDependencies = loadDependencies;
```

If `loadDependencies` is omitted, no package imports are performed and missing controls are reported. Applications that own package versions or use a CDN may provide a custom dependency loader.

## Values and validation

```ts
const values = builder.getFormValues();
builder.setFormValues({ email: "person@example.com" });

const valid = builder.checkValidity();
const validAsync = await builder.checkValidityAsync(true);
builder.reset();
```

File fields contain runtime `File` objects and are not JSON-serializable.

## Events

The builder emits lifecycle events (`ready`, `document-invalid`, `render-error`, and `dependencies-required`) and forwards form events (`input`, `change`, `action`, `reset`, and `submit`). Events are composed and bubble.

```ts
builder.addEventListener("submit", event => {
  console.log(event.detail.value);
});
```

The complete event typing is available through `JBFormBuilderEventMap` from the package root.

## File and image upload integration

Set either a file or image element's optional `uploadEndpoint` property. An empty endpoint selects the value locally and performs no upload. Image inputs keep their preview behavior while exposing the selected `File` through `value`, just like file inputs.

When a file is selected, the builder emits a cancelable `file-upload` event:

```ts
builder.addEventListener("file-upload", event => {
  const { elementDom, elementName, endpoint, fieldName } = event.detail;
  console.log(elementDom, elementName, endpoint, fieldName); // fieldName: "file"
});
```

Call `event.preventDefault()` to own the upload. Otherwise, for a valid `http:` or `https:` endpoint, the default uploader uses `XMLHttpRequest` to send a `POST` `multipart/form-data` request with the selected file under the field name `file`. Upload progress is reflected through the file input's `uploading` attribute and `uploadPercent` property.

The default uploader does not interpret the server response. Authentication, retries, response parsing, and uploaded-file URL handling belong to the host application.

## Locale and theme

```ts
builder.locale = "fa";
builder.themeConfig = themeConfig;
```

The renderer uses the document's default locale unless `locale` is supplied. Theme helpers are exported from `jb-form-builder/contract/theme`.

## Package entry points

- `jb-form-builder` — web component, default loader, public types, and theme helpers
- `jb-form-builder/react` — React wrapper
- `jb-form-builder/define` — explicit registration
- `jb-form-builder/dependency-loader` — lazy dependency loader
- `jb-form-builder/contract` — form document contract and helpers
- `jb-form-builder/contract/validation` — document validation helpers
- `jb-form-builder/contract/theme` — theme configuration helpers
