import { createContext, useContext, type ReactNode } from "react";
import { useInstance } from "jb-core/react";
import { BuilderStore } from "./BuilderStore";

const BuilderStoreContext = createContext<BuilderStore | null>(null);

interface BuilderStoreProviderProps {
  children: ReactNode;
  /**
   * Tests and isolated stories may inject a prepared store. Production leaves
   * this empty so the provider owns exactly one lazy-created store instance.
   */
  value?: BuilderStore;
}

export function BuilderStoreProvider({ children, value }: BuilderStoreProviderProps) {
  const localStore = useInstance(BuilderStore, []);

  return <BuilderStoreContext.Provider value={value ?? localStore}>{children}</BuilderStoreContext.Provider>;
}

export function useBuilderStore(): BuilderStore {
  const store = useContext(BuilderStoreContext);

  if (!store) {
    throw new Error("useBuilderStore must be used inside BuilderStoreProvider.");
  }

  return store;
}
