/**
 * Shared, save-safe reducer for hand-written 36-room dungeons. Saves keep
 * only the ordered decisions plus the rooms seen; restore replays them
 * along real passages, so totals, the guardian pass and the ending can
 * never be asserted by save data alone.
 */
import type {
  DungeonChoice,
  DungeonDefinition,
  DungeonProgress,
  DungeonRoom,
} from './types'

export type * from './types'

export function createAuthoredDungeon<
  Id extends string,
  Entry extends string,
  Ending extends string,
>(def: DungeonDefinition<Id, Entry, Ending>) {
  type Progress = DungeonProgress<Id, Entry, Ending>
  type Room = DungeonRoom<Id, Entry>

  const rooms = Object.fromEntries(
    def.rooms.map((room) => [
      room.id,
      { ...room, exits: def.graph[room.id] ?? [] },
    ]),
  ) as Readonly<Record<Id, Room>>

  function isRoomId(value: unknown): value is Id {
    return (
      typeof value === 'string' &&
      Object.prototype.hasOwnProperty.call(rooms, value)
    )
  }

  function room(id: string): Room | null {
    return isRoomId(id) ? (rooms[id] ?? null) : null
  }

  function newProgress(entry: Entry): Progress {
    return {
      version: 1,
      entry,
      current: def.entryRoom,
      visited: [def.entryRoom],
      order: [],
      decisions: {},
      battery: def.batteryStart,
      evidence: 0,
      trust: 0,
      danger: 0,
      guardianPassed: false,
      ending: null,
      completed: false,
    }
  }

  /** Passages open from a room right now, including backtracking and earned shortcuts. */
  function exits(progress: Progress, from: Id = progress.current): Id[] {
    const forward = def.graph[from] ?? []
    const back = (Object.keys(def.graph) as Id[]).filter(
      (id) => def.graph[id]!.includes(from) && progress.visited.includes(id),
    )
    const shortcuts = def.shortcuts
      .filter((cut) => progress.decisions[cut.room] === cut.choice)
      .flatMap((cut) =>
        cut.a === from ? [cut.b] : cut.b === from ? [cut.a] : [],
      )
    return [...new Set([...forward, ...back, ...shortcuts])].filter(
      (to) =>
        (to !== def.vaultRoom || progress.guardianPassed) &&
        (to !== def.exitRoom || progress.ending !== null),
    )
  }

  /** Null when the choice can be played; otherwise the hint for its locked card. */
  function choiceLock(
    progress: Progress,
    choice: DungeonChoice<Entry>,
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

  function choose(progress: Progress, choiceId: string): Progress {
    const here = rooms[progress.current]
    if (!here || progress.completed || progress.decisions[here.id])
      return progress
    const choice = here.choices.find((option) => option.id === choiceId)
    if (!choice || choiceLock(progress, choice)) return progress
    const gain = choice.gain ?? {}
    const ending =
      here.id === def.climaxRoom &&
      (def.endings as readonly string[]).includes(choice.id)
        ? (choice.id as Ending)
        : progress.ending
    return {
      ...progress,
      order: [...progress.order, [here.id, choice.id]],
      decisions: { ...progress.decisions, [here.id]: choice.id },
      battery: Math.min(
        def.batteryMax,
        Math.max(0, progress.battery + (gain.battery ?? 0)),
      ),
      evidence: progress.evidence + (gain.evidence ?? 0),
      trust: progress.trust + (gain.trust ?? 0),
      danger: Math.max(0, progress.danger + (gain.danger ?? 0)),
      guardianPassed:
        progress.guardianPassed ||
        (here.id === def.guardianRoom && choice.passesGuardian === true),
      ending,
      completed: progress.completed || here.id === def.exitRoom,
    }
  }

  function travel(progress: Progress, to: Id): Progress {
    if (progress.completed || !exits(progress).includes(to)) return progress
    let next: Progress = {
      ...progress,
      current: to,
      visited: progress.visited.includes(to)
        ? progress.visited
        : [...progress.visited, to],
    }
    const target = rooms[to]
    if (target?.autoChoiceId && !next.decisions[to])
      next = choose(next, target.autoChoiceId)
    return next
  }

  function flags(progress: Progress): string[] {
    return [
      'entry:' + progress.entry,
      ...progress.order.map(([id, choice]) => id + ':' + choice),
    ]
  }

  /** Opening plus echoes of earlier choices, here or elsewhere in the campaign. */
  function opening(target: Room, held: readonly string[]): string {
    return [
      target.opening,
      ...(target.echoes ?? [])
        .filter((echo) => held.includes(echo.flag))
        .map((echo) => echo.text),
    ].join(' ')
  }

  /** Shortest walk through open passages, limited to rooms the save says were seen. */
  function pathTo(
    progress: Progress,
    target: Id,
    allowed: ReadonlySet<Id>,
  ): Id[] | null {
    if (progress.current === target) return []
    const previous = new Map<Id, Id>()
    const queue: Id[] = [progress.current]
    const seen = new Set(queue)
    for (let i = 0; i < queue.length; i++) {
      const at = queue[i]!
      // Backtracking needs the far room already visited; rooms seen earlier
      // on this walk are ancestors, so the real visit list is the right test.
      for (const next of exits(progress, at)) {
        if (seen.has(next) || !allowed.has(next)) continue
        seen.add(next)
        previous.set(next, at)
        if (next === target) {
          const path: Id[] = [next]
          let step = at
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
    progress: Progress,
    target: Id,
    allowed: ReadonlySet<Id>,
  ): Progress | null {
    const path = pathTo(progress, target, allowed)
    if (!path) return null
    let next = progress
    for (const step of path) {
      const moved = travel(next, step)
      if (moved === next) return null
      next = moved
    }
    return next
  }

  /** Rebuild a save by replaying its decisions along real passages. */
  function restore(input: unknown, entry: Entry): Progress {
    let progress = newProgress(entry)
    if (!input || typeof input !== 'object') return progress
    const save = input as Partial<Progress>
    const allowed = new Set<Id>([
      def.entryRoom,
      ...(Array.isArray(save.visited)
        ? save.visited.filter((id): id is Id => isRoomId(id))
        : []),
    ])
    const order = Array.isArray(save.order)
      ? save.order.slice(0, def.roomCount * 2)
      : []
    for (const item of order) {
      if (!Array.isArray(item) || item.length !== 2) continue
      const [id, choice] = item as unknown[]
      if (!isRoomId(id) || typeof choice !== 'string') continue
      if (progress.decisions[id]) continue
      const arrived = walk(progress, id, allowed)
      if (!arrived) continue
      progress = arrived.decisions[id] ? arrived : choose(arrived, choice)
    }
    for (const id of allowed)
      if (!progress.visited.includes(id)) {
        const reached = walk(progress, id, allowed)
        if (reached) progress = reached
      }
    if (isRoomId(save.current)) {
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
    seenAt.set(def.entryRoom, -1)
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

  function validate(): string[] {
    const issues: string[] = []
    const ids = Object.keys(rooms)
    if (ids.length !== def.roomCount)
      issues.push(def.prefix + ' must have ' + def.roomCount + ' rooms')
    for (let n = 1; n <= def.roomCount; n++) {
      const id = (def.prefix + '-' + String(n).padStart(2, '0')) as Id
      if (!rooms[id]) issues.push(id + ': missing room')
      if (!def.graph[id]) issues.push(id + ': missing from graph')
    }
    for (const each of Object.values(rooms) as Room[]) {
      for (const to of each.exits)
        if (!rooms[to]) issues.push(each.id + ': exit to unknown ' + to)
      if (!each.choices.length) issues.push(each.id + ': no choices')
      if (!each.choices.some((choice) => !choice.requires))
        issues.push(each.id + ': every choice is conditional')
      if (
        each.autoChoiceId &&
        (each.choices.length !== 1 || each.choices[0]!.id !== each.autoChoiceId)
      )
        issues.push(each.id + ': instant room needs exactly its one choice')
    }
    const reached = new Set<Id>([def.entryRoom])
    const queue: Id[] = [def.entryRoom]
    for (let i = 0; i < queue.length; i++)
      for (const to of def.graph[queue[i]!] ?? [])
        if (!reached.has(to)) {
          reached.add(to)
          queue.push(to)
        }
    for (const id of ids)
      if (!reached.has(id as Id))
        issues.push(id + ': unreachable from the door')
    const climax = rooms[def.climaxRoom]
    if (
      climax?.choices.map((choice) => choice.id).join(',') !==
      def.endings.join(',')
    )
      issues.push(def.climaxRoom + ' must offer ' + def.endings.join(', '))
    const guardian = rooms[def.guardianRoom]
    if (!guardian?.choices.every((choice) => choice.passesGuardian))
      issues.push(
        'Every ' + def.guardianRoom + ' answer must pass the guardian',
      )
    return issues
  }

  return {
    def,
    rooms,
    isRoomId,
    room,
    newProgress,
    exits,
    choiceLock,
    travel,
    choose,
    flags,
    opening,
    restore,
    validate,
  }
}

export type AuthoredDungeon<
  Id extends string = string,
  Entry extends string = string,
  Ending extends string = string,
> = ReturnType<typeof createAuthoredDungeon<Id, Entry, Ending>>
