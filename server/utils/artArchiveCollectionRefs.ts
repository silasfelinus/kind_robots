// /server/utils/artArchiveCollectionRefs.ts
//
// The stable string key the Butterfly Gallery uses for an ArtCollection. Most
// collections carry a unique slug; older rows without one fall back to an
// id-derived key so they still filter, display, and round-trip correctly.
export function archiveCollectionValue(collection: {
  id: number
  slug: string | null
}): string {
  return collection.slug || `collection-${collection.id}`
}

export function toArchiveCollectionRef(collection: {
  id: number
  slug: string | null
  label: string | null
}): { id: number; slug: string; label: string } {
  const slug = archiveCollectionValue(collection)
  return { id: collection.id, slug, label: collection.label || slug }
}
