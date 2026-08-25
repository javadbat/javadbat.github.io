class ArticleCodeCopyElement extends HTMLElement {
  #button?: HTMLButtonElement;
  #handleCopy = async () => {
    const code = this.querySelector("pre code")?.textContent ?? "";
    const status = this.querySelector<HTMLElement>("[data-copy-status]");

    try {
      await navigator.clipboard.writeText(code);
      if (this.#button) this.#button.textContent = "Copied";
      if (status) status.textContent = "Code copied to clipboard";
    } catch {
      if (status) status.textContent = "Could not copy code";
      return;
    }

    window.setTimeout(() => {
      if (this.#button) this.#button.textContent = "Copy";
      if (status) status.textContent = "";
    }, 1800);
  };

  connectedCallback() {
    this.#button = this.querySelector<HTMLButtonElement>("[data-copy-code]") ?? undefined;
    this.#button?.addEventListener("click", this.#handleCopy);
  }

  disconnectedCallback() {
    this.#button?.removeEventListener("click", this.#handleCopy);
  }
}

class ArticleCodeEnhancerElement extends HTMLElement {
  connectedCallback() {
    const codeBlocks = [...this.querySelectorAll("pre")].filter((pre) => !pre.closest("article-code-copy"));

    for (const pre of codeBlocks) {
      const wrapper = document.createElement("article-code-copy");
      wrapper.className = "article-code-shell article-code-shell-generated";

      const toolbar = document.createElement("div");
      toolbar.className = "article-code-toolbar";
      toolbar.innerHTML = '<span>Code</span><div class="article-code-actions"><button type="button" data-copy-code>Copy</button></div>';

      const status = document.createElement("span");
      status.className = "sr-only";
      status.dataset.copyStatus = "";
      status.setAttribute("aria-live", "polite");

      wrapper.append(toolbar, pre.cloneNode(true), status);
      pre.replaceWith(wrapper);
    }
  }
}

if (!customElements.get("article-code-copy")) {
  customElements.define("article-code-copy", ArticleCodeCopyElement);
}

if (!customElements.get("article-code-enhancer")) {
  customElements.define("article-code-enhancer", ArticleCodeEnhancerElement);
}
