/**
 * ArtSlot keys from the Conductor redshirt ledgers. Only the 100 canonical
 * recruits are permitted; no user-provided slot name is a runtime art key.
 */
export function curatedRedshirtArtKey(slotKey: string): string | null {
  const key = slotKey.startsWith('game-of-captains/')
    ? slotKey.slice('game-of-captains/'.length)
    : slotKey
  return /^redshirts\/(?:portraits|secret-powers)\/rs-(?:00[1-9]|0[1-9]\d|100)$/.test(
    key,
  )
    ? key
    : null
}

/** An explicit liked verdict is required: DONE is not visual approval. */
export function isApprovedRedshirtSelection(
  selectedArtImageId: number | null,
  candidates: readonly { artImageId: number; verdict: string }[],
): boolean {
  return (
    selectedArtImageId !== null &&
    candidates.some(
      (candidate) =>
        candidate.artImageId === selectedArtImageId &&
        candidate.verdict === 'liked',
    )
  )
}

/**
 * Prefer the canonical project-prefixed slot if both it and a legacy short
 * alias have an independently liked, public selection. Never depend on the
 * database's unspecified row order when choosing the active redshirt plate.
 */
export function preferCanonicalRedshirtSlots<T extends { slotKey: string }>(
  slots: readonly T[],
): T[] {
  return [...slots].sort((a, b) => {
    const canonical = (key: string) =>
      Number(key.startsWith('game-of-captains/'))
    return (
      canonical(b.slotKey) - canonical(a.slotKey) ||
      a.slotKey.localeCompare(b.slotKey)
    )
  })
}
