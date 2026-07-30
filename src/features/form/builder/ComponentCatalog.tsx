import { memo, useCallback, useMemo, useState, type DragEvent } from "react";
import { JBButton } from "jb-button/react";
import { JBInput } from "jb-input/react";
import { useBuilderStore } from "./BuilderStoreContext";
import { CatalogIcon } from "./CatalogIcon";
import { formElementRegistry, type FormElementRegistryEntry } from "../registry/form-element-registry";
import type { FormMessages } from "../i18n/locale-adapter";
import styles from "./BuilderApp.module.css";
import { CATALOG_DRAG_TYPE } from "./builder-drag";
import 'jb-icons/search'
interface ComponentCatalogProps {
  messages: FormMessages;
}

interface CatalogRowProps {
  entry: FormElementRegistryEntry;
  addLabel: string;
  onAdd: (entry: FormElementRegistryEntry) => void;
}

const CatalogRow = memo(function CatalogRow({ entry, addLabel, onAdd }: CatalogRowProps) {
  return (
    <li
      className={styles.catalogRow}
      draggable
      onDragStart={(event: DragEvent<HTMLLIElement>) => {
        event.dataTransfer.effectAllowed = "copy";
        event.dataTransfer.setData(CATALOG_DRAG_TYPE, entry.type);
      }}
    >
      <span className={styles.iconTile}>
        <CatalogIcon iconId={entry.iconId} />
      </span>
      <span className={styles.catalogCopy}>
        <strong>{entry.displayName}</strong>
        <small>{entry.description}</small>
      </span>
      <JBButton variant="ghost" size="sm" onClick={() => onAdd(entry)} aria-label={`${addLabel} ${entry.displayName}`}>
        {addLabel}
      </JBButton>
    </li>
  );
});

export function ComponentCatalog({ messages }: ComponentCatalogProps) {
  const store = useBuilderStore();
  const [query, setQuery] = useState("");
  const addElement = useCallback(
    (entry: FormElementRegistryEntry) => {
      const elementId = store.addElement(entry);
      const position = store.getElementPosition(elementId) + 1;
      store.announce(`${entry.displayName} ${messages.addedAnnouncement} ${position} ${messages.of} ${store.document.elements.length}`);
      requestAnimationFrame(() => {
        document.getElementById(`element-card-${elementId}`)?.scrollIntoView({ block: "nearest" });
      });
    },
    [messages, store],
  );

  const filteredGroups = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();
    const entries = normalized
      ? formElementRegistry.filter(entry =>
        [entry.displayName, entry.type, entry.category, entry.description, ...entry.keywords].join(" ").toLocaleLowerCase().includes(normalized),
      )
      : formElementRegistry;

    return Map.groupBy(entries, entry => entry.category);
  }, [query]);

  return (
    <aside className={styles.catalog} aria-labelledby="component-catalog-title">
      <div className={styles.panelHeading}>
        <div>
          <p className={styles.eyebrow}>{messages.builder}</p>
          <h2 id="component-catalog-title">{messages.componentCatalog}</h2>
        </div>
        <span className={styles.countBadge}>{formElementRegistry.length}</span>
      </div>
      <p className={styles.panelDescription}>{messages.catalogDescription}</p>

        <div slot="filter" className={styles.searchFilter}>
          <JBInput
            name="componentSearch"
            type="search"
            placeholder={messages.searchComponents}
            value={query}
            onInput={event => setQuery(String((event.target as unknown as { value?: unknown }).value ?? ""))}
          >
            <div slot="end-section"><jb-icon-search/></div>
          </JBInput>
        </div>

      <div className={styles.catalogGroups}>
        {[...filteredGroups.entries()].map(([category, entries]) => (
          <section className={styles.catalogGroup} key={category}>
            <h3>{category}</h3>
            <ul>
              {entries.map(entry => (
                <CatalogRow key={entry.type} entry={entry} addLabel={messages.add} onAdd={addElement} />
              ))}
            </ul>
          </section>
        ))}
      </div>
    </aside>
  );
}
