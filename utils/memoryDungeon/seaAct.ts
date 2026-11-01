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

const SEA_KEY_SCENES: Record<SeaReality, Record<string, string>> = {
  e05: {
    '1,1':
      'Pearl Stair. The staircase is precisely as Scylla remembers. Char calls from above, younger than the last voice Scylla heard. Today is three days before their planned flight to land.',
    '2,2':
      'In the Council Gallery, a royal portrait shows both sisters smiling. Char asks why Scylla keeps looking for a crack in the paint.',
    '4,3':
      'Oren Pike has counted every ration and rescue rope. He is hooded, axe at his side, and refuses to file a plan until both princesses approve it.',
    '6,4':
      'The court’s archivist wants the twins to sign a departure oath. An oath can be kept for a lifetime, even when the person who signed it has not lived that lifetime yet.',
    '7,7':
      'Char discovers the secret shoreward route. She wants to be brave, not saved without being asked. Scylla has to tell the difference.',
    '8,8':
      'At the gate, the tide pauses before the sisters. Char demands to know whether Scylla will choose for her or stand beside her while she chooses.',
  },
  e06: {
    '1,1':
      'Pearl Stair now doubles back on itself. The court has recorded two conflicting versions of the same morning, and threatens to confiscate whichever is inconvenient.',
    '2,2':
      'The twins are summoned before a gallery of portraits that insist Char has always obeyed. Char points out every moment she did not.',
    '4,3':
      'Oren has found the only physical route between two contradictory corridors. His manifest includes who was stranded, who was rescued and who is still missing.',
    '6,4':
      'The court offers security in exchange for an official history that erases someone else’s cost. Oren refuses to call an erased debt settled.',
    '7,7':
      'Char approaches the second departure on her own terms. Even a future that once killed her cannot make her merely Scylla’s second chance.',
    '8,8':
      'The witness bells toll twice. The sisters must decide whether the court may publish two painful, contradictory histories, or whether their memories remain protected from compulsion.',
  },
}

export function seaNarrative(
  reality: SeaReality,
  site: string,
  campaign: MemoryCampaignProgress,
  choices: Readonly<Record<string, string>> = {},
): string {
  const original = SEA_KEY_SCENES[reality][site] ?? ''
  if (site === '1,1')
    return [scyllaOpeningForMemory(campaign, reality), original].join(' ')
  if (reality === 'e05' && site === '8,8') {
    const fate = memoryCharFate(campaign)
    const past =
      fate === 'lost'
        ? 'Scylla remembers the older Char dying at the crossing. The girl before her has not lived that future.'
        : fate === 'alive'
          ? 'Scylla left an older Char alive in the present, but the people harmed by the tide gate have not vanished.'
          : 'The original tide-gate outcome is unresolved; Scylla cannot claim a rescue or a death she has not witnessed.'
    return original + ' ' + past
  }
  if (reality === 'e06' && (site === '2,2' || site === '8,8')) {
    const chosen = MEMORY_SCYLLA_DEPARTURE_CHOICES.find(
      (option) => option.id === campaign.scyllaDeparture,
    )
    return [
      original,
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
  return original
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
      (choice) => !charEncounter.choices.some((option) => option.id === choice.id),
    )
  )
    issues.push('e06 must offer Char three independent rescue choices')
  return issues
}
