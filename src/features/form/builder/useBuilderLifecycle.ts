import { useEffect } from "react";
import { useBuilderStore } from "./store/BuilderStoreContext";

/**
 * Groups browser lifecycle integration away from the visual component tree.
 *
 * Browser globals are accessed only inside effects. This keeps module
 * evaluation safe in non-browser environments and makes future SSR support
 * possible without changing the builder's component API.
 */
export function useBuilderLifecycle(slug?: string): void {
  const store = useBuilderStore();
  useEffect(() => {
    void store.initialize(slug);
  }, [slug, store]);

  useEffect(() => {
    const handleSaveShortcut = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        void store.save();
      }
    };

    window.addEventListener("keydown", handleSaveShortcut);
    return () => window.removeEventListener("keydown", handleSaveShortcut);
  }, [store]);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (store.isDirty) {
        event.preventDefault();
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [store]);
}
