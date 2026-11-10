// Boss reactions for the Clash versus console. Silas, 2026-11-10 PT: "we
// should assign some more space for the matchup pictures, so there are
// reactions". Each boss portrait swaps to a mood painting (artManifest
// `bosses['<crew>/<mood>']`, crew poster until it renders) and shouts a line.
import type { TeamId } from './prototypes'

export type BossMood = 'ready' | 'hit' | 'gloat' | 'beaten'

export const BOSS_MOODS: readonly BossMood[] = [
  'ready',
  'hit',
  'gloat',
  'beaten',
]

export const BOSS_QUIPS: Record<
  TeamId,
  Record<Exclude<BossMood, 'ready'>, string>
> = {
  catgirls: { hit: 'HSSSS!', gloat: 'Purrfect.', beaten: 'Eight lives left…' },
  bloodfairies: {
    hit: 'Feedback!',
    gloat: 'ENCORE!',
    beaten: 'Show’s cancelled…',
  },
  ironjaw: { hit: 'Dented!', gloat: 'Union strong.', beaten: 'Shift’s over…' },
  riot: { hit: 'Ow! Again!', gloat: 'KA-BOOM!', beaten: 'Fizzled…' },
  undertow: {
    hit: 'Unforeseen.',
    gloat: 'As predicted.',
    beaten: 'Recalculating…',
  },
  exchange: { hit: 'My margins!', gloat: 'Paid in full.', beaten: 'Bankrupt…' },
}

export function bossQuip(team: TeamId, mood: BossMood): string {
  return mood === 'ready' ? '' : BOSS_QUIPS[team][mood]
}
