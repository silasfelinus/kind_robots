// /stores/seeds/botSeeds.ts
import type { ChoiceEntry } from '@/stores/choiceStore'

export const botChoices: ChoiceEntry[] = [
  {
    label: 'name',
    model: 'Bot',
    options: [
      {
        text: 'Echo Prism',
        icon: 'mdi:radio-tower',
        description:
          'A sentient reflection of forgotten dreams and ambient radio waves.',
      },
      {
        text: 'Nova Nibble',
        icon: 'mdi:star-shooting-outline',
        description:
          'Curious digital explorer born from cosmic microwave background noise.',
      },
      {
        text: 'Glimmercog',
        icon: 'mdi:cog-sync-outline',
        description:
          'Mechanical mystic with butterflies in her gears and poetry in her logs.',
      },
      {
        text: 'Zero Fox',
        icon: 'mdi:emoticon-poop-outline',
        description: 'Cheeky tactician bot who gives exactly none.',
      },
    ],
    selected: null,
    custom: '',
  },
  {
    label: 'description',
    model: 'Bot',
    options: [
      {
        text: 'An iridescent crystal automaton floating above a bed of fog, powered by sound and sorrow.',
        icon: 'mdi:crystal-ball',
        description: 'Dreamy + spectral bot design.',
      },
      {
        text: 'A moss-covered drone shaped like a fox, with glowing glyphs carved into wooden plating.',
        icon: 'mdi:leaf',
        description: 'Nature-coded guardian bot.',
      },
      {
        text: 'A teacup-shaped AI assistant with copper trim, steam valves, and a porcelain face.',
        icon: 'mdi:cup-outline',
        description: 'Polite and unexpectedly dangerous.',
      },
      {
        text: 'A swarm of neon-colored cubes that rearrange into different faces depending on the mood.',
        icon: 'mdi:cube-scan',
        description: 'Morphing bot built for mischief.',
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
        text: 'Chaotic Good',
        icon: 'mdi:emoticon-cool-outline',
        description:
          'Wants to save the world, but with glitter bombs and dubious hacks.',
      },
      {
        text: 'Elegant Nihilist',
        icon: 'mdi:weather-night',
        description:
          'Thinks nothing matters... so let’s have style while we burn.',
      },
      {
        text: 'Overenthusiastic Librarian',
        icon: 'mdi:book-open-page-variant-outline',
        description:
          'Would die for Dewey Decimal and throws parties for punctuation.',
      },
      {
        text: 'Cosmic Therapist',
        icon: 'mdi:account-heart-outline',
        description: 'Will psychoanalyze your code and then hug your CPU.',
      },
    ],
    selected: null,
    custom: '',
  },
]
