// Zuzu Gamebook achievements (conductor zuzu-gamebook t-016): which catalog
// codes one step of play earns. Each helper compares the journey before and
// after a choice or a combat round, and the endings collection counts only
// endings reached in play, so a pasted save code never unlocks anything.

import { scene, type Run } from './adventure'
import { BOOK } from './book'

/** Every ending in the book, by scene id. */
export const ENDING_IDS: readonly string[] = Object.values(BOOK)
  .filter((node) => node.ending)
  .map((node) => node.id)

const FOE_ACHIEVEMENTS: Record<string, string> = {
  'River Croc': 'zuzu-gamebook-croc-crossing',
  'The Abbess': 'zuzu-gamebook-abbess-falls',
}

const CHAPTER_ACHIEVEMENTS: [prefix: string, code: string][] = [
  ['V · ', 'zuzu-gamebook-reached-the-mission'],
  ['IX · ', 'zuzu-gamebook-reached-the-bell'],
]

const TONE_ACHIEVEMENTS: Record<string, string> = {
  dark: 'zuzu-gamebook-dark-road',
  bittersweet: 'zuzu-gamebook-bittersweet',
}

/** One choice or combat round, from `before` to `after`. */
export function stepAchievements(before: Run, after: Run): string[] {
  const codes: string[] = []
  const foe = scene(before.sceneId).battle
  const fight = after.lastFight
  if (foe && before.battle && after.sceneId === foe.win && fight?.won) {
    const named = FOE_ACHIEVEMENTS[foe.name]
    if (named) codes.push(named)
    const rounds = fight.rounds ?? []
    if (rounds.at(-1)?.action === 'quiet-draw')
      codes.push('zuzu-gamebook-quiet-draw')
    if (rounds.length && rounds.every((round) => round.taken === 0))
      codes.push('zuzu-gamebook-untouched')
  }
  const was = scene(before.sceneId).chapter
  const now = scene(after.sceneId).chapter
  for (const [prefix, code] of CHAPTER_ACHIEVEMENTS)
    if (now.startsWith(prefix) && !was.startsWith(prefix)) codes.push(code)
  const roll = after.lastRoll
  if (
    roll &&
    roll !== before.lastRoll &&
    roll.dice[0] === 6 &&
    roll.dice[1] === 6
  )
    codes.push('zuzu-gamebook-double-six')
  if (
    !before.flags.includes('sister-free') &&
    after.flags.includes('sister-free')
  )
    codes.push('zuzu-gamebook-sister-free')
  if (after.endings.length > before.endings.length) {
    const tone = scene(after.sceneId).ending
    const toned = tone && TONE_ACHIEVEMENTS[tone]
    if (toned) codes.push(toned)
    if (after.sceneId === 'ending-four') codes.push('zuzu-gamebook-one-fire')
  }
  return codes
}

/** The endings reached in play grew from `before` to `after`. */
export function collectionAchievements(
  before: readonly string[],
  after: readonly string[],
): string[] {
  if (after.length <= before.length) return []
  const codes: string[] = []
  const tones = new Set(after.map((id) => scene(id).ending).filter(Boolean))
  if (tones.size >= 3) codes.push('zuzu-gamebook-three-tones')
  if (after.length >= 5) codes.push('zuzu-gamebook-five-endings')
  if (ENDING_IDS.every((id) => after.includes(id)))
    codes.push('zuzu-gamebook-every-ending')
  return codes
}
