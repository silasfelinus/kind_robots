// /stores/seeds/seedChoices.ts

import type { ChoiceEntry } from '@/stores/choiceStore'

export const seedChoices: ChoiceEntry[] = [
  {
    label: 'species',
    model: 'Character',
    options: [
      {
        text: 'Elf',
        image: '/images/choices/elf.webp',
        description: 'Graceful, magical, and slightly smug.',
      },
      {
        text: 'Goblin',
        image: '/images/choices/goblin.webp',
        description: 'Small, scrappy, and full of schemes.',
      },
    ],
    selected: null,
    custom: '',
  },
  {
    label: 'personality',
    model: 'Bot',
    options: [
      {
        text: 'Whimsical',
        image: '/images/choices/whimsical.webp',
        description: 'Unpredictable, fun, and a bit chaotic.',
      },
      {
        text: 'Stoic',
        image: '/images/choices/stoic.webp',
        description: 'A serious face in a world of silliness.',
      },
    ],
    selected: null,
    custom: '',
  },
  {
    label: 'genre',
    model: 'Scenario',
    options: [
      {
        text: 'Sci-Fi',
        image: '/images/choices/scifi.webp',
        description: 'Aliens, lasers, and philosophical dread.',
      },
      {
        text: 'Fantasy',
        image: '/images/choices/fantasy.webp',
        description: 'Swords, spells, and ancient prophecies.',
      },
    ],
    selected: null,
    custom: '',
  },
  {
    label: 'pitchType',
    model: 'Pitch',
    options: [
      {
        text: 'ARTPITCH',
        image: '/images/choices/artpitch.webp',
        description: 'Visual inspiration with AI-generated art.',
      },
      {
        text: 'BRAINSTORM',
        image: '/images/choices/brainstorm.webp',
        description: 'Collaborative idea cloud.',
      },
    ],
    selected: null,
    custom: '',
  },
  {
    label: 'power',
    model: 'Reward',
    options: [
      {
        text: 'Explode Everything',
        image: '/images/choices/explode.webp',
        description: 'Turns narrative into confetti.',
      },
      {
        text: 'Talk to Animals',
        image: '/images/choices/animals.webp',
        description: 'Finally explain taxes to squirrels.',
      },
    ],
    selected: null,
    custom: '',
  },
]
