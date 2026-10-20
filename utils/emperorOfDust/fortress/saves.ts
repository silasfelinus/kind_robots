import { followerDef, itemDef } from './followers'
import { LAST_DAY, questDef } from './content'
import { rerollDawn, validMapState } from './engine'
import { KINGDOM_FACTIONS, LOCAL_FACTIONS } from './types'
import type { Codex, FortressRun } from './types'

/**
 * A save book is the current run plus a snapshot taken at every dawn, so the
 * player can rewind to the start of any earlier day. Rewinding bumps the run's
 * branch: quests, petitions and rolls after that point are drawn fresh.
 */
export type SaveBook = {
  version: 3
  current: FortressRun
  /** dawns[i] is the run as it stood at dawn of day i + 1. */
  dawns: FortressRun[]
}

export type SlotRecord = {
  version: 3
  label: string
  savedAt: string
  book: SaveBook
}

export const SLOT_COUNT = 3
const MAX_RAW = 3_000_000

const object = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const int = (value: unknown, low: number, high: number): value is number =>
  Number.isSafeInteger(value) &&
  (value as number) >= low &&
  (value as number) <= high

const text = (value: unknown, max = 200): value is string =>
  typeof value === 'string' && value.length > 0 && value.length <= max

const textList = (value: unknown, max = 2000): value is string[] =>
  Array.isArray(value) && value.length <= max && value.every((v) => text(v))

const record = (
  value: unknown,
  keys: readonly string[],
  low: number,
  high: number,
): boolean =>
  object(value) &&
  Object.keys(value).length === keys.length &&
  keys.every((key) => int(value[key], low, high))

const factionList = (value: unknown): boolean =>
  Array.isArray(value) &&
  value.every((id) => (KINGDOM_FACTIONS as readonly unknown[]).includes(id)) &&
  new Set(value).size === value.length

export const validateRun = (value: unknown): value is FortressRun => {
  if (!object(value)) return false
  const run = value
  if (
    run.version !== 3 ||
    !int(run.seed, -(2 ** 53) + 1, 2 ** 53 - 1) ||
    !int(run.branch, 0, 1_000_000) ||
    !int(run.day, 1, LAST_DAY + 1) ||
    !int(run.brass, -100_000, 1_000_000) ||
    !int(run.loans, 0, 1000) ||
    !record(run.local, LOCAL_FACTIONS, 0, 30) ||
    !record(run.affinity, KINGDOM_FACTIONS, -100, 100) ||
    !record(run.strength, KINGDOM_FACTIONS, 0, 10) ||
    !factionList(run.revealedFactions) ||
    !factionList(run.wipedOut) ||
    ![6, 9, 12].includes(run.beds as number) ||
    !textList(run.recruitable) ||
    !textList(run.inventory) ||
    !textList(run.audiencesHeard) ||
    !textList(run.flags, 5000) ||
    !textList(run.equippedRelics, 2) ||
    !object(run.relicUses) ||
    !Object.values(run.relicUses).every((act) => int(act, 1, 5)) ||
    (run.hideout !== undefined && !text(run.hideout, 60)) ||
    (run.dayAudiences !== undefined && !textList(run.dayAudiences, 20)) ||
    (run.audienceBeats !== undefined &&
      (!object(run.audienceBeats) ||
        Object.keys(run.audienceBeats).length > 20 ||
        !Object.values(run.audienceBeats).every((beat) => text(beat, 80)))) ||
    (run.talksHeard !== undefined && !textList(run.talksHeard, 500)) ||
    (run.talkDay !== undefined && !int(run.talkDay, 1, LAST_DAY + 1)) ||
    (run.talkOpen !== undefined &&
      (!object(run.talkOpen) ||
        !text(run.talkOpen.id, 80) ||
        (run.talkOpen.beat !== undefined && !text(run.talkOpen.beat, 80)))) ||
    !validMapState(run)
  )
    return false
  const day = run.day as number
  if (
    !(run.recruitable as string[]).every((id) => !!followerDef(id)) ||
    !(run.inventory as string[]).every((id) => !!itemDef(id))
  )
    return false
  if (
    !Array.isArray(run.roster) ||
    run.roster.length > 20 ||
    new Set(run.roster.map((s: unknown) => (object(s) ? s.id : null))).size !==
      run.roster.length ||
    !run.roster.every(
      (state: unknown) =>
        object(state) &&
        text(state.id, 10) &&
        !!followerDef(state.id) &&
        int(state.joinedDay, 1, LAST_DAY) &&
        (state.injuredUntilDay === undefined ||
          int(state.injuredUntilDay, 1, LAST_DAY + 20)) &&
        (state.dead === undefined || typeof state.dead === 'boolean') &&
        (state.deathDay === undefined ||
          int(state.deathDay, 1, LAST_DAY + 1)) &&
        object(state.equipment) &&
        Object.entries(state.equipment).every(
          ([slot, id]) =>
            (slot === 'tool' || slot === 'charm') &&
            text(id, 60) &&
            itemDef(id)?.slot === slot,
        ),
    )
  )
    return false
  const rosterIds = new Set(
    (run.roster as { id: string }[]).map((state) => state.id),
  )
  if (
    !Array.isArray(run.board) ||
    !run.board.every(
      (entry: unknown) =>
        object(entry) &&
        text(entry.questId, 120) &&
        !!questDef(entry.questId) &&
        int(entry.postedDay, 1, LAST_DAY) &&
        int(entry.lastDay, 1, LAST_DAY + 3),
    )
  )
    return false
  const busy: string[] = []
  if (
    !Array.isArray(run.active) ||
    !run.active.every((entry: unknown) => {
      if (!object(entry) || !Array.isArray(entry.party)) return false
      busy.push(...(entry.party as string[]))
      return (
        text(entry.questId, 120) &&
        !!questDef(entry.questId) &&
        entry.party.length >= 1 &&
        entry.party.length <= 5 &&
        entry.party.every((id: unknown) => text(id, 10) && rosterIds.has(id)) &&
        int(entry.departedDay, 1, day) &&
        int(entry.returnsDay, day, LAST_DAY + 4) &&
        int(entry.postedDay, 1, LAST_DAY) &&
        int(entry.lastDay, 1, LAST_DAY + 3)
      )
    })
  )
    return false
  // No follower may be on two quests at once.
  if (new Set(busy).size !== busy.length) return false
  return (
    Array.isArray(run.reports) &&
    run.reports.length <= LAST_DAY + 1 &&
    run.reports.every(
      (report: unknown) =>
        object(report) &&
        int(report.day, 1, LAST_DAY + 1) &&
        Array.isArray(report.quests) &&
        int(report.taxes, 0, 10_000) &&
        int(report.wages, 0, 10_000) &&
        typeof report.loanTaken === 'boolean' &&
        textList(report.events, 200),
    ) &&
    Array.isArray(run.memorials) &&
    run.memorials.every(
      (memorial: unknown) =>
        object(memorial) &&
        text(memorial.followerId, 10) &&
        text(memorial.questId, 120) &&
        int(memorial.day, 1, LAST_DAY + 1),
    )
  )
}

export const validateBook = (value: unknown): value is SaveBook => {
  if (!object(value) || value.version !== 3) return false
  if (!validateRun(value.current) || !Array.isArray(value.dawns)) return false
  const current = value.current
  return (
    value.dawns.length === Math.min(current.day, LAST_DAY) &&
    value.dawns.every(
      (dawn: unknown, i: number) =>
        validateRun(dawn) && dawn.day === i + 1 && dawn.seed === current.seed,
    )
  )
}

export const newBook = (run: FortressRun): SaveBook => ({
  version: 3,
  current: run,
  dawns: [run],
})

/** Record a newly begun day (call after finishDay). */
export const recordDawn = (book: SaveBook, run: FortressRun): SaveBook => ({
  version: 3,
  current: run,
  dawns: run.day > LAST_DAY ? book.dawns : [...book.dawns, run],
})

/** Replace the current run inside the same day (audiences, assignments). */
export const updateCurrent = (book: SaveBook, run: FortressRun): SaveBook => {
  if (run.day !== book.current.day)
    throw new Error('use recordDawn for a new day')
  return { ...book, current: run }
}

/**
 * Rewind to dawn of `day`. Later dawns are dropped and the branch advances, so
 * the replayed days roll fresh: seeded chores, quest results and injuries can
 * all come out differently.
 */
export const rewindTo = (book: SaveBook, day: number): SaveBook => {
  const dawn = book.dawns[day - 1]
  if (!dawn || day > book.current.day)
    throw new Error('no dawn saved for that day')
  const branch =
    Math.max(book.current.branch, ...book.dawns.map((d) => d.branch)) + 1
  const restored = rerollDawn({ ...dawn, branch })
  return {
    version: 3,
    current: restored,
    dawns: [...book.dawns.slice(0, day - 1), restored],
  }
}

export const encodeBook = (book: SaveBook): string => {
  if (!validateBook(book)) throw new Error('refusing to save an invalid run')
  return JSON.stringify(book)
}

export const decodeBook = (raw: string | null): SaveBook | null => {
  if (!raw || raw.length > MAX_RAW) return null
  try {
    const value: unknown = JSON.parse(raw)
    return validateBook(value) ? value : null
  } catch {
    return null
  }
}

export const encodeSlot = (
  label: string,
  book: SaveBook,
  savedAt: Date,
): string => {
  const record: SlotRecord = {
    version: 3,
    label: label.trim().slice(0, 60) || `Day ${book.current.day}`,
    savedAt: savedAt.toISOString(),
    book,
  }
  if (!validateBook(book)) throw new Error('refusing to save an invalid run')
  return JSON.stringify(record)
}

export const decodeSlot = (raw: string | null): SlotRecord | null => {
  if (!raw || raw.length > MAX_RAW) return null
  try {
    const value: unknown = JSON.parse(raw)
    if (
      !object(value) ||
      value.version !== 3 ||
      !text(value.label, 60) ||
      !text(value.savedAt, 40) ||
      Number.isNaN(Date.parse(value.savedAt)) ||
      !validateBook(value.book)
    )
      return null
    return value as SlotRecord
  } catch {
    return null
  }
}

export const emptyCodex = (): Codex => ({ version: 1, revealed: [] })

export const decodeCodex = (raw: string | null): Codex | null => {
  if (!raw || raw.length > 200_000) return null
  try {
    const value: unknown = JSON.parse(raw)
    if (
      !object(value) ||
      value.version !== 1 ||
      !textList(value.revealed, 5000)
    )
      return null
    return { version: 1, revealed: [...new Set(value.revealed as string[])] }
  } catch {
    return null
  }
}

export const mergeCodex = (codex: Codex, ids: readonly string[]): Codex => {
  const revealed = [...new Set([...codex.revealed, ...ids])]
  return revealed.length === codex.revealed.length
    ? codex
    : { version: 1, revealed }
}
