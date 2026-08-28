import { useEffect, useState } from "react";
import type { JBFormDocumentV1 } from "../domain/form-document";
import { formRepository } from "../storage/form-repository";
import type { LinkedFormReference, StorageIssue } from "../storage/storage-types";

/**
 * Complete route-level outcome of resolving either a named form or the current
 * draft. Consumers render explicit loading, absence, failure, and ready states
 * instead of interpreting repository records themselves.
 */
export type StoredFormResolution =
  | { status: "loading" }
  | { status: "empty" }
  | { status: "not-found" }
  | { status: "error"; issue: StorageIssue }
  | {
      status: "ready";
      document: JBFormDocumentV1;
      linkedRecord: LinkedFormReference | null;
    };

/**
 * Resolves the form requested by a route: a slug selects a named form, while
 * an absent slug selects the current draft. Named-record revision information
 * is retained so later saves can detect concurrent edits.
 */
export function useStoredForm(slug?: string): StoredFormResolution {
  /** Current route-facing resolution rendered by designer and preview pages. */
  const [resolution, setResolution] = useState<StoredFormResolution>({
    status: "loading",
  });

  useEffect(() => {
    /** Prevents a superseded asynchronous lookup from updating an unmounted or retargeted route. */
    let active = true;
    setResolution({ status: "loading" });
    /** Repository lookup chosen from the route's named-form or current-draft intent. */
    const request = slug ? formRepository.getBySlug(slug) : formRepository.getCurrentDraft();
    request.then(result => {
      if (!active) {
        return;
      }
      if (!result.ok) {
        setResolution({ status: "error", issue: result.error });
        return;
      }
      if (!result.value) {
        setResolution({ status: slug ? "not-found" : "empty" });
        return;
      }
      if ("revision" in result.value) {
        setResolution({
          status: "ready",
          document: result.value.document,
          linkedRecord: {
            id: result.value.id,
            slug: result.value.slug,
            revision: result.value.revision,
          },
        });
        return;
      }
      setResolution({
        status: "ready",
        document: result.value.document,
        linkedRecord:
          result.value.linkedFormId && result.value.linkedSlug && result.value.linkedRevision
            ? {
                id: result.value.linkedFormId,
                slug: result.value.linkedSlug,
                revision: result.value.linkedRevision,
              }
            : null,
      });
    });
    return () => {
      active = false;
    };
  }, [slug]);

  return resolution;
}
