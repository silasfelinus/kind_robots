/**
 * Save the Plumber's saves, kept by the Arcade cabinet on this device
 * (utils/arcade/saves.ts). Untrusted on the way back in.
 *
 * Generation 2 (conductor save-the-plumber t-011, projects/kr-arcade/
 * GEN2-STANDARD.md section 3): the cabinet keeps a *file* of three slots, SMB3
 * style, and each slot remembers where the heroine stands on the world map,
 * every stage she has cleared (and by which exit), the Golden Gears she found,
 * deaths and play time. A version-1 save (one resume point) loads into slot 1
 * with every stage before its resume point counted as cleared, so nobody loses
 * a run to the upgrade.
 */
import { CAMPAIGN } from './savePlumberLevels'

/** One save slot: a heroine's whole adventure. */
export type PlumberSlot = {
  /** The roster seed picked on the cabinet's heroine select. */
  heroine: number
  /** Index into the campaign's stages to continue from (the stage at `node`). */
  stage: number
  /** The world-map node she stands on (savePlumberOverworld.ts ids). */
  node?: string
  /** Stage codes cleared by their normal exit. */
  done?: string[]
  /** Stage codes cleared by a secret exit. */
  secrets?: string[]
  score: number
  lives: number
  tokens: number
  /** World 1 has been cleared at least once. */
  cleared?: boolean
  /** Stage codes whose Golden Gear has been found, kept across runs. */
  gears?: string[]
  /** Lives lost on this slot. */
  deaths?: number
  /** Seconds played on this slot. */
  time?: number
}

/**
 * The active slot as the rest of the app reads it (the front page, tests):
 * the version-1 shape plus the slot's Gen-2 memory and the device's Endless
 * best.
 */
export type PlumberSave = PlumberSlot & {
  v: 1
  /** The longest Endless run, in metres (tiles). */
  endlessBest?: number
}

/** What the cabinet actually stores: three slots and the Endless best. */
export type PlumberFile = {
  v: 2
  /** The slot being played (0-2). */
  active: number
  slots: (PlumberSlot | null)[]
  endlessBest: number
}

export const PLUMBER_SLUG = 'save-the-plumber'
export const SLOT_COUNT = 3

const count = (v: unknown, max: number): v is number =>
  typeof v === 'number' && Number.isInteger(v) && v >= 0 && v <= max

const isStageCode = (code: unknown): code is string =>
  typeof code === 'string' && CAMPAIGN.some((s) => s.code === code)

/** Real stage codes, each once. */
function codes(raw: unknown): string[] {
  return Array.isArray(raw) ? [...new Set(raw.filter(isStageCode))] : []
}

/** A slot from untrusted data, or null. Missing Gen-2 fields are derived. */
export function readPlumberSlot(raw: unknown): PlumberSlot | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>
  if (!count(r.heroine, 0xffffffff)) return null
  if (!count(r.stage, CAMPAIGN.length - 1)) return null
  if (!count(r.score, 99_999_999) || !count(r.lives, 99)) return null
  if (!count(r.tokens, 99)) return null
  const stage = r.stage
  // A version-1 save only knew its resume point: everything before it was cleared.
  const done = Array.isArray(r.done)
    ? codes(r.done)
    : CAMPAIGN.slice(0, stage).map((s) => s.code)
  return {
    heroine: r.heroine,
    stage,
    node:
      typeof r.node === 'string' && /^[a-z0-9-]{1,24}$/.test(r.node)
        ? r.node
        : CAMPAIGN[stage]!.code,
    done,
    secrets: codes(r.secrets),
    score: r.score,
    lives: Math.max(1, r.lives),
    tokens: r.tokens,
    cleared: r.cleared === true,
    gears: codes(r.gears),
    deaths: count(r.deaths, 999_999) ? r.deaths : 0,
    time: count(r.time, 99_999_999) ? r.time : 0,
  }
}

/** The cabinet's file from untrusted data: a version-2 file, or a version-1 save moved into slot 1. */
export function readPlumberFile(raw: unknown): PlumberFile {
  const empty: PlumberFile = {
    v: 2,
    active: 0,
    slots: Array(SLOT_COUNT).fill(null),
    endlessBest: 0,
  }
  if (!raw || typeof raw !== 'object') return empty
  const r = raw as Record<string, unknown>
  const best = (v: unknown) => (count(v, 9_999_999) ? v : 0)
  if (r.v === 2) {
    const slots = Array.isArray(r.slots) ? r.slots : []
    return {
      v: 2,
      active: count(r.active, SLOT_COUNT - 1) ? r.active : 0,
      slots: Array.from({ length: SLOT_COUNT }, (_, i) =>
        readPlumberSlot(slots[i]),
      ),
      endlessBest: best(r.endlessBest),
    }
  }
  if (r.v !== 1) return empty
  const slot = readPlumberSlot(r)
  return {
    ...empty,
    slots: [slot, null, null],
    endlessBest: best(r.endlessBest),
  }
}

/** The active slot, in the shape the front page reads, or null before the first game. */
export function readPlumberSave(raw: unknown): PlumberSave | null {
  const file = readPlumberFile(raw)
  const slot = file.slots[file.active]
  if (!slot) return null
  return { v: 1, ...slot, endlessBest: file.endlessBest }
}
