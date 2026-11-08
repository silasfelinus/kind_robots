// Faction powers: one per crew, fired once per Clash match by the deck's
// general (Silas, 2026-11-07 PT). Data only; the effects run in clash.ts.
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
}

/**
 * One faction power per crew, usable once per Alliance match during your own
 * card-play phase. It does not spend a card play.
 */
export const FACTION_POWERS: Record<TeamId, FactionPower> = {
  catgirls: {
    team: 'catgirls',
    name: 'NINE LIVES',
    text: 'Every fighter you have returns to full life, shakes off its stun, gains +2 power this round and may strike this turn, even if it just landed.',
    target: 'none',
    symbol: '🐾',
  },
  bloodfairies: {
    team: 'bloodfairies',
    name: 'MOSH PIT',
    text: 'Every fighter you have gains +3 power until the round ends.',
    target: 'none',
    symbol: '🦇',
  },
  ironjaw: {
    team: 'ironjaw',
    name: 'UNION WALL',
    text: 'Every fighter you have gains +3 armor until your next turn.',
    target: 'none',
    symbol: '🛡',
  },
  riot: {
    team: 'riot',
    name: 'FUSE BOX',
    text: 'Deal 2 damage to every rival fighter.',
    target: 'none',
    symbol: '💥',
  },
  undertow: {
    team: 'undertow',
    name: 'SEWER SNIPE',
    text: 'Deal 5 damage to a rival fighter, ignoring armor, and stun it.',
    target: 'enemy',
    symbol: '🎯',
  },
  exchange: {
    team: 'exchange',
    name: 'CALL IN THE DEBT',
    text: 'The rival boss loses 5 life and your boss gains 5 (up to its maximum).',
    target: 'none',
    symbol: '💰',
  },
}

export function factionPower(team: TeamId): FactionPower {
  return FACTION_POWERS[team]
}
