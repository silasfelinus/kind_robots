// /server/utils/artImageSeed.ts
export const MYSQL_SIGNED_INT_MIN = -2_147_483_648
export const MYSQL_SIGNED_INT_MAX = 2_147_483_647

export function isPersistableArtImageSeed(
  seed: number | null | undefined,
): seed is number {
  return (
    typeof seed === 'number' &&
    Number.isSafeInteger(seed) &&
    seed >= MYSQL_SIGNED_INT_MIN &&
    seed <= MYSQL_SIGNED_INT_MAX
  )
}

export function resolvePersistedArtImageSeed(
  imageSeed: number | null,
  workflowSeed: number | null,
): number | null {
  const currentSeed = isPersistableArtImageSeed(imageSeed) ? imageSeed : null

  if (currentSeed !== null && currentSeed >= 0) {
    return currentSeed
  }

  if (isPersistableArtImageSeed(workflowSeed)) {
    return workflowSeed
  }

  return currentSeed
}
