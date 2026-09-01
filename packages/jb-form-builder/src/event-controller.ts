import type { FormValues, JBFormBuilderElement, JBFormBuilderEventMap, RendererValueDetail, RuntimeJBForm } from "./types";
import type { RuntimeFormElement } from "./registry/form-element-adapter";

export function dispatchRendererEvent<Name extends keyof JBFormBuilderEventMap>(
  host: JBFormBuilderElement,
  name: Name,
  detail: JBFormBuilderEventMap[Name]["detail"],
  cancelable = false,
): boolean {
  return host.dispatchEvent(
    new CustomEvent(name, {
      bubbles: true,
      composed: true,
      cancelable,
      detail,
    }),
  );
}

export class FormEventController {
  readonly #host: JBFormBuilderElement;
  readonly #form: RuntimeJBForm;
  readonly #getValues: () => FormValues;
  readonly #listeners: Array<{
    name: "input" | "change" | "click";
    listener: EventListener;
  }>;
  constructor(host: JBFormBuilderElement, form: RuntimeJBForm, getValues: () => FormValues) {
    this.#host = host;
    this.#form = form;
    this.#getValues = getValues;
    this.#listeners = [
      { name: "input", listener: this.#forward.bind(this, "input") },
      { name: "change", listener: this.#forward.bind(this, "change") },
      { name: "click", listener: this.#forward.bind(this, "click") },
    ];
  }

  connect(): void {
    // Listeners live on the current jb-form rather than every child. This keeps
    // listener count constant as form size grows.
    for (const { name, listener } of this.#listeners) {
      this.#form.addEventListener(name, listener);
    }
  }

  disconnect(): void {
    for (const { name, listener } of this.#listeners) {
      this.#form.removeEventListener(name, listener);
    }
  }

  #forward(name: "input" | "change" | "click", sourceEvent: Event): void {
    if (name === "click") {
      const button = sourceEvent.target instanceof HTMLElement ? sourceEvent.target.closest<HTMLElement>("jb-button") : null;
      const action = button?.getAttribute("action");
      if (!button || (action !== "next" && action !== "previous" && action !== "custom")) {
        return;
      }
      sourceEvent.stopPropagation();
      const accepted = dispatchRendererEvent(this.#host, "action", {
        action,
        buttonId: button.dataset.formElementId ?? button.id,
        buttonName: button.getAttribute("name") ?? "",
        value: this.#getValues(),
        sourceEvent,
      }, true);
      if (accepted && (action === "next" || action === "previous")) {
        moveWithinTab(button, action === "next" ? 1 : -1);
      }
      return;
    }
    if (name === "change") {
      const fileInput = sourceEvent.target instanceof HTMLElement
        ? sourceEvent.target.closest<RuntimeFormElement>("jb-file-input, jb-image-input")
        : null;
      if (fileInput) {
        this.#handleFileUpload(fileInput);
      }
    }
    // Stop the internal event at the Shadow boundary, then publish one stable,
    // composed host event whose target is always jb-form-builder.
    sourceEvent.stopPropagation();
    const detail: RendererValueDetail = {
      value: this.#getValues(),
      sourceEvent,
    };
    const accepted = dispatchRendererEvent(this.#host, name, detail, sourceEvent.cancelable);
    if (!accepted) {
      sourceEvent.preventDefault();
    }
  }

  #handleFileUpload(elementDom: RuntimeFormElement): void {
    const file = (elementDom as RuntimeFormElement & { value?: unknown }).value;
    if (typeof File === "undefined" || !(file instanceof File)) return;
    const endpoint = elementDom.getAttribute("upload-endpoint")?.trim() ?? "";
    const accepted = dispatchRendererEvent(this.#host, "file-upload", {
      elementDom,
      elementName: elementDom.getAttribute("name") ?? "",
      endpoint,
      fieldName: "file",
    }, true);
    if (accepted && isUploadEndpoint(endpoint)) {
      void uploadFile(elementDom, file, endpoint, "file");
    }
  }
}

function isUploadEndpoint(value: string): boolean {
  try {
    return ["http:", "https:"].includes(new URL(value).protocol);
  } catch {
    return false;
  }
}

function uploadFile(elementDom: RuntimeFormElement, file: File, endpoint: string, fieldName: string): Promise<void> {
  return new Promise(resolve => {
    const uploader = elementDom as RuntimeFormElement & { uploadPercent?: number | null };
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append(fieldName, file);
    elementDom.setAttribute("uploading", "");
    xhr.upload.addEventListener("progress", event => {
      if (event.lengthComputable) uploader.uploadPercent = (event.loaded / event.total) * 100;
    });
    const finish = () => {
      elementDom.removeAttribute("uploading");
      uploader.uploadPercent = null;
      resolve();
    };
    xhr.addEventListener("loadend", finish, { once: true });
    try {
      xhr.open("POST", endpoint);
      xhr.send(formData);
    } catch {
      finish();
    }
  });
}

function moveWithinTab(button: HTMLElement, offset: 1 | -1): void {
  const tab = button.closest<HTMLElement>("jb-tab") as (HTMLElement & { value?: string | null }) | null;
  if (!tab) return;
  const triggers = Array.from(tab.querySelectorAll<HTMLElement>("jb-tab-list > jb-tab-trigger"))
    .filter(trigger => trigger.closest("jb-tab") === tab && !trigger.hasAttribute("disabled"));
  const currentIndex = triggers.findIndex(trigger => trigger.getAttribute("value") === tab.value);
  const nextTrigger = triggers[currentIndex + offset];
  if (nextTrigger) {
    tab.value = nextTrigger.getAttribute("value");
  }
}
