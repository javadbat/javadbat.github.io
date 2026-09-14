/** Compatibility mappings for portable documents saved before the component upgrade. */
export const propertyMigrations = [
  {
    "from": "acceptTypes",
    "to": "accept"
  }
] as const;
