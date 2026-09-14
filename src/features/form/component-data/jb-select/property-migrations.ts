/** Compatibility mappings for portable documents saved before the component upgrade. */
export const propertyMigrations = [
  {
    "from": "hideClear",
    "to": "clearable",
    "invert": true
  }
] as const;
