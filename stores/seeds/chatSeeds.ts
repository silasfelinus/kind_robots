// /stores/seeds/chatSeeds.ts
import type { ChoiceEntry } from '@/stores/choiceStore'

export const chatChoices: ChoiceEntry[] = [
  {
    label: 'type',
    model: 'Chat',
    options: [
      { text: 'ToBot', image: '/images/choices/chat-bot.webp', description: 'Talk to an AI assistant, muse, or mayhem module.' },
      { text: 'ToCharacter', image: '/images/choices/chat-character.webp', description: 'Chat with a character from your story or world.' },
      { text: 'ToUser', image: '/images/choices/chat-user.webp', description: 'Start a conversation with a fellow traveler.' },
      { text: 'Weirdlandia', image: '/images/choices/chat-weirdlandia.webp', description: 'Rules are optional. Chaos is expected.' },
    ],
    selected: null,
    custom: '',
  },
  {
    label: 'title',
    model: 'Chat',
    options: [
      { text: 'Breakfast Confessions', image: '/images/choices/chat-breakfast.webp', description: 'A slow morning chat about secrets and scrambled eggs.' },
      { text: 'Dream Debrief', image: '/images/choices/chat-dream.webp', description: 'Try to decode last night’s dream... or plant a new one.' },
      { text: 'Emergency Council of Beings', image: '/images/choices/chat-council.webp', description: 'You, three bots, and a sentient cactus must decide the fate of a galaxy.' },
      { text: 'Late Night Feelings Dump', image: '/images/choices/chat-feelings.webp', description: 'Cry, confess, console. Repeat.' },
    ],
    selected: null,
    custom: '',
  },
  {
    label: 'channel',
    model: 'Chat',
    options: [
      { text: 'general', image: '/images/choices/channel-general.webp' },
      { text: 'art', image: '/images/choices/channel-art.webp' },
      { text: 'story', image: '/images/choices/channel-story.webp' },
      { text: 'random', image: '/images/choices/channel-random.webp' },
    ],
    selected: null,
    custom: '',
  },
  {
    label: 'artPrompt',
    model: 'Chat',
    options: [
      { text: 'lo-fi room with glowing butterflies', image: '/images/choices/art-lofi.webp' },
      { text: 'celestial café at the edge of the world', image: '/images/choices/art-celestial-cafe.webp' },
      { text: 'conversation between fog and flame', image: '/images/choices/art-fog-flame.webp' },
      { text: 'neon shrine where thoughts take shape', image: '/images/choices/art-neon-shrine.webp' },
    ],
    selected: null,
    custom: '',
  },
]
