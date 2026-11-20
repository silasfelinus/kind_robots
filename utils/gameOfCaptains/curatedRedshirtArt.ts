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
