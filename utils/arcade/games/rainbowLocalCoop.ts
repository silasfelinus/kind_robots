/**
 * Same-device flight-deck rules. Inactive seats keep their state on the bench:
 * changing the cabinet seat count while paused must never restart the Act,
 * refund powerups, or turn a fallen pilot into a free life.
 */
export type CoopShipState = {
  lives: number
  shield: number
  invulnerable: number
  power: number
}

export function boundedCoopSeats(requested: number): number {
  return Number.isFinite(requested)
    ? Math.max(1, Math.min(4, Math.trunc(requested)))
    : 1
}

export function addCoopSeats<T extends CoopShipState>(
  roster: T[],
  requested: number,
  makeSeat: (seat: number) => T,
): number {
  const active = boundedCoopSeats(requested)
  while (roster.length < active) roster.push(makeSeat(roster.length))
  return active
}

export function availableCoopTargets<T extends CoopShipState>(
  roster: readonly T[],
  active: number,
): T[] {
  return roster.slice(0, boundedCoopSeats(active)).filter((ship) => ship.lives > 0)
}

/**
 * Solenne's earned Halo Harbor super can bring back one fallen active ally.
 * No charge means no super; no live caster means no revive; inactive players
 * are never revived on the bench. The consumer spends earned charge first.
 */
export function haloRevive<T extends CoopShipState>(
  roster: readonly T[],
  active: number,
  caster: number,
): number | null {
  if (caster !== 2 || caster >= active || (roster[caster]?.lives ?? 0) <= 0)
    return null
  const seat = roster.findIndex(
    (ship, index) => index < active && index !== caster && ship.lives <= 0,
  )
  if (seat < 0) return null
  const ship = roster[seat]!
  ship.lives = 1
  ship.shield = 2
  ship.invulnerable = 150
  ship.power = Math.max(1, ship.power)
  return seat
}

export function coopEnemyHealth(baseHealth: number, active: number): number {
  // Multi-pilot opponents survive slightly longer, but never gain hidden
  // damage, impossible health, or unavoidable bullet acceleration.
  return baseHealth + Math.floor((boundedCoopSeats(active) - 1) / 2)
}
