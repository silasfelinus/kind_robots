import type { ClassicFishingCheckpoint, RunSave } from '~/types/ruler-hooked'
import {
  applyFishingStop,
  fishingEncounterFinished,
  startFishingEncounter,
  type FishingEncounter,
} from './encounter'

const MAX_STOPS = 128

export function validClassicCheckpoint(
  value: unknown,
): value is ClassicFishingCheckpoint {
  if (!value || typeof value !== 'object') return false
  const checkpoint = value as Partial<ClassicFishingCheckpoint>
  return (
    typeof checkpoint.encounterId === 'string' &&
    checkpoint.encounterId.length <= 512 &&
    Array.isArray(checkpoint.stops) &&
    checkpoint.stops.length <= MAX_STOPS &&
    checkpoint.stops.every(
      (stop) => typeof stop === 'number' && Number.isFinite(stop) &&
        stop >= 0 && stop <= 100,
    )
  )
}

export function classicCheckpoint(
  encounter: FishingEncounter,
): ClassicFishingCheckpoint | undefined {
  if (fishingEncounterFinished(encounter)) return undefined
  const checkpoint = {
    encounterId: encounter.id,
    stops: encounter.history.map((beat) => beat.stopPosition),
  }
  return validClassicCheckpoint(checkpoint) ? checkpoint : undefined
}

export function readClassicCheckpoint(
  save: RunSave,
): FishingEncounter | null {
  const checkpoint = save.pendingClassicFishing
  if (
    save.status !== 'ACTIVE' ||
    save.pendingCardId ||
    save.pendingFinaleKey ||
    !validClassicCheckpoint(checkpoint)
  ) return null

  let encounter = startFishingEncounter(save)
  if (encounter.id !== checkpoint.encounterId) return null
  for (const position of checkpoint.stops) {
    encounter = applyFishingStop(encounter, position)
    if (fishingEncounterFinished(encounter)) return null
  }
  return encounter
}
