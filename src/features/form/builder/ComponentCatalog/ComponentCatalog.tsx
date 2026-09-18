import { memo, useCallback, useMemo, useState, type DragEvent } from "react";
import { observer } from "mobx-react-lite";
import { JBButton } from "jb-button/react";
import { JBInput } from "jb-input/react";
import { useBuilderStore } from "../store/BuilderStoreContext";
import { CatalogIcon } from "../CatalogIcon/CatalogIcon";
import { getFormElementDescription, getFormElementDisplayName, type FormElementRegistryEntry } from "../../component-data";
import { supportedComponentData } from "../../component-data";
import type { FormMessages } from "../../i18n/locale-adapter";
import layoutStyles from "../../layout/FormRouteLayout.module.css";
import styles from "./ComponentCatalog.module.css";
import { beginBuilderDrag, CATALOG_DRAG_TYPE, endBuilderDrag } from "../builder-drag";
import "jb-icons/search";
import { useMediaQuery } from "usehooks-ts";
interface ComponentCatalogProps {
  messages: FormMessages;
  onElementAdded?: (elementId: string) => void;
}

interface CatalogRowProps {
  entry: FormElementRegistryEntry;
  displayName: string;
  description: string;
  addLabel: string;
  onAdd: (entry: FormElementRegistryEntry) => void;
}

const CatalogRow = memo(function CatalogRow({ entry, displayName, description, addLabel, onAdd }: CatalogRowProps) {
  return (
    <li
      className={styles.catalogRow}
      draggable
      onDragStart={(event: DragEvent<HTMLLIElement>) => {
        event.dataTransfer.effectAllowed = "copy";
        event.dataTransfer.setData(CATALOG_DRAG_TYPE, entry.type);
        beginBuilderDrag(event.dataTransfer, event.currentTarget, styles.dragPreview, ["jb-button"]);
      }}
      onDragEnd={endBuilderDrag}
    >
      <span className={styles.iconTile}>
        <CatalogIcon iconId={entry.iconId} />
      </span>
      <span className={styles.catalogCopy}>
        <strong>{displayName}</strong>
        <small>{description}</small>
      </span>
      <JBButton variant="ghost" size="sm" onClick={() => onAdd(entry)} aria-label={`${addLabel} ${displayName}`}>
        {addLabel}
      </JBButton>
    </li>
  );
});

export const ComponentCatalog = observer(function ComponentCatalog({ messages, onElementAdded }: ComponentCatalogProps) {
  const store = useBuilderStore();
  const [query, setQuery] = useState("");
  const addElement = useCallback(
    (entry: FormElementRegistryEntry) => {
      const elementId = store.addCatalogElement(entry);
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
      ? supportedComponentData.filter(entry =>
          [
            entry.displayName,
            getFormElementDisplayName(entry, store.editingLocale),
            entry.type,
            entry.category,
            entry.description,
            getFormElementDescription(entry, store.editingLocale),
            ...entry.keywords,
          ]
            .join(" ")
            .toLocaleLowerCase()
            .includes(normalized),
        )
      : supportedComponentData;

    return Map.groupBy(entries, entry => entry.category);
  }, [query, store.editingLocale]);
  const isMobile = useMediaQuery("(max-width: 63.999rem)");

  return (
    <aside className={`${layoutStyles.panel} ${styles.catalog}`} data-builder-panel="catalog" aria-labelledby="component-catalog-title">
      <div className={styles.panelHeading}>
        <div>
          {!isMobile && <p className={styles.eyebrow}>{messages.builder}</p>}
          <h2 id="component-catalog-title">
            {isMobile && messages.catalogDescription}
            {!isMobile && messages.componentCatalog}
          </h2>
        </div>
        <span className={styles.countBadge}>{supportedComponentData.length}</span>
      </div>
      {!isMobile && <p className={styles.panelDescription}>{messages.catalogDescription}</p>}
      <JBInput
        name="componentSearch"
        type="search"
        placeholder={messages.searchComponents}
        value={query}
        size="sm"
        className={styles.searchInput}
        onInput={event => setQuery(String((event.target as unknown as { value?: unknown }).value ?? ""))}
      >
        <jb-icon-search slot="inline-end" className={styles.searchIcon} />
      </JBInput>

      <div className={styles.catalogGroups}>
        {[...filteredGroups.entries()].map(([category, entries]) => (
          <section className={styles.catalogGroup} key={category}>
            <h3>{category}</h3>
            <ul>
              {entries.map(entry => (
                <CatalogRow
                  key={entry.type}
                  entry={entry}
                  displayName={getFormElementDisplayName(entry, store.editingLocale)}
                  description={getFormElementDescription(entry, store.editingLocale)}
                  addLabel={messages.add}
                  onAdd={addElement}
                />
              ))}
            </ul>
          </section>
        ))}
      </div>
    </aside>
  );
});
