// All City and Journey bouts use Clash, with the player-selected Solo
// or Alliance deck. The server receives the exact issued boss-life totals.
// District decisions, street stories, crises and campaign approaches still
// write BLACKOUT-era BoutTerms. In Clash they move each boss's starting life,
// so the choices keep their weight: an edge for you is more life for your
// boss, an edge for the rival is more life for theirs.
import type { BoutTerms } from './city'
import { CLASH_BOSS_HP, CLASH_BOSS_RANGE } from './clash'
import type { Side } from './prototypes'

/** Boss life per point of each term. */
export const CLASH_TERM_WEIGHTS = {
  playerHp: 3,
  playerMana: 2,
  enemyArmor: 3,
  enemyMana: 2,
  fewerRivals: 4,
  rivalTrap: 3,
} as const

/** Starting boss life for both sides under `terms`, within the Clash range. */
export function clashBossesFromTerms(terms: BoutTerms): Record<Side, number> {
  const w = CLASH_TERM_WEIGHTS
  const [low, high] = CLASH_BOSS_RANGE
  const clamp = (n: number) => Math.min(high, Math.max(low, n))
  return {
    player: clamp(
      CLASH_BOSS_HP +
        (terms.playerBossLife ?? 0) +
        (terms.playerHp ?? 0) * w.playerHp +
        (terms.playerMana ?? 0) * w.playerMana,
    ),
    enemy: clamp(
      CLASH_BOSS_HP +
        (terms.enemyBossLife ?? 0) +
        (terms.enemyArmor ?? 0) * w.enemyArmor +
        (terms.enemyMana ?? 0) * w.enemyMana -
        (terms.fewerRivals ?? 0) * w.fewerRivals +
        (terms.rivalTrap ? w.rivalTrap : 0),
    ),
  }
}

/** One line for the bout card: how the terms moved the bosses. */
export function clashTermsLabel(
  terms: BoutTerms,
  format: 'solo' | 'alliance' = 'solo',
): string {
  const b = clashBossesFromTerms(terms)
  const delta = (n: number) =>
    n === CLASH_BOSS_HP
      ? String(n)
      : n + ' (' + (n > CLASH_BOSS_HP ? '+' : '') + (n - CLASH_BOSS_HP) + ')'
  return (
    format.toUpperCase() +
    ' CLASH · YOUR BOSS ' +
    delta(b.player) +
    ' · RIVAL ' +
    delta(b.enemy)
  )
}
