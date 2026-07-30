import { useEffect, useState } from "react";
import type { JBFormDocumentV1 } from "../domain/form-document";
import { formRepository } from "../storage/form-repository";
import type { LinkedFormReference, StorageIssue } from "../storage/storage-types";

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

export function useStoredForm(slug?: string): StoredFormResolution {
  const [resolution, setResolution] = useState<StoredFormResolution>({
    status: "loading",
  });

  useEffect(() => {
    let active = true;
    setResolution({ status: "loading" });
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
