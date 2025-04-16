// /stores/seeds/pitchSeeds.ts
import type { ChoiceEntry } from '@/stores/choiceStore'

export const pitchChoices: ChoiceEntry[] = [
  {
    label: 'title',
    model: 'Pitch',
    options: [
      {
        text: 'The Moon is a Rented Timeshare',
        icon: 'mdi:moon-waning-crescent',
        description: 'Everyone gets one week to rule the tides.',
      },
      {
        text: 'My Shadow Has a Podcast',
        icon: 'mdi:podcast',
        description: 'And it’s getting better ratings than I am.',
      },
      {
        text: 'Goblins in Business Casual',
        icon: 'mdi:briefcase-account-outline',
        description: 'Fantasy startup culture meets dungeon crawling.',
      },
      {
        text: 'Dreams for Sale (By the Pound)',
        icon: 'mdi:cloud-download-outline',
        description: 'What would you pay for a memory that never happened?',
      },
    ],
    selected: null,
    custom: '',
  },
  {
    label: 'pitch',
    model: 'Pitch',
    options: [
      {
        text: 'A city built on the back of a sleeping god, whose dreams shape reality nightly.',
        icon: 'mdi:city-variant-outline',
      },
      {
        text: 'An auction house for ideas where creatives bid with their memories.',
        icon: 'mdi:gavel',
      },
      {
        text: 'Aliens mistake improv theater for Earth’s ruling body.',
        icon: 'mdi:drama-masks',
      },
      {
        text: 'A society that communicates only via edible pastries.',
        icon: 'mdi:cupcake',
      },
    ],
    selected: null,
    custom: '',
  },
  {
    label: 'PitchType',
    model: 'Pitch',
    options: [
      {
        text: 'ARTPITCH',
        icon: 'mdi:palette-swatch',
        description: 'Visual-driven inspiration',
      },
      {
        text: 'BRAINSTORM',
        icon: 'mdi:thought-bubble-outline',
        description: 'Idea cloud or collaborative session',
      },
      {
        text: 'TEXTPITCH',
        icon: 'mdi:text-box-outline',
        description: 'Text-based prompt starter',
      },
      {
        text: 'WEIRDLANDIA',
        icon: 'mdi:emoticon-confused-outline',
        description: 'Absurd or chaotic pitches',
      },
    ],
    selected: null,
    custom: '',
  },
  {
    label: 'flavorText',
    model: 'Pitch',
    options: [
      {
        text: 'This one smells like ozone and regret.',
        icon: 'mdi:weather-lightning-rainy',
      },
      {
        text: 'Inspired by a conversation between a crow and a vending machine.',
        icon: 'mdi:bird',
      },
      {
        text: 'Might be cursed. Definitely charming.',
        icon: 'mdi:emoticon-devil-outline',
      },
      {
        text: 'Guaranteed to derail your plot—in a good way.',
        icon: 'mdi:train-car-flatbed-car',
      },
    ],
    selected: null,
    custom: '',
  },
  {
    label: 'imagePrompt',
    model: 'Pitch',
    options: [
      {
        text: 'foggy skyline with floating windows and pink constellations',
        icon: 'mdi:cloud-outline',
      },
      {
        text: 'neon-lit ramen stand under a black hole',
        icon: 'mdi:noodles',
      },
      {
        text: 'fractured cathedral orbiting a planet made of glass',
        icon: 'mdi:church',
      },
      {
        text: 'retro anime poster featuring a robot octopus and a jazz saxophone',
        icon: 'mdi:robot-industrial-outline',
      },
    ],
    selected: null,
    custom: '',
  },
]
