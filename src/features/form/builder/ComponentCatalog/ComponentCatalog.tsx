import { memo, useCallback, useMemo, useState, type DragEvent } from "react";
import { JBButton } from "jb-button/react";
import { JBInput } from "jb-input/react";
import { useBuilderStore } from "../store/BuilderStoreContext";
import { CatalogIcon } from "../CatalogIcon/CatalogIcon";
import { formElementRegistry, getFormElementDisplayName, type FormElementRegistryEntry } from "../../registry/form-element-registry";
import type { FormMessages } from "../../i18n/locale-adapter";
import styles from "./ComponentCatalog.module.css";
import { CATALOG_DRAG_TYPE } from "../builder-drag";
import "jb-icons/search"
interface ComponentCatalogProps {
  messages: FormMessages;
  onElementAdded?: (elementId: string) => void;
}

interface CatalogRowProps {
  entry: FormElementRegistryEntry;
  displayName: string;
  addLabel: string;
  onAdd: (entry: FormElementRegistryEntry) => void;
}

const CatalogRow = memo(function CatalogRow({ entry, displayName, addLabel, onAdd }: CatalogRowProps) {
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
        <strong>{displayName}</strong>
        <small>{entry.description}</small>
      </span>
      <JBButton variant="ghost" size="sm" onClick={() => onAdd(entry)} aria-label={`${addLabel} ${displayName}`}>
        {addLabel}
      </JBButton>
    </li>
  );
});

export function ComponentCatalog({ messages, onElementAdded }: ComponentCatalogProps) {
  const store = useBuilderStore();
  const [query, setQuery] = useState("");
  const addElement = useCallback(
    (entry: FormElementRegistryEntry) => {
      const elementId = store.addElement(entry);
      const position = store.getElementPosition(elementId) + 1;
      store.announce(`${getFormElementDisplayName(entry, store.editingLocale)} ${messages.addedAnnouncement} ${position} ${messages.of} ${store.document.elements.length}`);
      onElementAdded?.(elementId);
      requestAnimationFrame(() => {
        document.getElementById(`element-card-${elementId}`)?.scrollIntoView({ block: "nearest" });
      });
    },
    [messages, onElementAdded, store],
  );

  const filteredGroups = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();
    const entries = normalized
      ? formElementRegistry.filter(entry =>
          [entry.displayName, getFormElementDisplayName(entry, store.editingLocale), entry.type, entry.category, entry.description, ...entry.keywords]
            .join(" ")
            .toLocaleLowerCase()
            .includes(normalized),
        )
      : formElementRegistry;

    return Map.groupBy(entries, entry => entry.category);
  }, [query, store.editingLocale]);

  return (
    <aside className={styles.catalog} data-builder-panel="catalog" aria-labelledby="component-catalog-title">
      <div className={styles.panelHeading}>
        <div>
          <p className={styles.eyebrow}>{messages.builder}</p>
          <h2 id="component-catalog-title">{messages.componentCatalog}</h2>
        </div>
        <span className={styles.countBadge}>{formElementRegistry.length}</span>
      </div>
      <p className={styles.panelDescription}>{messages.catalogDescription}</p>
      <JBInput
        name="componentSearch"
        type="search"
        placeholder={messages.searchComponents}
        value={query}
        size="sm"
        className={styles.searchInput}
        onInput={event => setQuery(String((event.target as unknown as { value?: unknown }).value ?? ""))}
      >
        <jb-icon-search slot="end-section" className={styles.searchIcon}/>
        </JBInput>

      <div className={styles.catalogGroups}>
        {[...filteredGroups.entries()].map(([category, entries]) => (
          <section className={styles.catalogGroup} key={category}>
            <h3>{category}</h3>
            <ul>
              {entries.map(entry => (
                <CatalogRow key={entry.type} entry={entry} displayName={getFormElementDisplayName(entry, store.editingLocale)} addLabel={messages.add} onAdd={addElement} />
              ))}
            </ul>
          </section>
        ))}
      </div>
    </aside>
  );
}
