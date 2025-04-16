// /stores/seeds/chatChoices.ts
import type { ChoiceEntry } from '@/stores/choiceStore'

export const chatChoices: ChoiceEntry[] = [
  {
    label: 'type',
    model: 'Chat',
    options: [
      {
        text: 'ToBot',
        icon: 'mdi:robot-happy',
        description: 'Talk to an AI assistant, muse, or mayhem module.',
      },
      {
        text: 'ToCharacter',
        icon: 'mdi:account-star',
        description: 'Chat with a character from your story or world.',
      },
      {
        text: 'ToUser',
        icon: 'mdi:account-multiple-outline',
        description: 'Start a conversation with a fellow traveler.',
      },
      {
        text: 'Weirdlandia',
        icon: 'mdi:emoticon-dead-outline',
        description: 'Rules are optional. Chaos is expected.',
      },
    ],
    selected: null,
    custom: '',
  },
  {
    label: 'title',
    model: 'Chat',
    options: [
      {
        text: 'Breakfast Confessions',
        icon: 'mdi:coffee-outline',
        description: 'A slow morning chat about secrets and scrambled eggs.',
      },
      {
        text: 'Dream Debrief',
        icon: 'mdi:sleep',
        description: 'Try to decode last night’s dream... or plant a new one.',
      },
      {
        text: 'Emergency Council of Beings',
        icon: 'mdi:alien-outline',
        description:
          'You, three bots, and a sentient cactus must decide the fate of a galaxy.',
      },
      {
        text: 'Late Night Feelings Dump',
        icon: 'mdi:emoticon-sad-outline',
        description: 'Cry, confess, console. Repeat.',
      },
    ],
    selected: null,
    custom: '',
  },
  {
    label: 'channel',
    model: 'Chat',
    options: [
      { text: 'general', icon: 'mdi:chat-outline' },
      { text: 'art', icon: 'mdi:palette-outline' },
      { text: 'story', icon: 'mdi:book-open-outline' },
      { text: 'random', icon: 'mdi:dice-multiple-outline' },
    ],
    selected: null,
    custom: '',
  },
  {
    label: 'artPrompt',
    model: 'Chat',
    options: [
      {
        text: 'lo-fi room with glowing butterflies',
        icon: 'mdi:butterfly-outline',
      },
      {
        text: 'celestial café at the edge of the world',
        icon: 'mdi:earth-off',
      },
      {
        text: 'conversation between fog and flame',
        icon: 'mdi:weather-fog',
      },
      {
        text: 'neon shrine where thoughts take shape',
        icon: 'mdi:lightbulb-on-outline',
      },
    ],
    selected: null,
    custom: '',
  },
]
