import type { RendererState } from "./types";

export class RenderStateController {
  #state: RendererState = "empty";

  constructor(private readonly host: HTMLElement) {}

  get value(): RendererState {
    return this.#state;
  }

  set(value: RendererState): void {
    this.#state = value;
    this.apply();
  }

  private apply(): void {
    // State is reflected as attributes so CSS, automated tests, and assistive
    // tooling can observe it without reaching into private class fields.
    this.host.dataset.state = this.#state;
    const busy = this.#state === "loading";
    this.host.setAttribute("aria-busy", String(busy));
    if (this.#state === "invalid" || this.#state === "error") {
      this.host.setAttribute("aria-invalid", "true");
    } else {
      this.host.removeAttribute("aria-invalid");
    }
  }
}
