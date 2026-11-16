import { partyIds } from './engine'
import { CHARACTERS } from './roster'
import type { EndingId, HeroSetup, RunState } from './types'

// The chronicle is everything that outlives a single delve: one page per
// finished run, everyone the player has delved with, support scenes seen,
// endings reached and totals the achievements read. Saves are separate: three
// slots plus an autosave, each a whole run.

export const CHRONICLE_VERSION = 1
export const SAVES_VERSION = 1
export const SAVE_SLOTS = 3

export type RunPage = {
  id: string
  seed: number
  finishedAt: string
  hero: HeroSetup
  companions: string[]
  partners: string[]
  oaths: string[]
  ending: EndingId
  layer: number
  gold: number
  fights: number
  puzzles: number
  chests: number
  choices: string[]
}

export type Chronicle = {
  version: typeof CHRONICLE_VERSION
  runs: RunPage[]
  met: string[]
  supports: string[]
  endings: EndingId[]
  puzzles: number
  delves: number
  awarded: string[]
  lastHero: HeroSetup | null
}

export type SaveSlot = {
  slot: number | 'auto'
  savedAt: string
  label: string
  run: RunState
}

export type SaveFile = {
  version: typeof SAVES_VERSION
  slots: SaveSlot[]
}

export function emptyChronicle(): Chronicle {
  return {
    version: CHRONICLE_VERSION,
    runs: [],
    met: [],
    supports: [],
    endings: [],
    puzzles: 0,
    delves: 0,
    awarded: [],
    lastHero: null,
  }
}

const isObject = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === 'object' && !Array.isArray(v)

/** Null when the record exists but cannot be read; the store then holds it untouched. */
export function decodeChronicle(text: string | null): Chronicle | null {
  if (!text) return emptyChronicle()
  try {
    const raw = JSON.parse(text) as unknown
    if (!isObject(raw) || raw.version !== CHRONICLE_VERSION) return null
    const base = emptyChronicle()
    return {
      ...base,
      ...raw,
      runs: Array.isArray(raw.runs) ? (raw.runs as RunPage[]) : [],
      met: Array.isArray(raw.met) ? (raw.met as string[]) : [],
      supports: Array.isArray(raw.supports) ? (raw.supports as string[]) : [],
      endings: Array.isArray(raw.endings) ? (raw.endings as EndingId[]) : [],
      awarded: Array.isArray(raw.awarded) ? (raw.awarded as string[]) : [],
    } as Chronicle
  } catch {
    return null
  }
}

export function decodeSaves(text: string | null): SaveFile | null {
  if (!text) return { version: SAVES_VERSION, slots: [] }
  try {
    const raw = JSON.parse(text) as unknown
    if (
      !isObject(raw) ||
      raw.version !== SAVES_VERSION ||
      !Array.isArray(raw.slots)
    )
      return null
    const slots = (raw.slots as SaveSlot[]).filter(
      (s) =>
        isObject(s) && isObject(s.run) && (s.run as RunState).version === 1,
    )
    return { version: SAVES_VERSION, slots }
  } catch {
    return null
  }
}

function union<T>(list: T[], add: readonly T[]): T[] {
  const out = [...list]
  for (const x of add) if (!out.includes(x)) out.push(x)
  return out
}

/** What starting a delve adds: everyone in the party has now been met. */
export function recordStart(chronicle: Chronicle, run: RunState): Chronicle {
  return {
    ...chronicle,
    delves: chronicle.delves + 1,
    met: union(chronicle.met, partyIds(run)),
    lastHero: { ...run.hero, drawnTo: [...run.hero.drawnTo] },
  }
}

/** What a live run proves so far: support scenes seen, puzzles solved. */
export function recordProgress(
  chronicle: Chronicle,
  run: RunState,
  solvedBefore: number,
): Chronicle {
  return {
    ...chronicle,
    supports: union(
      chronicle.supports,
      Object.keys(run.bonds).filter((key) => (run.bonds[key] ?? 0) >= 1),
    ),
    puzzles: chronicle.puzzles + Math.max(0, run.puzzlesSolved - solvedBefore),
  }
}

/** A finished run becomes a page. */
export function recordFinish(chronicle: Chronicle, run: RunState): Chronicle {
  if (!run.ending) return chronicle
  const page: RunPage = {
    id: `${run.seed}-${chronicle.runs.length + 1}`,
    seed: run.seed,
    finishedAt: new Date().toISOString(),
    hero: { ...run.hero, drawnTo: [...run.hero.drawnTo] },
    companions: [...run.companions],
    partners: [...run.partners],
    oaths: [...run.oaths],
    ending: run.ending,
    layer: run.layer,
    gold: run.gold,
    fights: run.fights,
    puzzles: run.puzzlesSolved,
    chests: run.chests,
    choices: [...run.choices],
  }
  return {
    ...chronicle,
    runs: [page, ...chronicle.runs].slice(0, 60),
    endings: union(chronicle.endings, [run.ending]),
  }
}

export function metCount(chronicle: Chronicle): string {
  return `${chronicle.met.length} of ${CHARACTERS.length} found`
}
