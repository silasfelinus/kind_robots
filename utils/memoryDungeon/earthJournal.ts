import {
  chooseOverworldEvent,
  eventNeighbors,
  newOverworldEventProgress,
  revealOverworldEvent,
  worldEvent,
  type OverworldEventProgress,
} from './overworldEventCatalog'
import type { EarthReality } from './earthAct'
import type { SeaReality } from './seaAct'

type JourneyReality = EarthReality | SeaReality

export type EarthJournalAction =
  | { type: 'travel'; key: string }
  | { type: 'choose'; key: string; choiceId: string }

export interface EarthJournalState {
  progress: OverworldEventProgress
  position: string
}

const MAX_EARTH_ACTIONS = 2048
export const EARTH_JOURNAL_COMPACT_AT = 1536

/**
 * Player journey saves replay actual adjacent travel and one-time decisions.
 * Serialized totals, revealed cells, and choices cannot grant rewards.
 */
export function replayEarthJournal(
  reality: JourneyReality,
  value: unknown,
): EarthJournalState | null {
  if (!Array.isArray(value) || value.length > MAX_EARTH_ACTIONS) return null
  let progress = newOverworldEventProgress(reality)
  let position = '1,1'
  for (const entry of value) {
    if (!entry || typeof entry !== 'object') return null
    const action = entry as Partial<EarthJournalAction>
    if (action.type === 'travel') {
      if (
        typeof action.key !== 'string' ||
        !eventNeighbors(position).includes(action.key) ||
        !worldEvent(reality, action.key)
      )
        return null
      progress = revealOverworldEvent(progress, action.key)
      position = action.key
    } else if (action.type === 'choose') {
      if (action.key !== position || typeof action.choiceId !== 'string')
        return null
      const next = chooseOverworldEvent(progress, position, action.choiceId)
      if (next === progress) return null
      progress = next
    } else {
      return null
    }
  }
  return { progress, position }
}

/**
 * Reconstruct a legal walking route from an already-normalized v1 save.
 * This is a one-time compatibility import, not proof of historical actions.
 * All subsequent v2 actions are replay-validated.
 */
export function migrateLegacyEarthJournal(
  reality: JourneyReality,
  progress: OverworldEventProgress,
  destination: string,
): EarthJournalAction[] | null {
  if (
    progress.experience !== reality ||
    !progress.revealed.includes(destination)
  )
    return null

  const revealed = new Set(progress.revealed)
  const visited = new Set(['1,1'])
  const journal: EarthJournalAction[] = []
  function visit(key: string): void {
    const choiceId = progress.choices[key]
    if (choiceId) journal.push({ type: 'choose', key, choiceId })
    for (const neighbor of eventNeighbors(key)) {
      if (!revealed.has(neighbor) || visited.has(neighbor)) continue
      visited.add(neighbor)
      journal.push({ type: 'travel', key: neighbor })
      visit(neighbor)
      journal.push({ type: 'travel', key })
    }
  }
  visit('1,1')
  if (visited.size !== revealed.size) return null

  const paths = new Map<string, string[]>([['1,1', []]])
  const queue = ['1,1']
  for (let index = 0; index < queue.length; index++) {
    const current = queue[index]!
    if (current === destination) break
    for (const neighbor of eventNeighbors(current)) {
      if (!revealed.has(neighbor) || paths.has(neighbor)) continue
      paths.set(neighbor, [...paths.get(current)!, neighbor])
      queue.push(neighbor)
    }
  }
  const returnPath = paths.get(destination)
  if (!returnPath) return null
  for (const key of returnPath) journal.push({ type: 'travel', key })

  const replayed = replayEarthJournal(reality, journal)
  if (
    !replayed ||
    replayed.position !== destination ||
    replayed.progress.revealed.length !== revealed.size ||
    Object.keys(replayed.progress.choices).length !==
      Object.keys(progress.choices).length ||
    Object.entries(progress.choices).some(
      ([key, choice]) => replayed.progress.choices[key] !== choice,
    )
  )
    return null
  return journal
}

/**
 * Replace long wandering histories with a shorter, fully replayable route.
 * Keep decisions in their original order: danger has a zero floor, so
 * reordering a rescue and a hazard would silently change the outcome.
 * Only visit sites already revealed by the validated original journal.
 */
export function compactEarthJournal(
  reality: JourneyReality,
  value: unknown,
): EarthJournalAction[] | null {
  const original = replayEarthJournal(reality, value)
  if (!original || !Array.isArray(value)) return null
  const allowed = new Set(original.progress.revealed)
  const compacted: EarthJournalAction[] = []
  const seen = new Set(['1,1'])
  let position = '1,1'

  function travelTo(destination: string): boolean {
    if (destination === position) return true
    const paths = new Map<string, string[]>([[position, []]])
    const queue = [position]
    for (let index = 0; index < queue.length; index++) {
      const current = queue[index]!
      for (const neighbor of eventNeighbors(current)) {
        if (!allowed.has(neighbor) || paths.has(neighbor)) continue
        paths.set(neighbor, [...paths.get(current)!, neighbor])
        queue.push(neighbor)
      }
    }
    const path = paths.get(destination)
    if (!path) return false
    for (const key of path) {
      compacted.push({ type: 'travel', key })
      seen.add(key)
      position = key
    }
    return true
  }

  for (const action of value as EarthJournalAction[]) {
    if (action.type !== 'choose') continue
    if (!travelTo(action.key)) return null
    compacted.push({
      type: 'choose',
      key: action.key,
      choiceId: action.choiceId,
    })
  }

  function visitRemaining(key: string): void {
    for (const neighbor of eventNeighbors(key)) {
      if (!allowed.has(neighbor) || seen.has(neighbor)) continue
      seen.add(neighbor)
      compacted.push({ type: 'travel', key: neighbor })
      position = neighbor
      visitRemaining(neighbor)
      compacted.push({ type: 'travel', key })
      position = key
    }
  }
  visitRemaining(position)
  if (!travelTo(original.position)) return null

  const verified = replayEarthJournal(reality, compacted)
  const a = original.progress
  const b = verified?.progress
  if (
    !b ||
    verified?.position !== original.position ||
    a.revealed.length !== b.revealed.length ||
    a.revealed.some((key) => !b.revealed.includes(key)) ||
    JSON.stringify(a.choices) !== JSON.stringify(b.choices) ||
    JSON.stringify(a.flags) !== JSON.stringify(b.flags) ||
    a.supplies !== b.supplies ||
    a.trust !== b.trust ||
    a.evidence !== b.evidence ||
    a.danger !== b.danger
  )
    return null
  return compacted
}
