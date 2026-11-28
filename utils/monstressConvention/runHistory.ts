// /utils/monstressConvention/runHistory.ts
//
// MONSTRIQUE case files: one entry per finished case (an ending reached),
// kept per edition beside the case save in the browser and in the account
// save. A case file is a permanent record of a run, like a scrapbook unlock:
// a new case never erases it, devices merge theirs, and only the edition's
// own "Erase case and keepsakes" clears it. The general edition never keeps
// or shows a mature-only detail.

import {
  CASE_ENDINGS,
  caseScore,
  maxScore,
  type CaseEnding,
  type CaseState,
} from './prologue'
import { GENERAL_MAX_SCORE, generalCaseScore } from './achievements'
import type { MonstriqueAudience } from './edition'

export const RUN_HISTORY_LIMIT = 30

type RunNote = {
  /** What the case file says when the player did it. */
  done: string
  /** The alternate route the case file points at when they did not. */
  missed: string
  earned: (state: CaseState) => boolean
  mature?: true
}

const has = (state: CaseState, key: string) =>
  state.evidence.includes(key) || state.flags.includes(key)

/** In the order a case file suggests them: the bucket trail first. */
export const RUN_NOTES = {
  'prop-mark': {
    done: 'The knife’s Beach Hex stamp was read',
    missed: 'Nobody read the maker’s stamp on the knife.',
    earned: (state) => has(state, 'knife-prop-mark'),
  },
  shrine: {
    done: 'The lobby shrine’s dents were counted',
    missed: 'Nobody counted the dents in the lobby shrine.',
    earned: (state) => has(state, 'shrine-photo'),
  },
  'ice-ring': {
    done: 'Iris found where the ice bucket stood',
    missed: 'Nobody noticed where Room 205’s ice bucket used to stand.',
    earned: (state) => has(state, 'ice-ring'),
  },
  bucket: {
    done: 'The missing ice bucket turned up',
    missed: 'The missing ice bucket never turned up.',
    earned: (state) => has(state, 'makeup-smear'),
  },
  'fangs-returned': {
    done: 'Violet got her rental fangs back',
    missed: 'Violet never got her forty-dollar fangs back.',
    earned: (state) => has(state, 'fangs-returned'),
  },
  'violet-paid': {
    done: 'Violet’s fee was paid in full',
    missed: 'You never settled Violet’s side of the bill.',
    earned: (state) => has(state, 'violet-paid'),
  },
  'harker-file': {
    done: 'Odette opened Harker File #1',
    missed: 'Odette never opened Harker File #1 for you.',
    earned: (state) => has(state, 'harker-file'),
  },
  'fan-cleared': {
    done: 'Gavin was cleared',
    missed: 'Gavin was never cleared.',
    earned: (state) => has(state, 'fan-exonerated'),
  },
  'tag-team': {
    done: 'Iris and Norb both asked questions',
    missed: 'Norb never asked a question himself.',
    earned: (state) =>
      state.asked.some((entry) => entry.startsWith('iris:')) &&
      state.asked.some((entry) => entry.startsWith('nico:')),
  },
  billboard: {
    done: 'Iris snapped the billboard',
    missed: 'The big billboard went unphotographed.',
    earned: (state) => has(state, 'billboard-shot'),
  },
  'cold-kiss': {
    done: 'Violet said thank you the cold way',
    missed: 'Violet never said thank you the cold way.',
    earned: (state) => has(state, 'ghost-kiss'),
    mature: true,
  },
} satisfies Record<string, RunNote>

export type RunNoteId = keyof typeof RUN_NOTES

const NOTE_IDS = Object.keys(RUN_NOTES) as RunNoteId[]
const MATURE_NOTES = new Set<string>(
  NOTE_IDS.filter((id) => (RUN_NOTES[id] as RunNote).mature),
)

/** Where each ending leaves the case, and the route it did not take. */
export const ENDING_ROUTE_NOTES: Record<CaseEnding, string> = {
  reckless:
    'Filed from the desk before the knife, the clock and the alibi were in. The patient route ends across town.',
  'lead-earned':
    'Filed with the convention lead. The bucket trail back at the motel went cold.',
  'fifth-hexblade':
    'Filed in full, bucket trail and all. One more headline exists, for the impatient.',
}

export interface CaseRun {
  id: string
  ending: CaseEnding
  edition: MonstriqueAudience
  finishedAt: string
  seed: number
  score: number
  maxScore: number
  /** Actions that changed the case, from check-in to the ending. */
  moves: number
  clues: number
  notes: RunNoteId[]
  /** Norb's rebuffs; always 0 in the general edition. */
  rebuffs: number
}

function notesFor(state: CaseState, edition: MonstriqueAudience): RunNoteId[] {
  return NOTE_IDS.filter(
    (id) =>
      (edition === 'mature' || !MATURE_NOTES.has(id)) &&
      (RUN_NOTES[id] as RunNote).earned(state),
  )
}

/** The case file for a case that just reached its ending; null otherwise. */
export function runEntryFor(
  state: CaseState,
  edition: MonstriqueAudience,
  finishedAt: string,
): CaseRun | null {
  if (!state.ending) return null
  const general = edition === 'general'
  return {
    id: finishedAt + '-' + state.seed + '-' + state.ending,
    ending: state.ending,
    edition,
    finishedAt,
    seed: state.seed,
    score: general ? generalCaseScore(state) : caseScore(state),
    maxScore: general ? GENERAL_MAX_SCORE : maxScore('mature'),
    moves: Math.max(0, state.transcript.length - 1),
    clues: state.evidence.length,
    notes: notesFor(state, edition),
    rebuffs: general ? 0 : state.rebuffs,
  }
}

const byNewest = (a: CaseRun, b: CaseRun) =>
  b.finishedAt.localeCompare(a.finishedAt) || a.id.localeCompare(b.id)

/** Adds the finished case to the front of the history. */
export function recordRun(
  runs: CaseRun[],
  state: CaseState,
  edition: MonstriqueAudience,
  finishedAt: string,
): CaseRun[] {
  const entry = runEntryFor(state, edition, finishedAt)
  if (!entry) return runs
  return mergeRuns([entry], runs)
}

/** Case files are permanent: merging keeps every run from both copies. */
export function mergeRuns(a: CaseRun[], b: CaseRun[]): CaseRun[] {
  const seen = new Map<string, CaseRun>()
  for (const run of [...a, ...b]) if (!seen.has(run.id)) seen.set(run.id, run)
  return [...seen.values()].sort(byNewest).slice(0, RUN_HISTORY_LIMIT)
}

const count = (value: unknown, max: number): number | null =>
  Number.isInteger(value) && (value as number) >= 0 && (value as number) <= max
    ? (value as number)
    : null

function parseRun(value: unknown, edition: MonstriqueAudience): CaseRun | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const raw = value as Record<string, unknown>
  if (raw.edition !== edition) return null
  if (!CASE_ENDINGS.includes(raw.ending as CaseEnding)) return null
  if (
    typeof raw.id !== 'string' ||
    raw.id.length > 80 ||
    typeof raw.finishedAt !== 'string' ||
    raw.finishedAt.length > 40 ||
    !Number.isFinite(Date.parse(raw.finishedAt))
  )
    return null
  if (!Number.isSafeInteger(raw.seed)) return null
  const top = edition === 'general' ? GENERAL_MAX_SCORE : maxScore('mature')
  const score = count(raw.score, top)
  const moves = count(raw.moves, 100000)
  const clues = count(raw.clues, 1000)
  const rebuffs = count(raw.rebuffs, 1000)
  if (
    score === null ||
    raw.maxScore !== top ||
    moves === null ||
    clues === null ||
    rebuffs === null ||
    !Array.isArray(raw.notes)
  )
    return null
  const notes = NOTE_IDS.filter(
    (id) =>
      (raw.notes as unknown[]).includes(id) &&
      (edition === 'mature' || !MATURE_NOTES.has(id)),
  )
  return {
    id: raw.id,
    ending: raw.ending as CaseEnding,
    edition,
    finishedAt: raw.finishedAt,
    seed: raw.seed as number,
    score,
    maxScore: top,
    moves,
    clues,
    notes,
    rebuffs: edition === 'general' ? 0 : rebuffs,
  }
}

/**
 * Validates an untrusted case-file list for one edition. Entries from the
 * other edition, or unreadable ones, are dropped; mature-only details never
 * survive into the general edition.
 */
export function parseRuns(
  value: unknown,
  edition: MonstriqueAudience,
): CaseRun[] {
  if (!Array.isArray(value)) return []
  const runs: CaseRun[] = []
  for (const entry of value.slice(0, RUN_HISTORY_LIMIT * 2)) {
    const run = parseRun(entry, edition)
    if (run) runs.push(run)
  }
  return mergeRuns(runs, [])
}

/** The alternate routes a case file points at, most useful first. */
export function missedLeads(run: CaseRun, limit = 3): string[] {
  return NOTE_IDS.filter(
    (id) =>
      !run.notes.includes(id) &&
      (run.edition === 'mature' || !MATURE_NOTES.has(id)),
  )
    .slice(0, limit)
    .map((id) => RUN_NOTES[id].missed)
}

export function noteLabels(run: CaseRun): string[] {
  return run.notes.map((id) => RUN_NOTES[id].done)
}

export function bestRun(runs: CaseRun[]): CaseRun | null {
  return runs.reduce<CaseRun | null>(
    (best, run) => (!best || run.score > best.score ? run : best),
    null,
  )
}

/**
 * Each new case after the first gets the next seed, so the narrator's quips
 * vary from case to case and every case file records the seed to replay it.
 */
export function nextCaseSeed(runs: CaseRun[]): number {
  return runs.reduce((top, run) => Math.max(top, run.seed), 0) + 1
}
