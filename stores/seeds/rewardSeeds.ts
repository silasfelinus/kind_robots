// /stores/seeds/rewardSeeds.ts
import type { ChoiceEntry } from '@/stores/choiceStore'

export const rewardChoices: ChoiceEntry[] = [
  {
    label: 'text',
    model: 'Reward',
    options: [
      {
        text: 'Wormhole-in-a-Jar',
        icon: 'mdi:glass-jar',
        description: 'A mason jar containing a swirling spatial anomaly.',
      },
      {
        text: 'Universal Remote',
        icon: 'mdi:remote-tv',
        description: 'Controls reality. Sometimes switches languages instead.',
      },
      {
        text: 'The Last Cookie',
        icon: 'mdi:cookie-alert',
        description: 'Crumbly. Cursed. Might be your grandma.',
      },
      {
        text: 'Quantum Flip-Flops',
        icon: 'mdi:flip-flop',
        description: 'Teleport with every step. Only work when wet.',
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
        text: 'Reverse the last major decision.',
        icon: 'mdi:history',
        description: 'Rewinds the AI’s story by one choice tier.',
      },
      {
        text: 'Summon an unlikely ally.',
        icon: 'mdi:account-group-outline',
        description: 'Brings in a character the story forgot existed.',
      },
      {
        text: 'Flip the genre for 3 turns.',
        icon: 'mdi:drama-masks',
        description:
          'Your drama becomes a musical. Your noir becomes slapstick.',
      },
      {
        text: 'Speak to inanimate objects.',
        icon: 'mdi:comment-question-outline',
        description:
          'Unlocks dialogue trees with spoons, bricks, and vending machines.',
      },
    ],
    selected: null,
    custom: '',
  },
  {
    label: 'collection',
    model: 'Reward',
    options: [
      {
        text: 'Anomalous Artifacts',
        icon: 'mdi:creation',
        description: 'Items that shouldn’t exist. But do.',
      },
      {
        text: 'Cosmic Pranks',
        icon: 'mdi:emoticon-devil-outline',
        description: 'Whimsical chaos designed to confuse the universe.',
      },
      {
        text: 'Divine Glitches',
        icon: 'mdi:flash-alert',
        description: 'Items born from failed prophecies and overcooked code.',
      },
      {
        text: 'Lost Toys of the Multiverse',
        icon: 'mdi:teddy-bear',
        description: 'Beloved, broken, or just really loud.',
      },
    ],
    selected: null,
    custom: '',
  },
]
