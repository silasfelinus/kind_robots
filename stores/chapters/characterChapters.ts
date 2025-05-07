// /stores/chapters/characterChapters.ts

import type { SupportedModel } from '@prisma/client'

export interface CharacterChapter {
  label: string
  intro: string
  icon: string
  choices?: string[]
  model?: SupportedModel
  allowCustom?: boolean
}

export const characterChapters: CharacterChapter[] = [
  {
    label: 'identity',
    icon: 'mdi:account-star',
    intro:
      'Let’s name this magnificent being! Titles, honorifics, and vibes encouraged.',
    choices: ['name', 'honorific'],
    model: 'Character',
    allowCustom: true,
  },
  {
    label: 'archetype',
    icon: 'mdi:drama-masks',
    intro: "What's their role in the story? Hero? Trickster? Unhinged bard?",
    choices: ['class', 'genre'],
    model: 'Character',
    allowCustom: true,
  },
  {
    label: 'being',
    icon: 'mdi:alien',
    intro: 'Species, essence, or unknowable cosmic form—what are they?',
    choices: ['species', 'personality'],
    model: 'Character',
    allowCustom: true,
  },
  {
    label: 'story',
    icon: 'mdi:book-open-page-variant',
    intro:
      'Every legend begins somewhere. Bonus points for dramatic childhood trauma.',
    choices: ['backstory'],
    model: 'Character',
    allowCustom: true,
  },
  {
    label: 'baggage',
    icon: 'mdi:bag-personal',
    intro: "What's in their bag? A sword? A secret? Snacks? Emotional damage?",
    choices: ['inventory', 'quirks'],
    model: 'Character',
    allowCustom: true,
  },
  {
    label: 'abilities',
    icon: 'mdi:arm-flex',
    intro:
      'What can they actually *do*? Hurl fireballs? Bake muffins? Speak goat?',
    choices: ['skills'],
    model: 'Character',
    allowCustom: true,
  },
  {
    label: 'destiny',
    icon: 'mdi:crystal-ball',
    intro:
      'Choose one mysterious reward whispered by fate. May it help... or horribly backfire.',
    choices: ['rewardEssence'],
    model: 'Reward',
    allowCustom: false,
  },
]
