import {
  chooseOverworldEvent,
  eventNeighbors,
  newOverworldEventProgress,
  revealOverworldEvent,
  worldEvent,
  type OverworldEventProgress,
} from './overworldEventCatalog'
import type { EarthReality } from './earthAct'

export type EarthJournalAction =
  | { type: 'travel'; key: string }
  | { type: 'choose'; key: string; choiceId: string }

export interface EarthJournalState {
  progress: OverworldEventProgress
  position: string
}

const MAX_EARTH_ACTIONS = 512

/**
 * New Earth saves replay actual adjacent travel and one-time decisions.
 * Serialized totals, revealed cells, and choices cannot grant rewards.
 */
export function replayEarthJournal(
  reality: EarthReality,
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
      if (
        action.key !== position ||
        typeof action.choiceId !== 'string'
      )
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
  reality: EarthReality,
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
