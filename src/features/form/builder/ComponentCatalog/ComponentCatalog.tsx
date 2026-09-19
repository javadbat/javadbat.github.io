import { useTranslation } from "react-i18next";
import { memo, useCallback, useMemo, useState, type DragEvent } from "react";
import { observer } from "mobx-react-lite";
import { JBButton } from "jb-button/react";
import { JBInput } from "jb-input/react";
import { useBuilderStore } from "../store/BuilderStoreContext";
import { CatalogIcon } from "../CatalogIcon/CatalogIcon";
import { getFormElementCategoryName, getFormElementDescription, getFormElementDisplayName, type FormElementRegistryEntry } from "../../component-data";
import { supportedComponentData } from "../../component-data";
import layoutStyles from "../../layout/FormRouteLayout.module.css";
import styles from "./ComponentCatalog.module.css";
import { beginBuilderDrag, CATALOG_DRAG_TYPE, endBuilderDrag } from "../builder-drag";
import "jb-icons/search";
import { useMediaQuery } from "usehooks-ts";
interface ComponentCatalogProps {

  onElementAdded?: (elementId: string) => void;
}

interface CatalogRowProps {
  entry: FormElementRegistryEntry;
  displayName: string;
  description: string;
  onAdd: (entry: FormElementRegistryEntry) => void;
}

const CatalogRow = memo(function CatalogRow({ entry, displayName, description, onAdd }: CatalogRowProps) {
  const { t } = useTranslation("componentCatalog");
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
      <JBButton variant="ghost" size="sm" onClick={() => onAdd(entry)} aria-label={`${t("add")} ${displayName}`}>
        {t("add")}
      </JBButton>
    </li>
  );
});

export const ComponentCatalog = observer(function ComponentCatalog({ onElementAdded }: ComponentCatalogProps) {
  const { t: tCommon } = useTranslation("common");
  const { t, i18n } = useTranslation("componentCatalog");
  const store = useBuilderStore();
  const interfaceLocale = i18n.resolvedLanguage ?? i18n.language;
  const [query, setQuery] = useState("");
  const addElement = useCallback(
    (entry: FormElementRegistryEntry) => {
      const elementId = store.addCatalogElement(entry);
      const position = store.getElementPosition(elementId) + 1;
      store.announce(`${getFormElementDisplayName(entry, interfaceLocale)} ${tCommon("addedAnnouncement")} ${position} ${tCommon("of")} ${store.document.elements.length}`);
      onElementAdded?.(elementId);
      requestAnimationFrame(() => {
        document.getElementById(`element-card-${elementId}`)?.scrollIntoView({ block: "nearest" });
      });
    },
    [interfaceLocale, tCommon, onElementAdded, store],
  );

  const filteredGroups = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();
    const entries = normalized
      ? supportedComponentData.filter(entry =>
          [
            entry.displayName,
            getFormElementDisplayName(entry, interfaceLocale),
            getFormElementCategoryName(entry.category, interfaceLocale),
            entry.category,
            entry.type,
            entry.description,
            getFormElementDescription(entry, interfaceLocale),
            ...entry.keywords,
          ]
            .join(" ")
            .toLocaleLowerCase()
            .includes(normalized),
        )
      : supportedComponentData;

    return Map.groupBy(entries, entry => entry.category);
  }, [query, interfaceLocale]);
  const isMobile = useMediaQuery("(max-width: 63.999rem)");

  return (
    <aside className={`${layoutStyles.panel} ${styles.catalog}`} data-builder-panel="catalog" aria-labelledby="component-catalog-title">
      <div className={styles.panelHeading}>
        <div>
          {!isMobile && <p className={styles.eyebrow}>{tCommon("builder")}</p>}
          <h2 id="component-catalog-title">
            {isMobile && t("catalogDescription")}
            {!isMobile && tCommon("componentCatalog")}
          </h2>
        </div>
        <span className={styles.countBadge}>{supportedComponentData.length}</span>
      </div>
      {!isMobile && <p className={styles.panelDescription}>{t("catalogDescription")}</p>}
      <JBInput
        name="componentSearch"
        type="search"
        placeholder={t("searchComponents")}
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
            <h3>{getFormElementCategoryName(category, interfaceLocale)}</h3>
            <ul>
              {entries.map(entry => (
                <CatalogRow
                  key={entry.type}
                  entry={entry}
                  displayName={getFormElementDisplayName(entry, interfaceLocale)}
                  description={getFormElementDescription(entry, interfaceLocale)}
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
