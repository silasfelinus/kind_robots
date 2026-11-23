/** Persisted career progression, independent of a particular run or game over. */
export type SpectrumMode = 'story' | 'classic'
export type BubbleStyle = 'glass' | 'candy' | 'starlight' | 'prismatic'
export type SpectrumCareer = {
  xp: number
  highestStage: number
  stars: number[]
  lifetimePops: number
  classicBest: number
  classicRuns: number
}
export type SpectrumSave = {
  version: 2
  career: SpectrumCareer
  mode: SpectrumMode
  stage: number
  style: BubbleStyle
}
export const MAX_STORY_STAGE = 30
export const BUBBLE_STYLES: readonly BubbleStyle[] = [
  'glass',
  'candy',
  'starlight',
  'prismatic',
]
export function unlockedStyles(rank: number): BubbleStyle[] {
  return BUBBLE_STYLES.slice(
    0,
    rank >= 15 ? 4 : rank >= 9 ? 3 : rank >= 4 ? 2 : 1,
  )
}
export const freshCareer = (): SpectrumCareer => ({
  xp: 0,
  highestStage: 1,
  stars: Array<number>(MAX_STORY_STAGE).fill(0),
  lifetimePops: 0,
  classicBest: 0,
  classicRuns: 0,
})
const validNumber = (n: unknown, max: number) =>
  typeof n === 'number' && Number.isSafeInteger(n) && n >= 0 && n <= max

/** A higher rank needs increasingly more play. No paid energy or daily gate. */
export function rankForXp(xp: number): number {
  return Math.max(1, Math.floor(Math.sqrt(Math.max(0, xp) / 120)) + 1)
}
export function styleForRank(rank: number): BubbleStyle {
  return rank >= 15
    ? 'prismatic'
    : rank >= 9
      ? 'starlight'
      : rank >= 4
        ? 'candy'
        : 'glass'
}
export function readSpectrumSave(raw: unknown): SpectrumSave {
  const fresh = freshCareer()
  if (!raw || typeof raw !== 'object' || Array.isArray(raw))
    return { version: 2, career: fresh, mode: 'story', stage: 1, style: 'glass' }
  const value = raw as Record<string, unknown>
  // Older checkpoints must remain playable after this update.
  if (
    value.version === 1 &&
    validNumber(value.stage, MAX_STORY_STAGE) &&
    (value.stage as number) >= 1
  ) {
    const stage = value.stage as number
    return {
      version: 2,
      career: { ...fresh, highestStage: stage },
      mode: 'story',
      stage,
      style: 'glass',
    }
  }
  if (value.version !== 2) {
    return { version: 2, career: fresh, mode: 'story', stage: 1, style: 'glass' }
  }
  const v = value.career
  if (!v || typeof v !== 'object' || Array.isArray(v))
    return { version: 2, career: fresh, mode: 'story', stage: 1, style: 'glass' }
  const c = v as Record<string, unknown>
  const highestStage = validNumber(c.highestStage, MAX_STORY_STAGE)
    ? Math.max(1, c.highestStage as number)
    : 1
  const stars =
    Array.isArray(c.stars) && c.stars.length === MAX_STORY_STAGE
      ? c.stars.map((n) => (validNumber(n, 3) ? n : 0))
      : fresh.stars
  const career: SpectrumCareer = {
    xp: validNumber(c.xp, 1_000_000_000) ? (c.xp as number) : 0,
    highestStage,
    stars,
    lifetimePops: validNumber(c.lifetimePops, 1_000_000_000)
      ? (c.lifetimePops as number)
      : 0,
    classicBest: validNumber(c.classicBest, 1_000_000_000)
      ? (c.classicBest as number)
      : 0,
    classicRuns: validNumber(c.classicRuns, 1_000_000)
      ? (c.classicRuns as number)
      : 0,
  }
  const mode = value.mode === 'classic' ? 'classic' : 'story'
  const stage =
    mode === 'classic'
      ? 1
      : validNumber(value.stage, highestStage) &&
          (value.stage as number) >= 1
        ? (value.stage as number)
        : highestStage
  const unlocks = unlockedStyles(rankForXp(career.xp))
  const style = unlocks.includes(value.style as BubbleStyle)
    ? (value.style as BubbleStyle)
    : 'glass'
  return { version: 2, career, mode, stage, style }
}
/** Replace, never mutate, career snapshots previously passed to the store. */
export function recordClear(
  career: SpectrumCareer,
  stage: number,
  shots: number,
  matched: number,
): SpectrumCareer {
  if (stage < 1 || stage > MAX_STORY_STAGE) return career
  const starsEarned = shots <= 12 ? 3 : shots <= 20 ? 2 : 1
  const stars = [...career.stars]
  const previous = stars[stage - 1] ?? 0
  stars[stage - 1] = Math.max(previous, starsEarned)
  return {
    ...career,
    xp: Math.min(1_000_000_000, career.xp + 100 + 40 * starsEarned + matched * 4),
    highestStage: Math.max(career.highestStage, Math.min(30, stage + 1)),
    stars,
  }
}
export function recordPop(
  career: SpectrumCareer,
  matched: number,
  dropped: number,
): SpectrumCareer {
  const count = Math.max(0, matched + dropped)
  return {
    ...career,
    xp: Math.min(1_000_000_000, career.xp + count * 5),
    lifetimePops: Math.min(1_000_000_000, career.lifetimePops + count),
  }
}
export function recordClassicEnd(
  career: SpectrumCareer,
  score: number,
): SpectrumCareer {
  return {
    ...career,
    classicRuns: career.classicRuns + 1,
    classicBest: Math.max(career.classicBest, score),
  }
}
