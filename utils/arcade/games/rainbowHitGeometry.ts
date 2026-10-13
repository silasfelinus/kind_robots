/**
 * Core contacts and grazes are disjoint. A protected craft may survive a
 * direct projectile overlap, but that overlap is not a near-miss reward.
 * This pure predicate is shared by the engine and fixed-frame replay tests.
 */
export function enemyBulletContact(
  distance: number,
  invulnerable: boolean,
  coreRadius = 7,
  grazeRadius = 15,
): 'hit' | 'graze' | null {
  if (!Number.isFinite(distance) || distance < 0) return null
  if (distance < coreRadius) return invulnerable ? null : 'hit'
  return distance < grazeRadius ? 'graze' : null
}
