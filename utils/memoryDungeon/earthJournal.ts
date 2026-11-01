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

type JourneyReality = EarthReality | SeaReality | 'e09'

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
 * Legacy snapshots predate action journals. Normalization must not silently
 * discard a saved choice, location, flag or resource before migration checks it.
 * A damaged chapter is safer to reset than to rewrite as a different story.
 */
export function validateLegacyEarthSnapshot(
  value: unknown,
  normalized: OverworldEventProgress,
): boolean {
  if (!value || typeof value !== 'object') return false
  const source = value as Partial<OverworldEventProgress>
  if (
    source.version !== 1 ||
    source.experience !== normalized.experience ||
    !Array.isArray(source.revealed) ||
    source.revealed.length !== normalized.revealed.length ||
    source.revealed.some(
      (key) => typeof key !== 'string' || !normalized.revealed.includes(key),
    ) ||
    !source.choices ||
    typeof source.choices !== 'object' ||
    Array.isArray(source.choices)
  )
    return false

  const choices = Object.entries(source.choices)
  if (
    choices.length !== Object.keys(normalized.choices).length ||
    choices.some(([key, choice]) => normalized.choices[key] !== choice) ||
    !Array.isArray(source.flags) ||
    source.flags.length !== normalized.flags.length ||
    source.flags.some((flag, index) => flag !== normalized.flags[index])
  )
    return false

  return (['supplies', 'trust', 'evidence', 'danger'] as const).every(
    (resource) =>
      typeof source[resource] === 'number' &&
      Number.isFinite(source[resource]) &&
      source[resource] === normalized[resource],
  )
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
  let position = '1,1'

  function travelTo(target: string): boolean {
    if (target === position) return true
    const paths = new Map<string, string[]>([[position, []]])
    const queue = [position]
    for (let index = 0; index < queue.length; index++) {
      const current = queue[index]!
      if (current === target) break
      for (const neighbor of eventNeighbors(current)) {
        if (!revealed.has(neighbor) || paths.has(neighbor)) continue
        paths.set(neighbor, [...paths.get(current)!, neighbor])
        queue.push(neighbor)
      }
    }
    const path = paths.get(target)
    if (!path) return false
    for (const key of path) {
      journal.push({ type: 'travel', key })
      visited.add(key)
      position = key
    }
    return true
  }

  // The legacy choices object retains decision order. Reordering danger
  // gains and relief can change its zero-floor resource total.
  for (const [key, choiceId] of Object.entries(progress.choices)) {
    if (!revealed.has(key) || !travelTo(key)) return null
    journal.push({ type: 'choose', key, choiceId })
  }

  function visitRemaining(key: string, traversed: Set<string>): void {
    traversed.add(key)
    for (const neighbor of eventNeighbors(key)) {
      if (!revealed.has(neighbor) || traversed.has(neighbor)) continue
      visited.add(neighbor)
      journal.push({ type: 'travel', key: neighbor })
      position = neighbor
      visitRemaining(neighbor, traversed)
      journal.push({ type: 'travel', key })
      position = key
    }
  }
  if (visited.size < revealed.size) visitRemaining(position, new Set())
  if (visited.size !== revealed.size || !travelTo(destination)) return null

  const replayed = replayEarthJournal(reality, journal)
  if (
    !replayed ||
    replayed.position !== destination ||
    replayed.progress.revealed.length !== revealed.size ||
    progress.revealed.some(
      (key) => !replayed.progress.revealed.includes(key),
    ) ||
    JSON.stringify(replayed.progress.choices) !==
      JSON.stringify(progress.choices) ||
    JSON.stringify(replayed.progress.flags) !==
      JSON.stringify(progress.flags) ||
    replayed.progress.supplies !== progress.supplies ||
    replayed.progress.trust !== progress.trust ||
    replayed.progress.evidence !== progress.evidence ||
    replayed.progress.danger !== progress.danger
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

  function visitRemaining(key: string, traversed: Set<string>): void {
    traversed.add(key)
    for (const neighbor of eventNeighbors(key)) {
      if (!allowed.has(neighbor) || traversed.has(neighbor)) continue
      seen.add(neighbor)
      compacted.push({ type: 'travel', key: neighbor })
      position = neighbor
      visitRemaining(neighbor, traversed)
      compacted.push({ type: 'travel', key })
      position = key
    }
  }
  if (seen.size < allowed.size) visitRemaining(position, new Set())
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
