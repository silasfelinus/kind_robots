import {
  worldEvent,
  worldEvents,
  type OverworldEventProgress,
} from './overworldEventCatalog'
import { EARTH_PHOTOS } from './chronicle'
import {
  MEMORY_PAIR_ENDINGS,
  MEMORY_SCYLLA_DEPARTURE_CHOICES,
  MEMORY_CHAR_AGENCY_CHOICES,
  memoryCharFate,
  scyllaOpeningForMemory,
  type MemoryCampaignProgress,
} from './reimaginerCampaign'

export type SeaReality = 'e05' | 'e06'
export const SEA_REALITIES = ['e05', 'e06'] as const
export const SEA_MIN_DECISIONS = 12

export function seaRealityPhotos(reality: SeaReality): string[] {
  return EARTH_PHOTOS.filter((photo) => photo.experience === reality).map(
    (photo) => photo.site,
  )
}

export function seaRealityReady(
  reality: SeaReality,
  progress: OverworldEventProgress,
): boolean {
  if (progress.experience !== reality) return false
  if (Object.keys(progress.choices).length < SEA_MIN_DECISIONS) return false
  if (!seaRealityPhotos(reality).every((site) => progress.choices[site]))
    return false
  if (
    reality === 'e06' &&
    !MEMORY_CHAR_AGENCY_CHOICES.some(
      (option) => option.id === progress.choices['7,7'],
    )
  )
    return false
  const ending = progress.choices['8,8']
  if (!ending) return false
  return reality === 'e05'
    ? MEMORY_SCYLLA_DEPARTURE_CHOICES.some((option) => option.id === ending)
    : MEMORY_PAIR_ENDINGS.e06.some((option) => option.id === ending)
}

export function seaNarrative(
  reality: SeaReality,
  site: string,
  campaign: MemoryCampaignProgress,
  choices: Readonly<Record<string, string>> = {},
): string {
  // Sites are hand-written; only campaign-dependent lines are added here.
  if (site === '1,1') return scyllaOpeningForMemory(campaign, reality)
  if (reality === 'e05' && site === '8,8') {
    const fate = memoryCharFate(campaign)
    const past =
      fate === 'lost'
        ? 'Scylla remembers the older Char dying at the crossing. The girl before her has not lived that future.'
        : fate === 'alive'
          ? 'Scylla left an older Char alive in the present, but the people harmed by the tide gate have not vanished.'
          : 'The original tide-gate outcome is unresolved; Scylla cannot claim a rescue or a death she has not witnessed.'
    return past
  }
  if (reality === 'e06' && (site === '2,2' || site === '8,8')) {
    const chosen = MEMORY_SCYLLA_DEPARTURE_CHOICES.find(
      (option) => option.id === campaign.scyllaDeparture,
    )
    return [
      chosen?.futureConsequence ?? '',
      site === '8,8'
        ? (MEMORY_CHAR_AGENCY_CHOICES.find(
            (option) => option.id === choices['7,7'],
          )?.futureConsequence ?? '')
        : '',
      memoryCharFate(campaign) === 'lost'
        ? 'The older Char died. A younger Char in this altered past has her own decisions to make; neither history is erased.'
        : '',
    ]
      .filter(Boolean)
      .join(' ')
  }
  return ''
}

export function seaActCoverage(): string[] {
  const issues: string[] = []
  for (const reality of SEA_REALITIES) {
    if (worldEvents(reality).length !== 64)
      issues.push(reality + ' needs 64 authored sites')
    const photos = seaRealityPhotos(reality)
    if (photos.length !== 2 || photos.some((key) => !worldEvent(reality, key)))
      issues.push(reality + ' needs two fixed photograph sites')
    const exit = worldEvent(reality, '8,8')
    const expected =
      reality === 'e05'
        ? MEMORY_SCYLLA_DEPARTURE_CHOICES.map((option) => option.id)
        : MEMORY_PAIR_ENDINGS.e06.map((option) => option.id)
    if (
      !exit ||
      exit.choices.length !== expected.length ||
      expected.some((id) => !exit.choices.some((option) => option.id === id))
    )
      issues.push(reality + ' must retain canonical irreversible decisions')
  }
  const charEncounter = worldEvent('e06', '7,7')
  if (
    !charEncounter ||
    charEncounter.choices.length !== MEMORY_CHAR_AGENCY_CHOICES.length ||
    MEMORY_CHAR_AGENCY_CHOICES.some(
      (choice) =>
        !charEncounter.choices.some((option) => option.id === choice.id),
    )
  )
    issues.push('e06 must offer Char three independent rescue choices')
  return issues
}
