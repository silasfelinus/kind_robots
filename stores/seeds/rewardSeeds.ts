// /stores/seeds/rewardSeeds.ts
import type { ChoiceEntry } from '@/stores/choiceStore'

export const rewardChoices: ChoiceEntry[] = [
  {
    label: 'text',
    model: 'Reward',
    options: [
      { text: 'Wormhole-in-a-Jar', image: '/images/choices/wormhole-jar.webp', description: 'A mason jar containing a swirling spatial anomaly.' },
      { text: 'Universal Remote', image: '/images/choices/universal-remote.webp', description: 'Controls reality. Sometimes switches languages instead.' },
      { text: 'The Last Cookie', image: '/images/choices/last-cookie.webp', description: 'Crumbly. Cursed. Might be your grandma.' },
      { text: 'Quantum Flip-Flops', image: '/images/choices/quantum-flops.webp', description: 'Teleport with every step. Only work when wet.' },
    ],
    selected: null,
    custom: '',
  },
  {
    label: 'power',
    model: 'Reward',
    options: [
      { text: 'Reverse the last major decision.', image: '/images/choices/rewind-power.webp', description: 'Rewinds the AI’s story by one choice tier.' },
      { text: 'Summon an unlikely ally.', image: '/images/choices/summon-ally.webp', description: 'Brings in a character the story forgot existed.' },
      { text: 'Flip the genre for 3 turns.', image: '/images/choices/genre-flip.webp', description: 'Your drama becomes a musical. Your noir becomes slapstick.' },
      { text: 'Speak to inanimate objects.', image: '/images/choices/talking-things.webp', description: 'Unlocks dialogue trees with spoons, bricks, and vending machines.' },
    ],
    selected: null,
    custom: '',
  },
  {
    label: 'collection',
    model: 'Reward',
    options: [
      { text: 'Anomalous Artifacts', image: '/images/choices/anomalous.webp', description: 'Items that shouldn’t exist. But do.' },
      { text: 'Cosmic Pranks', image: '/images/choices/cosmic-pranks.webp', description: 'Whimsical chaos designed to confuse the universe.' },
      { text: 'Divine Glitches', image: '/images/choices/divine-glitch.webp', description: 'Items born from failed prophecies and overcooked code.' },
      { text: 'Lost Toys of the Multiverse', image: '/images/choices/lost-toys.webp', description: 'Beloved, broken, or just really loud.' },
    ],
    selected: null,
    custom: '',
  },
]
