// Rainbow Bullet Hell Space Princess achievements (main-game standard). The
// game queues each one's key the moment it happens and the cabinet drains the
// queue (drainFeats -> arcadeStore.awardFeats). Mastery goals and ending parts
// share their ids with these keys, so a mastery a player already holds is
// backfilled by arcadeStore.awardMasteryAchievements. Codes keep the cabinet's
// arcade- prefix (utils/achievements/gameAchievements.ts achievementCode).

import type { RainbowMedal } from './rainbowLoadouts'

export const RAINBOW_ACHIEVEMENT_CODES = {
  'first-light': 'arcade-rainbow-bullet-hell-space-princess-first-light',
  'gold-wing': 'arcade-rainbow-bullet-hell-space-princess-gold-wing',
  'the-end': 'arcade-rainbow-bullet-hell-space-princess-the-end',
  'guardian-breaker':
    'arcade-rainbow-bullet-hell-space-princess-guardian-breaker',
  'no-one-left': 'arcade-rainbow-bullet-hell-space-princess-no-one-left',
  'every-ending': 'arcade-rainbow-bullet-hell-space-princess-every-ending',
  'ace-of-eclipse': 'arcade-rainbow-bullet-hell-space-princess-ace-of-eclipse',
  'ending-restore': 'arcade-rainbow-bullet-hell-space-princess-ending-restore',
  'ending-evacuate':
    'arcade-rainbow-bullet-hell-space-princess-ending-evacuate',
  'ending-sever': 'arcade-rainbow-bullet-hell-space-princess-ending-sever',
  'rebel-road': 'arcade-rainbow-bullet-hell-space-princess-rebel-road',
  'loyal-road': 'arcade-rainbow-bullet-hell-space-princess-loyal-road',
  'vault-run': 'arcade-rainbow-bullet-hell-space-princess-vault-run',
  'kitty-power': 'arcade-rainbow-bullet-hell-space-princess-kitty-power',
  'full-squadron': 'arcade-rainbow-bullet-hell-space-princess-full-squadron',
  'no-continue': 'arcade-rainbow-bullet-hell-space-princess-no-continue',
  'all-gold': 'arcade-rainbow-bullet-hell-space-princess-all-gold',
} as const

export type RainbowFeat = keyof typeof RAINBOW_ACHIEVEMENT_CODES

export function isRainbowFeat(id: string): id is RainbowFeat {
  return Object.prototype.hasOwnProperty.call(RAINBOW_ACHIEVEMENT_CODES, id)
}

const ACTS = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const

/** The campaign-wide medal feats a flight has earned once Act IX's medal is in. */
export function rainbowMedalFeats(
  medals: Partial<Record<(typeof ACTS)[number], RainbowMedal>>,
): RainbowFeat[] {
  const all = ACTS.map((act) => medals[act])
  if (all.some((medal) => !medal)) return []
  const feats: RainbowFeat[] = []
  if (all.every((medal) => medal !== 'bronze')) feats.push('no-continue')
  if (all.every((medal) => medal === 'gold')) feats.push('all-gold')
  return feats
}
