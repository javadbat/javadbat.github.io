class ArticleExplorerElement extends HTMLElement {
  #search?: HTMLInputElement;
  #items: HTMLElement[] = [];
  #tagButtons: HTMLButtonElement[] = [];
  #pagination?: HTMLElement;
  #status?: HTMLElement;
  #empty?: HTMLElement;
  #activeTag = "all";
  #page = 1;
  #pageSize = 9;

  connectedCallback() {
    this.#search = this.querySelector<HTMLInputElement>("[data-article-search]") ?? undefined;
    this.#items = [...this.querySelectorAll<HTMLElement>("[data-article-item]")];
    this.#tagButtons = [...this.querySelectorAll<HTMLButtonElement>("[data-tag]")];
    this.#pagination = this.querySelector<HTMLElement>("[data-article-pagination]") ?? undefined;
    this.#status = this.querySelector<HTMLElement>("[data-article-status]") ?? undefined;
    this.#empty = this.querySelector<HTMLElement>("[data-article-empty]") ?? undefined;
    this.#pageSize = Number(this.dataset.pageSize) || 9;

    const params = new URLSearchParams(window.location.search);
    const initialQuery = params.get("q") ?? "";
    const initialTag = params.get("tag")?.toLocaleLowerCase() ?? "all";
    const initialPage = Number(params.get("page")) || 1;

    if (this.#search) this.#search.value = initialQuery;
    if (this.#tagButtons.some(({ dataset }) => dataset.tag === initialTag)) this.#activeTag = initialTag;
    this.#page = Math.max(1, initialPage);

    this.#search?.addEventListener("input", this.#onSearch);
    this.#tagButtons.forEach((button) => button.addEventListener("click", this.#onTagClick));
    this.querySelector("[data-clear-articles]")?.addEventListener("click", this.#clear);
    window.addEventListener("popstate", this.#onPopState);
    this.#render(false);
  }

  disconnectedCallback() {
    this.#search?.removeEventListener("input", this.#onSearch);
    this.#tagButtons.forEach((button) => button.removeEventListener("click", this.#onTagClick));
    this.querySelector("[data-clear-articles]")?.removeEventListener("click", this.#clear);
    window.removeEventListener("popstate", this.#onPopState);
  }

  #onSearch = () => {
    this.#page = 1;
    this.#render();
  };

  #onTagClick = (event: Event) => {
    const button = event.currentTarget as HTMLButtonElement;
    this.#activeTag = button.dataset.tag ?? "all";
    this.#page = 1;
    this.#render();
  };

  #clear = () => {
    if (this.#search) this.#search.value = "";
    this.#activeTag = "all";
    this.#page = 1;
    this.#render();
    this.#search?.focus();
  };

  #onPopState = () => {
    const params = new URLSearchParams(window.location.search);
    if (this.#search) this.#search.value = params.get("q") ?? "";
    this.#activeTag = params.get("tag")?.toLocaleLowerCase() ?? "all";
    this.#page = Math.max(1, Number(params.get("page")) || 1);
    this.#render(false);
  };

  #getMatches() {
    const query = this.#search?.value.trim().toLocaleLowerCase() ?? "";
    return this.#items.filter((item) => {
      const matchesQuery = !query || (item.dataset.search ?? "").includes(query);
      const tags = (item.dataset.tags ?? "").split("|");
      const matchesTag = this.#activeTag === "all" || tags.includes(this.#activeTag);
      return matchesQuery && matchesTag;
    });
  }

  #render(updateUrl = true) {
    const matches = this.#getMatches();
    const totalPages = Math.max(1, Math.ceil(matches.length / this.#pageSize));
    this.#page = Math.min(this.#page, totalPages);
    const start = (this.#page - 1) * this.#pageSize;
    const visible = new Set(matches.slice(start, start + this.#pageSize));

    this.#items.forEach((item) => {
      item.hidden = !visible.has(item);
    });

    this.#tagButtons.forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.tag === this.#activeTag));
    });

    if (this.#status) {
      this.#status.textContent = `${matches.length} article${matches.length === 1 ? "" : "s"}`;
    }
    if (this.#empty) this.#empty.hidden = matches.length > 0;
    this.#renderPagination(totalPages, matches.length);
    if (updateUrl) this.#updateUrl();
  }

  #renderPagination(totalPages: number, resultCount: number) {
    if (!this.#pagination) return;
    this.#pagination.replaceChildren();
    this.#pagination.hidden = totalPages <= 1 || resultCount === 0;
    if (this.#pagination.hidden) return;

    const previous = this.#paginationButton("Previous", this.#page - 1, this.#page === 1);
    this.#pagination.append(previous);

    for (let page = 1; page <= totalPages; page += 1) {
      const button = this.#paginationButton(String(page), page, false);
      if (page === this.#page) button.setAttribute("aria-current", "page");
      this.#pagination.append(button);
    }

    this.#pagination.append(this.#paginationButton("Next", this.#page + 1, this.#page === totalPages));
  }

  #paginationButton(label: string, page: number, disabled: boolean) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = label;
    button.disabled = disabled;
    button.addEventListener("click", () => {
      this.#page = page;
      this.#render();
      this.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    return button;
  }

  #updateUrl() {
    const params = new URLSearchParams();
    const query = this.#search?.value.trim() ?? "";
    if (query) params.set("q", query);
    if (this.#activeTag !== "all") params.set("tag", this.#activeTag);
    if (this.#page > 1) params.set("page", String(this.#page));
    const queryString = params.toString();
    history.replaceState(null, "", queryString ? `${location.pathname}?${queryString}` : location.pathname);
  }
}

if (!customElements.get("article-explorer")) {
  customElements.define("article-explorer", ArticleExplorerElement);
}
