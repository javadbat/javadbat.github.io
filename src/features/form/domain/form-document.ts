/**
 * Shared portable-form contract for every `/form` experience.
 *
 * The builder creates this document, storage persists it, and designer and
 * preview routes consume it. Re-exporting the package contract here gives the
 * application one stable business boundary without duplicating schema types.
 */
export * from "jb-form-builder/contract";
