// Faction powers: one per crew, each fired once per Clash match (Silas,
// 2026-11-07 PT). Silas, 2026-11-10 PT: "let's def have two powers in
// alliance, and a single one shot in solo. But maybe there should be an
// upgrade to that power if the user hits a specific requirement, like going
// below life or filling" -- SOLO brings the crew's power, ALLIANCE both crews'
// powers, and a power fired while OVERCHARGED (boss at half life or less, or
// all five alleys filled) uses its bigger `amount`. Data only; the effects
// run in clash.ts.
import type { TeamId } from './prototypes'

/** What a faction power needs pointed at it. */
export type PowerTarget = 'own' | 'enemy' | 'none'
export interface FactionPower {
  team: TeamId
  name: string
  /** Rules text: exactly what the code in clash.ts does. */
  text: string
  target: PowerTarget
  symbol: string
  /** The effect's number: [normal, overcharged]. */
  amount: readonly [number, number]
  /** What changes when it fires overcharged. */
  overcharge: string
}

/**
 * One faction power per crew, usable once per match during your own card-play
 * phase. It does not spend a card play.
 */
export const FACTION_POWERS: Record<TeamId, FactionPower> = {
  catgirls: {
    team: 'catgirls',
    name: 'NINE LIVES',
    text: 'Every fighter you have returns to full life, shakes off its stun, gains +2 power this round and may strike this turn, even if it just landed.',
    target: 'none',
    symbol: '🐾',
    amount: [2, 3],
    overcharge: '+3 power instead of +2.',
  },
  bloodfairies: {
    team: 'bloodfairies',
    name: 'MOSH PIT',
    text: 'Every fighter you have gains +3 power until the round ends.',
    target: 'none',
    symbol: '🦇',
    amount: [3, 5],
    overcharge: '+5 power instead of +3.',
  },
  ironjaw: {
    team: 'ironjaw',
    name: 'UNION WALL',
    text: 'Every fighter you have gains +2 armor until your next turn.',
    target: 'none',
    symbol: '🛡',
    amount: [2, 4],
    overcharge: '+4 armor instead of +2.',
  },
  riot: {
    team: 'riot',
    name: 'FUSE BOX',
    text: 'Deal 3 damage to every rival fighter.',
    target: 'none',
    symbol: '💥',
    amount: [3, 4],
    overcharge: '4 damage instead of 3.',
  },
  undertow: {
    team: 'undertow',
    name: 'SEWER SNIPE',
    text: 'Deal 5 damage to a rival fighter, ignoring armor, and stun it.',
    target: 'enemy',
    symbol: '🎯',
    amount: [5, 8],
    overcharge: '8 damage instead of 5.',
  },
  exchange: {
    team: 'exchange',
    name: 'CALL IN THE DEBT',
    // 5/8 until slime-city/t-057 (2026-11-11 PT): Exchange scored 0.59-0.61
    // across the constructed field in five seed families. 4/7 holds it at
    // 0.55-0.57 on four held-out families, starters 47.5% -> 45.8%.
    text: 'The rival boss loses 4 life and your boss gains 4 (up to its maximum).',
    target: 'none',
    symbol: '💰',
    amount: [4, 7],
    overcharge: 'Drains 7 instead of 4.',
  },
}

export function factionPower(team: TeamId): FactionPower {
  return FACTION_POWERS[team]
}

/** When a power fires bigger. */
export const OVERCHARGE_RULE =
  'OVERCHARGED while your boss is at half life or less, or a fighter holds every one of your five alleys.'
