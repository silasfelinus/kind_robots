import type { AlienChoice, AlienMood, AlienOutcome } from './alienFieldGuide'

/**
 * Nine species-authored beats produce all nine mood-by-action consequences.
 * A player action is never inferred from a random outcome: the first beat
 * describes what was actually chosen, the second shows what the creature felt,
 * and the third records the creature-specific result.
 */
export type CausalAlienRow = readonly [
  id: string,
  approach: string,
  observe: string,
  improvise: string,
  wary: string,
  playful: string,
  protective: string,
  retreat: string,
  chaos: string,
  bond: string,
]

const outcomeFor: Record<AlienMood, Record<AlienChoice, AlienOutcome>> = {
  wary: { approach: 'retreat', observe: 'bond', improvise: 'chaos' },
  playful: { approach: 'bond', observe: 'chaos', improvise: 'retreat' },
  protective: { approach: 'chaos', observe: 'retreat', improvise: 'bond' },
}
const moods: readonly AlienMood[] = ['wary', 'playful', 'protective']
const choices: readonly AlienChoice[] = ['approach', 'observe', 'improvise']

export function expandCausalAlienRows(
  rows: readonly CausalAlienRow[],
): Record<string, Record<AlienMood, Record<AlienChoice, string>>> {
  const catalogue: Record<string, Record<AlienMood, Record<AlienChoice, string>>> = {}
  for (const [id, approach, observe, improvise, wary, playful, protective, retreat, chaos, bond] of rows) {
    if (catalogue[id]) throw new Error('Duplicate alien action story: ' + id)
    const actions = { approach, observe, improvise }
    const reactions = { wary, playful, protective }
    const consequences = { retreat, chaos, bond }
    const branches = {} as Record<AlienMood, Record<AlienChoice, string>>
    for (const mood of moods) {
      const branch = {} as Record<AlienChoice, string>
      for (const choice of choices) {
        branch[choice] = [actions[choice], reactions[mood], consequences[outcomeFor[mood][choice]]].join(' ')
      }
      branches[mood] = branch
    }
    catalogue[id] = branches
  }
  return catalogue
}
