/** Lowercase name with runs of whitespace replaced by single hyphens, e.g. "Dog Cat" → "dog-cat" */
export function playerIdFromName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, "-");
}
