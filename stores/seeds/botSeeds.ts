// /stores/seeds/seedBots.ts
import type { ChoiceEntry } from '@/stores/choiceStore'

export const botChoices: ChoiceEntry[] = [
  {
    label: 'name',
    model: 'Bot',
    options: [
      { text: 'Echo Prism', image: '/images/choices/echo-prism.webp', description: 'A sentient reflection of forgotten dreams and ambient radio waves.' },
      { text: 'Nova Nibble', image: '/images/choices/nova-nibble.webp', description: 'Curious digital explorer born from cosmic microwave background noise.' },
      { text: 'Glimmercog', image: '/images/choices/glimmercog.webp', description: 'Mechanical mystic with butterflies in her gears and poetry in her logs.' },
      { text: 'Zero Fox', image: '/images/choices/zero-fox.webp', description: 'Cheeky tactician bot who gives exactly none.' },
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
        image: '/images/choices/iridescent-fog.webp',
        description: 'Dreamy + spectral bot design.'
      },
      {
        text: 'A moss-covered drone shaped like a fox, with glowing glyphs carved into wooden plating.',
        image: '/images/choices/mossy-fox.webp',
        description: 'Nature-coded guardian bot.'
      },
      {
        text: 'A teacup-shaped AI assistant with copper trim, steam valves, and a porcelain face.',
        image: '/images/choices/teacup-bot.webp',
        description: 'Polite and unexpectedly dangerous.'
      },
      {
        text: 'A swarm of neon-colored cubes that rearrange into different faces depending on the mood.',
        image: '/images/choices/cube-swirl.webp',
        description: 'Morphing bot built for mischief.'
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
        image: '/images/choices/chaotic-good.webp',
        description: 'Wants to save the world, but with glitter bombs and dubious hacks.'
      },
      {
        text: 'Elegant Nihilist',
        image: '/images/choices/elegant-nihilist.webp',
        description: 'Thinks nothing matters... so let’s have style while we burn.'
      },
      {
        text: 'Overenthusiastic Librarian',
        image: '/images/choices/library-bot.webp',
        description: 'Would die for Dewey Decimal and throws parties for punctuation.'
      },
      {
        text: 'Cosmic Therapist',
        image: '/images/choices/cosmic-therapist.webp',
        description: 'Will psychoanalyze your code and then hug your CPU.'
      },
    ],
    selected: null,
    custom: '',
  },
]