import { followerDef, itemDef } from './followers'
import { LAST_DAY, dueDef, questDef } from './content'
import { rerollDawn, validMapState } from './engine'
import { BUYER_IDS } from './betrayal'
import { isCodexId } from './codex'
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

const DEPARTURE_WHYS: readonly unknown[] = [
  'allegiance',
  'neglect',
  'kin',
  'persuaded',
]
const LEAVING_WHYS: readonly unknown[] = [...DEPARTURE_WHYS, 'dismissed']

/** Left with Komodo (t-028) or sent away (t-040): optional for older saves. */
const validDeparted = (value: unknown): boolean =>
  value === undefined ||
  (object(value) &&
    int(value.day, 1, LAST_DAY + 1) &&
    LEAVING_WHYS.includes(value.why) &&
    (value.reason === undefined || text(value.reason, 600)))

const TIERS: readonly unknown[] = ['triumph', 'success', 'partial', 'failure']

/** Help promised to quests (t-040): known quests, bounded text. */
const validAid = (value: unknown): boolean =>
  object(value) &&
  Object.keys(value).length <= 60 &&
  Object.entries(value).every(
    ([questId, list]) =>
      !!questDef(questId) &&
      Array.isArray(list) &&
      list.length <= 10 &&
      list.every(
        (aid: unknown) =>
          object(aid) &&
          aid.questId === questId &&
          text(aid.label, 200) &&
          (aid.bonus === undefined || int(aid.bonus, -50, 50)) &&
          (aid.stat === undefined || text(aid.stat, 10)) &&
          (aid.resolve === undefined || TIERS.includes(aid.resolve)) &&
          (aid.outcome === undefined || text(aid.outcome, 600)),
      ),
  )

/** Dues waiting for a later dawn (t-040): known ids, one of each. */
const validDues = (value: unknown): boolean =>
  Array.isArray(value) &&
  value.length <= 60 &&
  value.every(
    (due: unknown) =>
      object(due) &&
      text(due.id, 80) &&
      !!dueDef(due.id) &&
      int(due.day, 1, LAST_DAY + 1) &&
      int(due.from, 1, LAST_DAY + 1),
  ) &&
  new Set(value.map((due: { id: string }) => due.id)).size === value.length

/** A dawn's log lines: longer than labels, still bounded. */
const validEvents = (value: unknown): boolean =>
  Array.isArray(value) &&
  value.length <= 200 &&
  value.every((line) => text(line, 600))

/** The Day 41 dawn's record of the betrayal (t-028), when present. */
const validBetrayal = (value: unknown): boolean =>
  value === undefined ||
  (object(value) &&
    (BUYER_IDS as readonly unknown[]).includes(value.buyer) &&
    text(value.hideout, 60) &&
    Array.isArray(value.departed) &&
    value.departed.length <= 20 &&
    value.departed.every(
      (entry: unknown) =>
        object(entry) &&
        text(entry.followerId, 10) &&
        !!followerDef(entry.followerId) &&
        DEPARTURE_WHYS.includes(entry.why),
    ) &&
    (value.fell === undefined || text(value.fell, 800)) &&
    (value.why === undefined || text(value.why, 800)))

/** Market state (t-024): optional, so saves from before the market still load. */
const validMarket = (value: unknown): boolean =>
  object(value) &&
  int(value.window, 0, 14) &&
  textList(value.bought, 40) &&
  (value.bought as string[]).every((id) => !!itemDef(id)) &&
  int(value.day, 1, LAST_DAY + 1) &&
  textList(value.treated, 20) &&
  (value.treated as string[]).every((id) => !!followerDef(id)) &&
  new Set(value.treated as string[]).size === (value.treated as string[]).length

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
    (run.market !== undefined && !validMarket(run.market)) ||
    (run.aid !== undefined && !validAid(run.aid)) ||
    (run.dues !== undefined && !validDues(run.dues)) ||
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
        validDeparted(state.departed) &&
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
  const goneIds = new Set(
    (run.roster as { id: string; departed?: unknown }[])
      .filter((state) => state.departed)
      .map((state) => state.id),
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
        entry.party.every(
          (id: unknown) =>
            text(id, 10) && rosterIds.has(id) && !goneIds.has(id),
        ) &&
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
        validEvents(report.events) &&
        (report.income === undefined || report.income === 'host') &&
        validBetrayal(report.betrayal),
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

/**
 * On disk, a book is version 4: the current run in full, and each dawn with
 * its accumulated lists (dispatches, flags, talks, the dead) stored as the
 * length of the prefix it shares with the next snapshot plus whatever follows
 * that prefix. Every dawn repeating the whole history made a finished
 * campaign's book nearly a megabyte; packed, it stays a small fraction of
 * that. Decoding rebuilds each dawn exactly, from the newest back to Day 1,
 * then validates the result like any other save. Version 3 books (every dawn
 * in full) still load and are written back packed.
 */
type StoredBook = {
  version: 4
  current: FortressRun
  dawns: Record<string, unknown>[]
}

type PackedList = { p: number; t: unknown[] }

const PACKED_LISTS = [
  'reports',
  'flags',
  'audiencesHeard',
  'talksHeard',
  'memorials',
] as const

const sharedPrefix = (list: unknown[], ref: unknown[]): number => {
  let i = 0
  while (
    i < list.length &&
    i < ref.length &&
    JSON.stringify(list[i]) === JSON.stringify(ref[i])
  )
    i += 1
  return i
}

const packDawn = (
  dawn: FortressRun,
  next: FortressRun,
): Record<string, unknown> => {
  const packed: Record<string, unknown> = { ...dawn }
  for (const key of PACKED_LISTS) {
    const list = dawn[key]
    const ref = next[key]
    if (!Array.isArray(list) || !Array.isArray(ref)) continue
    const p = sharedPrefix(list, ref)
    if (p > 0) packed[key] = { p, t: list.slice(p) } satisfies PackedList
  }
  return packed
}

/** The dawn as it was, or null when a packed list does not fit its successor. */
const unpackDawn = (
  stored: unknown,
  next: FortressRun,
): Record<string, unknown> | null => {
  if (!object(stored)) return null
  const dawn: Record<string, unknown> = { ...stored }
  for (const key of PACKED_LISTS) {
    const value = dawn[key]
    if (!object(value)) continue
    const ref: unknown = next[key]
    if (
      Object.keys(value).length !== 2 ||
      !Array.isArray(ref) ||
      !int(value.p, 1, ref.length) ||
      !Array.isArray(value.t)
    )
      return null
    dawn[key] = [...ref.slice(0, value.p), ...value.t]
  }
  return dawn
}

const packBook = (book: SaveBook): StoredBook => {
  const dawns: Record<string, unknown>[] = []
  for (let i = book.dawns.length - 1; i >= 0; i -= 1)
    dawns[i] = packDawn(book.dawns[i]!, book.dawns[i + 1] ?? book.current)
  return { version: 4, current: book.current, dawns }
}

/** A stored book of either version, rebuilt and validated; null if unreadable. */
const readBook = (value: unknown): SaveBook | null => {
  if (!object(value)) return null
  if (value.version === 3) return validateBook(value) ? value : null
  if (
    value.version !== 4 ||
    !validateRun(value.current) ||
    !Array.isArray(value.dawns) ||
    value.dawns.length > LAST_DAY
  )
    return null
  const dawns: unknown[] = []
  let next: FortressRun = value.current
  for (let i = value.dawns.length - 1; i >= 0; i -= 1) {
    const dawn = unpackDawn(value.dawns[i], next)
    if (!validateRun(dawn)) return null
    dawns[i] = dawn
    next = dawn
  }
  // A clean copy, so rebuilt dawns never share objects with each other.
  const book: unknown = JSON.parse(
    JSON.stringify({ version: 3, current: value.current, dawns }),
  )
  return validateBook(book) ? book : null
}

export const encodeBook = (book: SaveBook): string => {
  if (!validateBook(book)) throw new Error('refusing to save an invalid run')
  return JSON.stringify(packBook(book))
}

export const decodeBook = (raw: string | null): SaveBook | null => {
  if (!raw || raw.length > MAX_RAW) return null
  try {
    return readBook(JSON.parse(raw))
  } catch {
    return null
  }
}

export const encodeSlot = (
  label: string,
  book: SaveBook,
  savedAt: Date,
): string => {
  if (!validateBook(book)) throw new Error('refusing to save an invalid run')
  return JSON.stringify({
    version: 3,
    label: label.trim().slice(0, 60) || `Day ${book.current.day}`,
    savedAt: savedAt.toISOString(),
    book: packBook(book),
  })
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
      Number.isNaN(Date.parse(value.savedAt))
    )
      return null
    const book = readBook(value.book)
    return book
      ? { version: 3, label: value.label, savedAt: value.savedAt, book }
      : null
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
    // Only trait ids survive: a Codex never carries items, brass or
    // relationships, and ids retired from the content drop away.
    return {
      version: 1,
      revealed: [...new Set((value.revealed as string[]).filter(isCodexId))],
    }
  } catch {
    return null
  }
}

export const mergeCodex = (codex: Codex, ids: readonly string[]): Codex => {
  const revealed = [...new Set([...codex.revealed, ...ids.filter(isCodexId)])]
  return revealed.length === codex.revealed.length
    ? codex
    : { version: 1, revealed }
}
