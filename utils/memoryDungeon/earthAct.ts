import {
  worldEvent,
  worldEvents,
  type OverworldEventProgress,
} from './overworldEventCatalog'
import { EARTH_PHOTOS } from './chronicle'

export type EarthReality = 'e03' | 'e04'

export const EARTH_REALITIES = ['e03', 'e04'] as const

export const EARTH_MIN_DECISIONS = 12

export function earthRealityPhotos(reality: EarthReality): string[] {
  return EARTH_PHOTOS.filter((photo) => photo.experience === reality).map(
    (photo) => photo.site,
  )
}

export function earthRealityReady(
  reality: EarthReality,
  progress: OverworldEventProgress,
): boolean {
  if (progress.experience !== reality) return false
  if (Object.keys(progress.choices).length < EARTH_MIN_DECISIONS) return false
  if (!progress.choices['8,8']) return false
  if (!earthRealityPhotos(reality).every((site) => progress.choices[site]))
    return false
  if (
    reality === 'e04' &&
    ![
      'open-the-tide-gate',
      'seal-the-tide-gate',
      'divert-the-current',
    ].includes(progress.choices['8,8'] ?? '')
  )
    return false
  return true
}

export function earthChoiceSummary(
  reality: EarthReality,
  progress: OverworldEventProgress,
): string {
  const choice = progress.choices['8,8']
  if (!choice) return ''
  return (
    worldEvent(reality, '8,8')?.choices.find((item) => item.id === choice)
      ?.outcome ?? ''
  )
}

export function earthRealityCoverage(): string[] {
  const issues: string[] = []
  for (const reality of EARTH_REALITIES) {
    const scenes = worldEvents(reality)
    if (scenes.length !== 64) issues.push(reality + ' is missing map sites')
    const photos = earthRealityPhotos(reality)
    if (photos.length !== 2 || photos.some((key) => !worldEvent(reality, key)))
      issues.push(reality + ' requires two fixed photographs')
    const pivotal = worldEvent(reality, '8,8')
    if (!pivotal) issues.push(reality + ' requires its exit encounter')
    if (reality === 'e04' && pivotal?.choices.length !== 3)
      issues.push('Char must retain all three tide-gate outcomes')
  }
  return issues
}
