import { freshStoryChoices, STORY_DECISIONS, STORY_ENDINGS } from './story'
import type { StoryChoices, StoryEnding } from './story'

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
  /** Co-op Relay records (t-183): best shared score and most rounds cleared in one relay. */
  relayBest: number
  relayRounds: number
}
export type SpectrumSettings = {
  aimGuide: boolean
  particles: boolean
  highContrast: boolean
  music: boolean
  effects: boolean
  /** Music and effects levels under the Arcade master volume, 0..1 in tenths (t-188). */
  musicLevel: number
  effectsLevel: number
}
export const DEFAULT_SPECTRUM_SETTINGS: SpectrumSettings = {
  aimGuide: true,
  particles: true,
  highContrast: false,
  music: true,
  effects: true,
  musicLevel: 1,
  effectsLevel: 1,
}
const validLevel = (n: unknown) =>
  typeof n === 'number' && Number.isFinite(n) && n >= 0 && n <= 1
/** A saved level, in tenths; anything else is full level. */
export const readLevel = (n: unknown) =>
  validLevel(n) ? Math.round((n as number) * 10) / 10 : 1
export type SpectrumSave = {
  version: 2
  career: SpectrumCareer
  mode: SpectrumMode
  stage: number
  style: BubbleStyle
  settings: SpectrumSettings
  storyChoices?: StoryChoices
  endings?: StoryEnding[]
}
export const MAX_STORY_STAGE = 30
/** Rounds in a Co-op Relay (the last ends with the duet boss). */
export const RELAY_ROUND_COUNT = 6
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
  relayBest: 0,
  relayRounds: 0,
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
    return {
      version: 2,
      career: fresh,
      mode: 'story',
      stage: 1,
      style: 'glass',
      settings: { ...DEFAULT_SPECTRUM_SETTINGS },
    }
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
      settings: { ...DEFAULT_SPECTRUM_SETTINGS },
    }
  }
  if (value.version !== 2) {
    return {
      version: 2,
      career: fresh,
      mode: 'story',
      stage: 1,
      style: 'glass',
      settings: { ...DEFAULT_SPECTRUM_SETTINGS },
    }
  }
  const v = value.career
  if (!v || typeof v !== 'object' || Array.isArray(v))
    return {
      version: 2,
      career: fresh,
      mode: 'story',
      stage: 1,
      style: 'glass',
      settings: { ...DEFAULT_SPECTRUM_SETTINGS },
    }
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
    relayBest: validNumber(c.relayBest, 1_000_000_000)
      ? (c.relayBest as number)
      : 0,
    relayRounds: validNumber(c.relayRounds, RELAY_ROUND_COUNT)
      ? (c.relayRounds as number)
      : 0,
  }
  const mode = value.mode === 'classic' ? 'classic' : 'story'
  const stage =
    mode === 'classic'
      ? 1
      : validNumber(value.stage, highestStage) && (value.stage as number) >= 1
        ? (value.stage as number)
        : highestStage
  const unlocks = unlockedStyles(rankForXp(career.xp))
  const style = unlocks.includes(value.style as BubbleStyle)
    ? (value.style as BubbleStyle)
    : 'glass'
  const proposedChoices = value.storyChoices
  const storyChoices: StoryChoices =
    Array.isArray(proposedChoices) && proposedChoices.length === 3
      ? (proposedChoices.map((choice) =>
          choice === 0 || choice === 1 ? choice : null,
        ) as StoryChoices)
      : freshStoryChoices()
  const endings = Array.isArray(value.endings)
    ? ([...new Set(value.endings)].filter(
        (ending): ending is StoryEnding =>
          typeof ending === 'string' && ending in STORY_ENDINGS,
      ) as StoryEnding[])
    : []
  const proposed = value.settings
  const settings =
    proposed && typeof proposed === 'object' && !Array.isArray(proposed)
      ? (proposed as Partial<SpectrumSettings>)
      : {}
  return {
    version: 2,
    career,
    mode,
    stage,
    style,
    storyChoices,
    endings,
    settings: {
      aimGuide: settings.aimGuide !== false,
      particles: settings.particles !== false,
      highContrast: settings.highContrast === true,
      music: settings.music !== false,
      effects: settings.effects !== false,
      musicLevel: readLevel(settings.musicLevel),
      effectsLevel: readLevel(settings.effectsLevel),
    },
  }
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
    xp: Math.min(
      1_000_000_000,
      career.xp + 100 + 40 * starsEarned + matched * 4,
    ),
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

/** A finished or abandoned Co-op Relay keeps its best score and furthest round. */
export function recordRelay(
  career: SpectrumCareer,
  score: number,
  rounds: number,
): SpectrumCareer {
  return {
    ...career,
    relayBest: Math.max(career.relayBest, Math.max(0, Math.floor(score))),
    relayRounds: Math.max(
      career.relayRounds,
      Math.max(0, Math.min(RELAY_ROUND_COUNT, Math.floor(rounds))),
    ),
  }
}

/** Reject untrusted account data before writing it to a shared database. */
export function validSpectrumCloudSave(raw: unknown): raw is SpectrumSave {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return false
  const save = raw as Record<string, unknown>
  if (save.version !== 2 || !['story', 'classic'].includes(String(save.mode)))
    return false
  if (!validNumber(save.stage, MAX_STORY_STAGE) || save.stage === 0)
    return false
  const career = save.career
  if (!career || typeof career !== 'object' || Array.isArray(career))
    return false
  const c = career as Record<string, unknown>
  if (
    !validNumber(c.xp, 1_000_000_000) ||
    !validNumber(c.highestStage, MAX_STORY_STAGE) ||
    c.highestStage === 0 ||
    !validNumber(c.lifetimePops, 1_000_000_000) ||
    !validNumber(c.classicBest, 1_000_000_000) ||
    !validNumber(c.classicRuns, 1_000_000) ||
    !Array.isArray(c.stars) ||
    c.stars.length !== MAX_STORY_STAGE ||
    !c.stars.every((stars) => validNumber(stars, 3)) ||
    // Relay records arrived later: older saves omit them, newer ones must be in range.
    (c.relayBest !== undefined && !validNumber(c.relayBest, 1_000_000_000)) ||
    (c.relayRounds !== undefined &&
      !validNumber(c.relayRounds, RELAY_ROUND_COUNT))
  )
    return false
  if (
    save.mode === 'story' &&
    (save.stage as number) > (c.highestStage as number)
  )
    return false
  if (
    save.storyChoices !== undefined &&
    (!Array.isArray(save.storyChoices) ||
      save.storyChoices.length !== 3 ||
      !save.storyChoices.every(
        (choice, index) =>
          choice === null ||
          ((choice === 0 || choice === 1) &&
            (c.highestStage as number) > STORY_DECISIONS[index]!.stage),
      ))
  )
    return false
  if (
    save.endings !== undefined &&
    (!Array.isArray(save.endings) ||
      save.endings.length > 3 ||
      new Set(save.endings).size !== save.endings.length ||
      !save.endings.every(
        (ending) => typeof ending === 'string' && ending in STORY_ENDINGS,
      ))
  )
    return false
  const prefs = save.settings
  if (prefs !== undefined) {
    if (!prefs || typeof prefs !== 'object' || Array.isArray(prefs))
      return false
    const settings = prefs as Record<string, unknown>
    if (
      typeof settings.aimGuide !== 'boolean' ||
      typeof settings.particles !== 'boolean' ||
      typeof settings.highContrast !== 'boolean' ||
      (settings.music !== undefined && typeof settings.music !== 'boolean') ||
      (settings.effects !== undefined &&
        typeof settings.effects !== 'boolean') ||
      (settings.musicLevel !== undefined && !validLevel(settings.musicLevel)) ||
      (settings.effectsLevel !== undefined &&
        !validLevel(settings.effectsLevel))
    )
      return false
  }
  return unlockedStyles(rankForXp(c.xp as number)).includes(
    save.style as BubbleStyle,
  )
}

/**
 * Sync always preserves achievements. No device may reduce another's stars,
 * earned looks, lifetime milestone, or unlocked Story level.
 * Lifetime counters use max instead of sum because two devices may be syncing
 * an older copy of the same events. Summing would double-award XP.
 */
export function mergeSpectrumSaves(
  device: SpectrumSave,
  account: SpectrumSave,
): SpectrumSave {
  const local = readSpectrumSave(device)
  const remote = readSpectrumSave(account)
  const career: SpectrumCareer = {
    xp: Math.max(local.career.xp, remote.career.xp),
    highestStage: Math.max(
      local.career.highestStage,
      remote.career.highestStage,
    ),
    stars: local.career.stars.map((stars, index) =>
      Math.max(stars, remote.career.stars[index] ?? 0),
    ),
    lifetimePops: Math.max(
      local.career.lifetimePops,
      remote.career.lifetimePops,
    ),
    classicBest: Math.max(local.career.classicBest, remote.career.classicBest),
    classicRuns: Math.max(local.career.classicRuns, remote.career.classicRuns),
    relayBest: Math.max(local.career.relayBest, remote.career.relayBest),
    relayRounds: Math.max(local.career.relayRounds, remote.career.relayRounds),
  }
  const style = unlockedStyles(rankForXp(career.xp)).includes(local.style)
    ? local.style
    : remote.style
  return {
    version: 2,
    career,
    mode: local.mode,
    stage: local.mode === 'classic' ? 1 : career.highestStage,
    style,
    storyChoices: freshStoryChoices().map(
      (_, index) =>
        local.storyChoices?.[index] ?? remote.storyChoices?.[index] ?? null,
    ) as StoryChoices,
    endings: [
      ...new Set([...(remote.endings ?? []), ...(local.endings ?? [])]),
    ],
    settings: local.settings,
  }
}
