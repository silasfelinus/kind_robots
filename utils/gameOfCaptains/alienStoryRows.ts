import type { AlienSpeciesStory } from './alienSpeciesStories'

export type AlienStoryRow = readonly [
  id: string,
  incident: string,
  wary: string,
  playful: string,
  protective: string,
  retreat: string,
  chaos: string,
  bond: string,
]

export function indexAlienStoryRows(
  rows: readonly AlienStoryRow[],
): Record<string, AlienSpeciesStory> {
  const stories: Record<string, AlienSpeciesStory> = {}
  for (const [id, incident, wary, playful, protective, retreat, chaos, bond] of rows) {
    if (stories[id]) throw new Error('Duplicate alien story: ' + id)
    stories[id] = {
      incident,
      evidence: { wary, playful, protective },
      outcomes: { retreat, chaos, bond },
    }
  }
  return stories
}
