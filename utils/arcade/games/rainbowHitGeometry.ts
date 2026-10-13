/**
 * Core contacts and grazes are disjoint. A protected craft may survive a
 * direct projectile overlap, but that overlap is not a near-miss reward.
 * A protected core overlap must also block any later graze on that bullet.
 * This pure predicate is shared by the engine and fixed-frame replay tests.
 */
export function enemyBulletContact(
  distance: number,
  invulnerable: boolean,
  coreRadius = 7,
  grazeRadius = 15,
): 'hit' | 'graze' | 'protected' | null {
  if (!Number.isFinite(distance) || distance < 0) return null
  if (distance < coreRadius) return invulnerable ? 'protected' : 'hit'
  return distance < grazeRadius ? 'graze' : null
}
