import type { EncounterCard, SceneKind, SkillId } from './content'
import arcata from './regionalData/chapter01.json'
import coast from './regionalData/chapter02.json'
import bay from './regionalData/chapter03.json'
import backroads from './regionalData/chapter04.json'
import southern from './regionalData/chapter05.json'
import festival from './regionalData/chapter06.json'

/**
 * Text-only authored regional scripts. Every row has a premise, a new scene
 * escalation, a verifiable investigation with two results, and a materially
 * different care/community resolution. Human editorial review remains open.
 */
export type RegionalScript = {
  id: string
  title: string
  premise: string
  chapter: number
  place: string
  scene: SceneKind
  pool: number
  pressure: string
  investigate: string
  success: string
  failure: string
  help: string
  helpOutcome: string
}

export const REGIONAL_SCRIPTS: RegionalScript[] = [
  ...arcata,
  ...coast,
  ...bay,
  ...backroads,
  ...southern,
  ...festival,
] as RegionalScript[]

const CHECK_SKILLS: SkillId[] = [
  'wits',
  'psyche',
  'lore',
  'wits',
  'lore',
  'burly',
]

export const REGIONAL_QUESTS: EncounterCard[] = REGIONAL_SCRIPTS.map(
  (script) => {
    const id = script.id.toLowerCase().replaceAll('-', '_')
    return {
      id: script.id,
      kind: 'encounter',
      chapter: script.chapter,
      place: script.place,
      title: script.title,
      scene: script.scene,
      body: [script.premise, script.pressure],
      choices: [
        {
          id: 'investigate',
          label: script.investigate,
          check: {
            skill: CHECK_SKILLS[script.chapter - 1]!,
            target: script.chapter <= 2 ? 7 : 9,
          },
          success: {
            text: script.success,
            effects: {
              evidence: `${script.title}: corroborated anomaly`,
              flag: `${id}_verified`,
            },
          },
          failure: {
            text: script.failure,
            effects: { weird: 1, flag: `${id}_partial` },
          },
        },
        {
          id: 'care',
          label: script.help,
          success: {
            text: script.helpOutcome,
            effects: { goodwill: 1, flag: `${id}_care` },
          },
        },
      ],
      provenance:
        'Regional place context follows the Ecotone seed atlas. All characters, dialogue, documents and impossible phenomena in this card are fictional; no public organization is claimed to have participated.',
    }
  },
)
