import type { FighterData, MoveData } from './types'

/** Make attacks faster to resolve without touching their frame timing. */
export const SHOWDOWN_DAMAGE_SCALE = 3

function boostParry(parry: NonNullable<MoveData['parry']>) {
  return {
    ...parry,
    damage: parry.damage * SHOWDOWN_DAMAGE_SCALE,
  }
}

function boostMove(move: MoveData): MoveData {
  const tuned = { ...move }
  tuned.damage *= SHOWDOWN_DAMAGE_SCALE
  if (tuned.chip !== undefined) tuned.chip *= SHOWDOWN_DAMAGE_SCALE
  if (tuned.parry) tuned.parry = boostParry(tuned.parry)
  return tuned
}

function boostHeavy(heavy: Partial<MoveData>): Partial<MoveData> {
  const tuned = { ...heavy }
  if (tuned.damage !== undefined) tuned.damage *= SHOWDOWN_DAMAGE_SCALE
  if (tuned.chip !== undefined) tuned.chip *= SHOWDOWN_DAMAGE_SCALE
  if (tuned.parry) tuned.parry = boostParry(tuned.parry)
  return tuned
}

/** Clone match data; leave the authored fighter kits and sim tests unchanged. */
export function showtimeFighter(fighter: FighterData): FighterData {
  const moves = Object.fromEntries(
    Object.entries(fighter.moves).map(([id, move]) => [id, boostMove(move)]),
  ) as FighterData['moves']
  return {
    ...fighter,
    throwDamage: fighter.throwDamage * SHOWDOWN_DAMAGE_SCALE,
    moves,
    specials: fighter.specials.map((special) => ({
      ...special,
      move: boostMove(special.move),
      heavy: special.heavy ? boostHeavy(special.heavy) : undefined,
    })),
  }
}
