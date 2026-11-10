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
  ironjaw: {
    hit: 'Lab-grade scales!',
    gloat: 'Union strong.',
    beaten: 'Back to the sewer…',
  },
  riot: {
    hit: 'Tough crowd!',
    gloat: 'TA-DAAA!',
    beaten: 'The show… must… go on…',
  },
  undertow: {
    hit: 'Unforeseen.',
    gloat: 'As predicted.',
    beaten: 'Recalculating…',
  },
  exchange: {
    hit: 'The ledger bleeds!',
    gloat: 'Your soul is collateral.',
    beaten: 'The Deep forecloses…',
  },
}

export function bossQuip(team: TeamId, mood: BossMood): string {
  return mood === 'ready' ? '' : BOSS_QUIPS[team][mood]
}
