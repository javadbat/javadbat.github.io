class ArticleTocElement extends HTMLElement {
  #headings: HTMLElement[] = [];
  #links: HTMLAnchorElement[] = [];
  #progress?: HTMLElement;

  connectedCallback() {
    this.#links = [...this.querySelectorAll<HTMLAnchorElement>("[data-toc-link]")];
    this.#headings = this.#links
      .map((link) => document.getElementById(decodeURIComponent(link.hash.slice(1))))
      .filter((heading): heading is HTMLElement => Boolean(heading));
    this.#headings.forEach((heading) => heading.setAttribute("tabindex", "-1"));
    this.#progress = this.querySelector<HTMLElement>("[data-reading-progress]") ?? undefined;

    this.#links.forEach((link) => link.addEventListener("click", this.#onLinkClick));
    window.addEventListener("scroll", this.#onScroll, { passive: true });
    window.addEventListener("resize", this.#updateProgress);

    const initialId = decodeURIComponent(window.location.hash.slice(1));
    this.#setActive(this.#headings.some(({ id }) => id === initialId) ? initialId : this.#headings[0]?.id ?? "");
    this.#updateActive();
    this.#updateProgress();
  }

  disconnectedCallback() {
    this.#links.forEach((link) => link.removeEventListener("click", this.#onLinkClick));
    window.removeEventListener("scroll", this.#onScroll);
    window.removeEventListener("resize", this.#updateProgress);
  }

  #onLinkClick = (event: Event) => {
    const link = event.currentTarget as HTMLAnchorElement;
    const target = document.getElementById(decodeURIComponent(link.hash.slice(1)));
    if (!target) return;
    event.preventDefault();
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    history.pushState(null, "", link.hash);
    this.#setActive(target.id);
    target.focus({ preventScroll: true });
  };

  #setActive(id: string) {
    this.#links.forEach((link) => {
      if (decodeURIComponent(link.hash.slice(1)) === id) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    });
  }

  #updateActive = () => {
    const current = [...this.#headings].reverse().find((heading) => heading.getBoundingClientRect().top <= 160);
    this.#setActive((current ?? this.#headings[0])?.id ?? "");
  };

  #onScroll = () => {
    this.#updateActive();
    this.#updateProgress();
  };

  #updateProgress = () => {
    const article = this.querySelector<HTMLElement>("#article-content");
    if (!article || !this.#progress) return;
    const start = article.offsetTop;
    const distance = Math.max(1, article.offsetHeight - window.innerHeight * 0.55);
    const progress = Math.min(1, Math.max(0, (window.scrollY - start) / distance));
    this.#progress.style.transform = `scaleX(${progress})`;
  };
}

if (!customElements.get("article-toc")) {
  customElements.define("article-toc", ArticleTocElement);
}
