import type { FighterData, MoveData } from './types'

/** Arcade playtest tuning: heavier impacts, unchanged startup, recovery and movement. */
export const SHOWDOWN_DAMAGE_SCALE = 3

function boostMove(move: MoveData): MoveData {
  return {
    ...move,
    damage: move.damage * SHOWDOWN_DAMAGE_SCALE,
    chip:
      move.chip === undefined
        ? undefined
        : move.chip * SHOWDOWN_DAMAGE_SCALE,
    parry: move.parry
      ? { ...move.parry, damage: move.parry.damage * SHOWDOWN_DAMAGE_SCALE }
      : undefined,
  }
}

/** Clone frame data for the live match; keep the canonical fighter kits unchanged. */
export function showtimeFighter(fighter: FighterData): FighterData {
  return {
    ...fighter,
    throwDamage: fighter.throwDamage * SHOWDOWN_DAMAGE_SCALE,
    moves: Object.fromEntries(
      Object.entries(fighter.moves).map(([id, move]) => [id, boostMove(move)]),
    ) as FighterData['moves'],
    specials: fighter.specials.map((special) => ({
      ...special,
      move: boostMove(special.move),
      heavy: special.heavy
        ? {
            ...special.heavy,
            damage:
              special.heavy.damage === undefined
                ? undefined
                : special.heavy.damage * SHOWDOWN_DAMAGE_SCALE,
            chip:
              special.heavy.chip === undefined
                ? undefined
                : special.heavy.chip * SHOWDOWN_DAMAGE_SCALE,
            parry: special.heavy.parry
              ? {
                  ...special.heavy.parry,
                  damage: special.heavy.parry.damage * SHOWDOWN_DAMAGE_SCALE,
                }
              : undefined,
          }
        : undefined,
    })),
  }
}
