import { walkFormElements, type JBFormDocumentV1 } from "./contract/form-document";
import { registryByType } from "./registry/form-element-registry";
import type { DependencyFailure, DependencyLoadResult, RendererDependency } from "./types";

/**
 * Custom-element registration is global to the page. Cache the in-flight
 * package promise at module scope so multiple renderer instances never request
 * or evaluate the same package twice.
 */
const dependencyPromises = new Map<string, Promise<void>>();

const formDependency: RendererDependency = {
  packageName: "jb-form",
  tagNames: ["jb-form"],
};

function isRegistered(dependency: RendererDependency): boolean {
  return dependency.tagNames.every(tagName => Boolean(globalThis.customElements?.get(tagName)));
}

function packageLoader(dependency: RendererDependency): () => Promise<unknown> {
  if (dependency.packageName === "jb-form") {
    // Keep a literal dynamic import so Vite/Rollup can create a predictable
    // lazy chunk without evaluating the currently client-only package in SSR.
    return () => import("jb-form");
  }
  const adapter = dependency.elementType ? registryByType.get(dependency.elementType) : undefined;
  if (!adapter) {
    return () => Promise.reject(new Error(`No loader exists for ${dependency.packageName}.`));
  }
  return adapter.loadComponent;
}

async function loadDependency(dependency: RendererDependency): Promise<void> {
  // Respect a definition supplied by the consuming application. This is what
  // allows manual version ownership and avoids duplicate customElements.define.
  if (isRegistered(dependency)) {
    return;
  }
  let pending = dependencyPromises.get(dependency.packageName);
  if (!pending) {
    pending = packageLoader(dependency)().then(() => undefined);
    dependencyPromises.set(dependency.packageName, pending);
  }
  try {
    await pending;
  } catch (error) {
    dependencyPromises.delete(dependency.packageName);
    throw error;
  }
  const missingTags = dependency.tagNames.filter(tagName => !globalThis.customElements?.get(tagName));
  if (missingTags.length > 0) {
    dependencyPromises.delete(dependency.packageName);
    throw new Error(`${dependency.packageName} did not register ${missingTags.join(", ")}.`);
  }
}

export function getRequiredDependencies(document: JBFormDocumentV1): RendererDependency[] {
  const dependencies: RendererDependency[] = [formDependency];
  const seen = new Set<string>();
  for (const element of walkFormElements(document.elements)) {
    if (seen.has(element.type)) {
      continue;
    }
    seen.add(element.type);
    const adapter = registryByType.get(element.type);
    if (!adapter || adapter.isContent) {
      continue;
    }
    dependencies.push({
      packageName: adapter.packageName,
      // jb-option is registered by jb-select and is also created by the shared
      // adapter, so manual mode must verify both definitions.
      tagNames:
        element.type === "jb-tab"
          ? ["jb-tab", "jb-tab-list", "jb-tab-trigger", "jb-tab-content"]
          : element.type === "jb-listbox"
          ? [adapter.tagName, "jb-option", "jb-checkbox"]
          : element.type === "jb-select"
            ? [adapter.tagName, "jb-option"]
            : [adapter.tagName],
      elementType: element.type,
    });
  }
  return dependencies;
}

export function getMissingDependencies(dependencies: readonly RendererDependency[]): RendererDependency[] {
  return dependencies.filter(dependency => !isRegistered(dependency));
}
export async function loadDependencies(dependencies: readonly RendererDependency[]): Promise<DependencyLoadResult> {
  // One broken field package must not prevent independent field packages from
  // loading. The renderer can then show a degraded placeholder for that field.
  const settled = await Promise.allSettled(
    dependencies.map(async dependency => {
      await loadDependency(dependency);
      return dependency;
    }),
  );
  const failures: DependencyFailure[] = [];
  settled.forEach((result, index) => {
    if (result.status === "rejected") {
      failures.push({
        dependency: dependencies[index],
        error: result.reason instanceof Error ? result.reason : new Error(String(result.reason)),
      });
    }
  });
  return {
    failures,
    missing: getMissingDependencies(dependencies),
  };
}
