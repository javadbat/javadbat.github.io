/** Compatibility mappings for portable documents saved before the component upgrade. */
export const propertyMigrations = [
  {
    "from": "frontalZero",
    "to": "leadingZero"
  }
] as const;
