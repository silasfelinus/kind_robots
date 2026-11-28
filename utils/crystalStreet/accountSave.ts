import { repairRun, type LogEntry, type RunState } from './rules'
import { normalizeVolume } from './sound'
import { TIP_IDS } from './tips'
import type { ReadingSpeed } from './reading'
import type { EndingTier, SpecialEnding } from './types'

export const SCRAPBOOK_LIMIT = 80

export type CrystalStreetSettings = {
  textSize: 'small' | 'medium' | 'large'
  readingSpeed: ReadingSpeed
  contrast: 'normal' | 'high'
  motion: 'full' | 'reduced'
  /** Coach tips: during the first week only, always, or never. */
  tips: 'auto' | 'on' | 'off'
  /** Synthesised sound effects for rolls, cards, dusk and endings. */
  sound: 'on' | 'off'
  effectsVolume: number
  musicVolume: number
}

export const DEFAULT_SETTINGS: CrystalStreetSettings = {
  textSize: 'medium',
  readingSpeed: 'instant',
  contrast: 'normal',
  motion: 'full',
  tips: 'auto',
  sound: 'on',
  effectsVolume: 60,
  musicVolume: 80,
}

export function restoreSettings(raw: unknown): CrystalStreetSettings {
  const value = (raw && typeof raw === 'object' ? raw : {}) as Record<
    string,
    unknown
  >
  const pick = <T extends string>(key: string, options: readonly T[], d: T) =>
    options.includes(value[key] as T) ? (value[key] as T) : d
  return {
    textSize: pick(
      'textSize',
      ['small', 'medium', 'large'],
      DEFAULT_SETTINGS.textSize,
    ),
    readingSpeed: pick(
      'readingSpeed',
      ['normal', 'fast', 'instant'],
      DEFAULT_SETTINGS.readingSpeed,
    ),
    contrast: pick('contrast', ['normal', 'high'], DEFAULT_SETTINGS.contrast),
    motion: pick('motion', ['full', 'reduced'], DEFAULT_SETTINGS.motion),
    tips: pick('tips', ['auto', 'on', 'off'], DEFAULT_SETTINGS.tips),
    sound: pick('sound', ['on', 'off'], DEFAULT_SETTINGS.sound),
    effectsVolume: normalizeVolume(
      value.effectsVolume,
      DEFAULT_SETTINGS.effectsVolume,
    ),
    musicVolume: normalizeVolume(
      value.musicVolume,
      DEFAULT_SETTINGS.musicVolume,
    ),
  }
}

export type ScrapbookRun = {
  seed: string
  villain: string
  tier: EndingTier
  name: string
  avatar?: string
  archetype: string
  crew: string[]
  clues: number
  wins: number
  day: number
  endedAt: number
  highlights: LogEntry[]
  /** A faction collapse or the Final Girl's win. */
  special?: SpecialEnding
}

// friends: every companion ever recruited, so the scrapbook shows only the
// people you have actually met (Silas, 2026-10-24 PT).
export type Scrapbook = {
  runs: ScrapbookRun[]
  endings: string[]
  friends: string[]
}

export function emptyScrapbook(): Scrapbook {
  return { runs: [], endings: [], friends: [] }
}

export function restoreScrapbook(raw: unknown): Scrapbook {
  if (!raw || typeof raw !== 'object') return emptyScrapbook()
  const value = raw as Partial<Scrapbook>
  const runs = Array.isArray(value.runs)
    ? value.runs
        .filter((r): r is ScrapbookRun => validScrapbookRun(r))
        .slice(0, SCRAPBOOK_LIMIT)
    : []
  const friends = Array.isArray(value.friends)
    ? value.friends.filter((f): f is string => typeof f === 'string')
    : []
  return {
    runs,
    endings: Array.isArray(value.endings)
      ? value.endings.filter((e): e is string => typeof e === 'string')
      : [],
    // Older scrapbooks predate the friends list: everyone in a pasted week's
    // crew was met.
    friends: [...new Set([...friends, ...runs.flatMap((r) => r.crew ?? [])])],
  }
}

const object = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value)

const strings = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === 'string')

function validLog(value: unknown): boolean {
  return (
    object(value) &&
    typeof value.day === 'number' &&
    (value.phase === 'day' || value.phase === 'night') &&
    ['encounterId', 'title', 'choiceId', 'label', 'text', 'art'].every(
      (key) => typeof value[key] === 'string',
    ) &&
    typeof value.success === 'boolean'
  )
}

function validScrapbookRun(value: unknown): value is ScrapbookRun {
  return (
    object(value) &&
    ['seed', 'villain', 'name', 'archetype'].every(
      (key) => typeof value[key] === 'string',
    ) &&
    ['best', 'good', 'bittersweet', 'bad'].includes(String(value.tier)) &&
    (value.avatar === undefined || typeof value.avatar === 'string') &&
    strings(value.crew) &&
    ['clues', 'wins', 'day', 'endedAt'].every(
      (key) => typeof value[key] === 'number' && Number.isFinite(value[key]),
    ) &&
    Array.isArray(value.highlights) &&
    value.highlights.length <= 4 &&
    value.highlights.every(validLog) &&
    (value.special === undefined ||
      ['neighbors', 'officials', 'family', 'final-girl'].includes(
        String(value.special),
      ))
  )
}

function safeTree(value: unknown, depth = 0): boolean {
  if (depth > 32) return false
  if (Array.isArray(value))
    return value.every((item) => safeTree(item, depth + 1))
  if (!object(value)) return true
  return Object.entries(value).every(
    ([key, item]) =>
      !['__proto__', 'constructor', 'prototype'].includes(key) &&
      safeTree(item, depth + 1),
  )
}

const sections = ['run', 'scrapbook', 'settings', 'tips', 'reset'] as const
export type SaveSection = (typeof sections)[number]
export type SaveStamps = Record<SaveSection, number>

export function emptyStamps(): SaveStamps {
  return { run: 0, scrapbook: 0, settings: 0, tips: 0, reset: 0 }
}

export interface CrystalStreetSave {
  version: 1
  stamps: SaveStamps
  run: RunState | null
  scrapbook: Scrapbook
  settings: CrystalStreetSettings
  tips: string[]
}

export function accountSaveKey(owner: number): string {
  return `crystal-street-account-v1:${owner}`
}

export function parseCrystalStreetSave(source: string): CrystalStreetSave {
  if (new TextEncoder().encode(source).byteLength > 2 * 1024 * 1024)
    throw new Error('Oversized Crystal Street save.')
  const raw: unknown = JSON.parse(source)
  if (
    !object(raw) ||
    !safeTree(raw) ||
    raw.version !== 1 ||
    !object(raw.stamps) ||
    !object(raw.scrapbook) ||
    !object(raw.settings) ||
    !strings(raw.tips)
  )
    throw new Error('Invalid Crystal Street save.')
  const stamps = raw.stamps
  if (
    !sections.every(
      (key) =>
        typeof stamps[key] === 'number' &&
        Number.isSafeInteger(stamps[key]) &&
        Number(stamps[key]) >= 0,
    ) ||
    Number(stamps.reset) > Number(stamps.scrapbook)
  )
    throw new Error('Invalid Crystal Street save timestamps.')
  const book = raw.scrapbook
  if (
    !Array.isArray(book.runs) ||
    book.runs.length > SCRAPBOOK_LIMIT ||
    !book.runs.every(validScrapbookRun) ||
    !strings(book.endings) ||
    !strings(book.friends)
  )
    throw new Error('Invalid Crystal Street scrapbook.')
  const run = raw.run === null ? null : repairRun(raw.run)
  if (raw.run !== null && (!run || !run.log.every(validLog)))
    throw new Error('Invalid Crystal Street week.')
  return {
    version: 1,
    stamps: Object.fromEntries(
      sections.map((key) => [key, stamps[key]]),
    ) as SaveStamps,
    run,
    scrapbook: restoreScrapbook(book),
    settings: restoreSettings(raw.settings),
    tips: TIP_IDS.filter((id) => (raw.tips as string[]).includes(id)),
  }
}

export function mergeCrystalStreetSaves(
  local: CrystalStreetSave,
  remote: CrystalStreetSave,
): CrystalStreetSave {
  const newer = (section: SaveSection) =>
    local.stamps[section] > remote.stamps[section] ? local : remote
  let scrapbook: Scrapbook
  if (local.stamps.reset !== remote.stamps.reset) {
    scrapbook = newer('reset').scrapbook
  } else {
    const newest = newer('scrapbook')
    const older = newest === local ? remote : local
    const runs = new Map<string, ScrapbookRun>()
    for (const run of [...newest.scrapbook.runs, ...older.scrapbook.runs])
      if (!runs.has(run.seed)) runs.set(run.seed, run)
    scrapbook = {
      runs: [...runs.values()]
        .sort((a, b) => b.endedAt - a.endedAt || a.seed.localeCompare(b.seed))
        .slice(0, SCRAPBOOK_LIMIT),
      endings: [
        ...new Set([...local.scrapbook.endings, ...remote.scrapbook.endings]),
      ].sort(),
      friends: [
        ...new Set([...local.scrapbook.friends, ...remote.scrapbook.friends]),
      ].sort(),
    }
  }
  return {
    version: 1,
    stamps: Object.fromEntries(
      sections.map((key) => [
        key,
        Math.max(local.stamps[key], remote.stamps[key]),
      ]),
    ) as SaveStamps,
    run: newer('run').run,
    scrapbook,
    settings: newer('settings').settings,
    tips: newer('tips').tips,
  }
}
