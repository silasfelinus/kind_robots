// /stores/chapters/scenarioChapters.ts

export interface ScenarioChapter {
  label: string
  intro: string
  icon: string
  choices?: string[]
  model?: 'Scenario'
  allowCustom?: boolean
}

export const scenarioChapters: ScenarioChapter[] = [
  {
    label: 'setting',
    icon: 'mdi:map-search-outline',
    intro: 'Where are we? Desert moon? Haunted bakery? Suburban jungle gym?',
    choices: ['setting'],
    model: 'Scenario',
    allowCustom: true,
  },
  {
    label: 'genre',
    icon: 'mdi:book-variant',
    intro: 'What story is this trying to be? Or failing to be, with style?',
    choices: ['genre'],
    model: 'Scenario',
    allowCustom: true,
  },
  {
    label: 'hook',
    icon: 'mdi:hook-off',
    intro:
      'Give the story its dramatic spark. A mystery, a crisis, a lunch gone terribly wrong.',
    choices: ['prompt'],
    model: 'Scenario',
    allowCustom: true,
  },
]
