// Every faction ally changes the terms of protecting people or taking a risk.
// These are direct CLASH boss-life changes, not legacy mana/armor modifiers.
import type { TeamId } from './prototypes'

export interface AllianceTacticalEdge {
  player: number
  enemy: number
}
interface AllianceTactic {
  name: string
  protect: AllianceTacticalEdge
  gamble: AllianceTacticalEdge
}
type AllianceTacticPick = 'protect' | 'gamble'

/** Every partner offers a recognizably different risk/reward envelope. */
export const ALLIANCE_TACTICS: Record<TeamId, AllianceTactic> = {
  catgirls: {
    name: 'Ambush and extraction',
    protect: { player: 4, enemy: 1 },
    gamble: { player: -3, enemy: -7 },
  },
  bloodfairies: {
    name: 'Crowd and encore',
    protect: { player: 6, enemy: 3 },
    gamble: { player: -1, enemy: -4 },
  },
  ironjaw: {
    name: 'Warmth and barricades',
    protect: { player: 7, enemy: 4 },
    gamble: { player: -3, enemy: -6 },
  },
  riot: {
    name: 'Stagecraft and fireworks',
    protect: { player: 3, enemy: 0 },
    gamble: { player: -4, enemy: -9 },
  },
  undertow: {
    name: 'Secrets and misdirection',
    protect: { player: 4, enemy: 2 },
    gamble: { player: -1, enemy: -6 },
  },
  exchange: {
    name: 'Contracts and collateral',
    protect: { player: 6, enemy: 5 },
    gamble: { player: -3, enemy: -8 },
  },
}

interface ChapterPulse {
  title: string
  protect: AllianceTacticalEdge
  gamble: AllianceTacticalEdge
}

/** The same partner's leverage changes each chapter rather than copying
 * chapter one. These bounded adjustments never accumulate across chapters. */
export const ALLIANCE_CHAPTER_PULSES: readonly [
  ChapterPulse,
  ChapterPulse,
  ChapterPulse,
  ChapterPulse,
  ChapterPulse,
] = [
  {
    title: 'First contact',
    protect: { player: 0, enemy: 0 },
    gamble: { player: 0, enemy: 0 },
  },
  {
    title: 'Pressure',
    protect: { player: 1, enemy: 1 },
    gamble: { player: 0, enemy: -1 },
  },
  {
    title: 'Breaking point',
    protect: { player: 1, enemy: -1 },
    gamble: { player: -1, enemy: -1 },
  },
  {
    title: 'Countermove',
    protect: { player: 0, enemy: -1 },
    gamble: { player: -2, enemy: -2 },
  },
  {
    title: 'Final showdown',
    protect: { player: 2, enemy: 1 },
    gamble: { player: -2, enemy: -3 },
  },
]

export function allianceTacticEdge(
  ally: TeamId,
  chapter: number,
  pick: AllianceTacticPick,
  last?: { ally: TeamId; pick: AllianceTacticPick },
): AllianceTacticalEdge | null {
  const stage = ALLIANCE_CHAPTER_PULSES[chapter]
  if (!stage) return null
  const signature = ALLIANCE_TACTICS[ally][pick]
  const pulse = stage[pick]
  const loyal = last?.ally === ally
  return {
    player:
      signature.player +
      pulse.player +
      (loyal && last.pick === 'protect' ? 1 : 0),
    enemy:
      signature.enemy +
      pulse.enemy -
      (loyal && last.pick === 'gamble' ? 1 : 0),
  }
}

export function allianceTacticLabel(edge: AllianceTacticalEdge): string {
  const signed = (n: number): string => (n > 0 ? '+' : '') + n
  return 'YOUR BOSS ' + signed(edge.player) + ' · RIVAL ' + signed(edge.enemy)
}
