// /utils/slugify.ts
// Canonical slug rules for the whole app: lowercase, ascii, hyphen-separated.
// Matches the conductor project slug convention so records can cross-link
// (e.g. an ArtCollection slug binding to a conductor project slug).

export function slugify(value: string | null | undefined): string {
  return String(value ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .slice(0, 255)
    .replace(/^-+|-+$/g, '')
}

// Normalize a user-supplied slug field: undefined = "not provided",
// null / empty = "clear the slug", anything else = slugified value.
// Throws-free by design — callers decide how to handle an empty result.
export function normalizeSlugInput(value: unknown): string | null | undefined {
  if (typeof value === 'undefined') return undefined
  if (value === null) return null

  const slug = slugify(String(value))
  return slug || null
}
