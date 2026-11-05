/**
 * Sublevel B engine: pure, save-safe reducer for e03's 36-room dungeon.
 * Saves keep only the ordered decisions plus the rooms seen; restore
 * replays them along real passages, so totals, the guardian pass and the
 * ending can never be asserted by save data alone.
 */
import {
  SUBLEVEL_CLIMAX_ROOM,
  SUBLEVEL_ENTRY_ROOM,
  SUBLEVEL_EXIT_ROOM,
  SUBLEVEL_GRAPH,
  SUBLEVEL_GUARDIAN_ROOM,
  SUBLEVEL_SHORTCUTS,
} from './graph'
import { SUBLEVEL_ROOMS_A } from './roomsA'
import { SUBLEVEL_ROOMS_B } from './roomsB'
import type {
  SublevelChoice,
  SublevelEnding,
  SublevelEntry,
  SublevelProgress,
  SublevelRoom,
  SublevelRoomId,
} from './types'

export type * from './types'
export {
  SUBLEVEL_CLIMAX_ROOM,
  SUBLEVEL_ENTRY_ROOM,
  SUBLEVEL_EXIT_ROOM,
  SUBLEVEL_GUARDIAN_ROOM,
}

export const SUBLEVEL_BATTERY_START = 3
export const SUBLEVEL_BATTERY_MAX = 5
export const SUBLEVEL_ENDINGS: readonly SublevelEnding[] = [
  'return',
  'finish',
  'confess',
]

export const SUBLEVEL_ROOMS: Readonly<Record<SublevelRoomId, SublevelRoom>> =
  Object.fromEntries(
    [...SUBLEVEL_ROOMS_A, ...SUBLEVEL_ROOMS_B].map((room) => [
      room.id,
      { ...room, exits: SUBLEVEL_GRAPH[room.id] ?? [] },
    ]),
  )

export function isSublevelRoomId(value: unknown): value is SublevelRoomId {
  return (
    typeof value === 'string' &&
    Object.prototype.hasOwnProperty.call(SUBLEVEL_ROOMS, value)
  )
}

export function sublevelRoom(id: string): SublevelRoom | null {
  return isSublevelRoomId(id) ? (SUBLEVEL_ROOMS[id] ?? null) : null
}

export function newSublevelProgress(entry: SublevelEntry): SublevelProgress {
  return {
    version: 1,
    entry,
    current: SUBLEVEL_ENTRY_ROOM,
    visited: [SUBLEVEL_ENTRY_ROOM],
    order: [],
    decisions: {},
    battery: SUBLEVEL_BATTERY_START,
    evidence: 0,
    trust: 0,
    danger: 0,
    hollisPassed: false,
    ending: null,
    completed: false,
  }
}

/** Passages open from a room right now, including backtracking and earned shortcuts. */
export function sublevelExits(
  progress: SublevelProgress,
  from: SublevelRoomId = progress.current,
): SublevelRoomId[] {
  const forward = SUBLEVEL_GRAPH[from] ?? []
  const back = (Object.keys(SUBLEVEL_GRAPH) as SublevelRoomId[]).filter(
    (id) => SUBLEVEL_GRAPH[id]!.includes(from) && progress.visited.includes(id),
  )
  const shortcuts = SUBLEVEL_SHORTCUTS.filter(
    (cut) => progress.decisions[cut.room] === cut.choice,
  ).flatMap((cut) => (cut.a === from ? [cut.b] : cut.b === from ? [cut.a] : []))
  return [...new Set([...forward, ...back, ...shortcuts])].filter(
    (to) =>
      (to !== 'SB-33' || progress.hollisPassed) &&
      (to !== SUBLEVEL_EXIT_ROOM || progress.ending !== null),
  )
}

/** Null when the choice can be played; otherwise the hint for its locked card. */
export function sublevelChoiceLock(
  progress: SublevelProgress,
  choice: SublevelChoice,
): string | null {
  const need = choice.requires
  if (!need) return null
  const unmet =
    (need.battery !== undefined && progress.battery < need.battery) ||
    (need.evidence !== undefined && progress.evidence < need.evidence) ||
    (need.trust !== undefined && progress.trust < need.trust) ||
    (need.entry !== undefined && progress.entry !== need.entry)
  return unmet ? (choice.lockedHint ?? 'Not available yet') : null
}

export function travelSublevel(
  progress: SublevelProgress,
  to: SublevelRoomId,
): SublevelProgress {
  if (progress.completed || !sublevelExits(progress).includes(to))
    return progress
  let next: SublevelProgress = {
    ...progress,
    current: to,
    visited: progress.visited.includes(to)
      ? progress.visited
      : [...progress.visited, to],
  }
  const room = SUBLEVEL_ROOMS[to]
  if (room?.autoChoiceId && !next.decisions[to])
    next = chooseSublevel(next, room.autoChoiceId)
  return next
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function chooseSublevel(
  progress: SublevelProgress,
  choiceId: string,
): SublevelProgress {
  const room = SUBLEVEL_ROOMS[progress.current]
  if (!room || progress.completed || progress.decisions[room.id])
    return progress
  const choice = room.choices.find((option) => option.id === choiceId)
  if (!choice || sublevelChoiceLock(progress, choice)) return progress
  const gain = choice.gain ?? {}
  const ending =
    room.id === SUBLEVEL_CLIMAX_ROOM &&
    (SUBLEVEL_ENDINGS as readonly string[]).includes(choice.id)
      ? (choice.id as SublevelEnding)
      : progress.ending
  return {
    ...progress,
    order: [...progress.order, [room.id, choice.id]],
    decisions: { ...progress.decisions, [room.id]: choice.id },
    battery: clamp(progress.battery + (gain.battery ?? 0), 0, 5),
    evidence: progress.evidence + (gain.evidence ?? 0),
    trust: progress.trust + (gain.trust ?? 0),
    danger: Math.max(0, progress.danger + (gain.danger ?? 0)),
    hollisPassed:
      progress.hollisPassed ||
      (room.id === SUBLEVEL_GUARDIAN_ROOM && choice.passesGuardian === true),
    ending,
    completed: progress.completed || room.id === SUBLEVEL_EXIT_ROOM,
  }
}

export function sublevelFlags(progress: SublevelProgress): string[] {
  return [
    'entry:' + progress.entry,
    ...progress.order.map(([room, choice]) => room + ':' + choice),
  ]
}

/** Opening plus echoes of earlier choices, here or on the e03 overworld. */
export function sublevelOpening(
  room: SublevelRoom,
  flags: readonly string[],
): string {
  return [
    room.opening,
    ...(room.echoes ?? [])
      .filter((echo) => flags.includes(echo.flag))
      .map((echo) => echo.text),
  ].join(' ')
}

/** Shortest walk through open passages, limited to rooms the save says were seen. */
function pathTo(
  progress: SublevelProgress,
  target: SublevelRoomId,
  allowed: ReadonlySet<SublevelRoomId>,
): SublevelRoomId[] | null {
  if (progress.current === target) return []
  const previous = new Map<SublevelRoomId, SublevelRoomId>()
  const queue: SublevelRoomId[] = [progress.current]
  const seen = new Set(queue)
  for (let i = 0; i < queue.length; i++) {
    const room = queue[i]!
    // Backtracking needs the far room already visited; forward passages and
    // earned shortcuts don't. Rooms seen earlier on this walk are ancestors,
    // so the real visit list is the right test.
    for (const next of sublevelExits(progress, room)) {
      if (seen.has(next) || !allowed.has(next)) continue
      seen.add(next)
      previous.set(next, room)
      if (next === target) {
        const path: SublevelRoomId[] = [next]
        let step = room
        while (step !== progress.current) {
          path.unshift(step)
          step = previous.get(step)!
        }
        return path
      }
      queue.push(next)
    }
  }
  return null
}

function walk(
  progress: SublevelProgress,
  target: SublevelRoomId,
  allowed: ReadonlySet<SublevelRoomId>,
): SublevelProgress | null {
  const path = pathTo(progress, target, allowed)
  if (!path) return null
  let next = progress
  for (const step of path) {
    const moved = travelSublevel(next, step)
    if (moved === next) return null
    next = moved
  }
  return next
}

/** Rebuild a save by replaying its decisions along real passages. */
export function restoreSublevelProgress(
  input: unknown,
  entry: SublevelEntry,
): SublevelProgress {
  let progress = newSublevelProgress(entry)
  if (!input || typeof input !== 'object') return progress
  const save = input as Partial<SublevelProgress>
  const allowed = new Set<SublevelRoomId>([
    SUBLEVEL_ENTRY_ROOM,
    ...(Array.isArray(save.visited)
      ? save.visited.filter((id): id is SublevelRoomId => isSublevelRoomId(id))
      : []),
  ])
  const order = Array.isArray(save.order) ? save.order.slice(0, 64) : []
  for (const item of order) {
    if (!Array.isArray(item) || item.length !== 2) continue
    const [room, choice] = item as unknown[]
    if (!isSublevelRoomId(room) || typeof choice !== 'string') continue
    if (progress.decisions[room]) continue
    const arrived = walk(progress, room, allowed)
    if (!arrived) continue
    progress = arrived.decisions[room]
      ? arrived
      : chooseSublevel(arrived, choice)
  }
  for (const room of allowed)
    if (!progress.visited.includes(room)) {
      const reached = walk(progress, room, allowed)
      if (reached) progress = reached
    }
  if (isSublevelRoomId(save.current)) {
    const back = walk(progress, save.current, allowed)
    if (back) progress = back
  }
  // Replay may pass rooms in a different sequence than the original run;
  // present the replayed facts in the order the player actually earned them.
  const seenAt = new Map<string, number>()
  if (Array.isArray(save.visited))
    save.visited.forEach((id, i) => {
      if (typeof id === 'string' && !seenAt.has(id)) seenAt.set(id, i)
    })
  seenAt.set(SUBLEVEL_ENTRY_ROOM, -1)
  const decidedAt = new Map<string, number>()
  order.forEach((item, i) => {
    if (Array.isArray(item) && typeof item[0] === 'string')
      if (!decidedAt.has(item[0])) decidedAt.set(item[0], i)
  })
  const rank = (map: Map<string, number>, id: string) =>
    map.get(id) ?? Number.MAX_SAFE_INTEGER
  return {
    ...progress,
    visited: [...progress.visited].sort(
      (a, b) => rank(seenAt, a) - rank(seenAt, b),
    ),
    order: [...progress.order].sort(
      (a, b) => rank(decidedAt, a[0]) - rank(decidedAt, b[0]),
    ),
  }
}

export function validateSublevel(): string[] {
  const issues: string[] = []
  const ids = Object.keys(SUBLEVEL_ROOMS)
  if (ids.length !== 36) issues.push('Sublevel B must have 36 rooms')
  for (let n = 1; n <= 36; n++) {
    const id = ('SB-' + String(n).padStart(2, '0')) as SublevelRoomId
    if (!SUBLEVEL_ROOMS[id]) issues.push(id + ': missing room')
    if (!SUBLEVEL_GRAPH[id]) issues.push(id + ': missing from graph')
  }
  for (const room of Object.values(SUBLEVEL_ROOMS)) {
    for (const to of room.exits)
      if (!SUBLEVEL_ROOMS[to]) issues.push(room.id + ': exit to unknown ' + to)
    if (!room.choices.length) issues.push(room.id + ': no choices')
    if (!room.choices.some((choice) => !choice.requires))
      issues.push(room.id + ': every choice is conditional')
    if (
      room.autoChoiceId &&
      (room.choices.length !== 1 || room.choices[0]!.id !== room.autoChoiceId)
    )
      issues.push(room.id + ': instant room needs exactly its one choice')
  }
  const reached = new Set<SublevelRoomId>([SUBLEVEL_ENTRY_ROOM])
  const queue: SublevelRoomId[] = [SUBLEVEL_ENTRY_ROOM]
  for (let i = 0; i < queue.length; i++)
    for (const to of SUBLEVEL_GRAPH[queue[i]!] ?? [])
      if (!reached.has(to)) {
        reached.add(to)
        queue.push(to)
      }
  for (const id of ids)
    if (!reached.has(id as SublevelRoomId))
      issues.push(id + ': unreachable from the door')
  const climax = SUBLEVEL_ROOMS[SUBLEVEL_CLIMAX_ROOM]
  if (
    climax?.choices.map((choice) => choice.id).join(',') !==
    'return,finish,confess'
  )
    issues.push('SB-35 must offer return, finish and confess')
  const guardian = SUBLEVEL_ROOMS[SUBLEVEL_GUARDIAN_ROOM]
  if (!guardian?.choices.every((choice) => choice.passesGuardian))
    issues.push('Every SB-32 answer must get past Hollis')
  return issues
}
