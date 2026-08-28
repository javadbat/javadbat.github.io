import { createContext, useContext, type ReactNode } from "react";
import { useInstance } from "jb-core/react";
import { BuilderStore } from "./BuilderStore";

/** React boundary carrying the one builder business store for a component tree. */
const BuilderStoreContext = createContext<BuilderStore | null>(null);

/** Inputs for establishing builder state ownership. */
interface BuilderStoreProviderProps {
  /** Builder UI subtree that consumes the store. */
  children: ReactNode;
  /**
   * Tests and isolated stories may inject a prepared store. Production leaves
   * this empty so the provider owns exactly one lazy-created store instance.
   */
  value?: BuilderStore;
}

/** Provides one stable builder store, with optional injection for isolated tests and stories. */
export function BuilderStoreProvider({ children, value }: BuilderStoreProviderProps) {
  /** Lazily created production store retained for the provider's lifetime. */
  const localStore = useInstance(BuilderStore, []);

  return <BuilderStoreContext.Provider value={value ?? localStore}>{children}</BuilderStoreContext.Provider>;
}

/** Returns the active builder store and rejects components mounted outside its ownership boundary. */
export function useBuilderStore(): BuilderStore {
  /** Store supplied by the nearest builder provider. */
  const store = useContext(BuilderStoreContext);

  if (!store) {
    throw new Error("useBuilderStore must be used inside BuilderStoreProvider.");
  }

  return store;
}
