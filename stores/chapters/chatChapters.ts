// /stores/chapters/chatChapters.ts

export interface ChatChapter {
  label: string
  intro: string
  icon: string
  choices?: string[]
  model?: 'Chat'
  allowCustom?: boolean
}

export const chatChapters: ChatChapter[] = [
  {
    label: 'type',
    icon: 'mdi:robot-happy',
    intro:
      'Who—or what—are you talking to? Choose your conversational companion, from muse to menace.',
    choices: ['type'],
    model: 'Chat',
    allowCustom: false,
  },
  {
    label: 'title',
    icon: 'mdi:chat-question',
    intro:
      'Give your chat a mood, a name, a plot twist. Or just call it ‘Tuesday.’ We won’t judge.',
    choices: ['title'],
    model: 'Chat',
    allowCustom: true,
  },
  {
    label: 'channel',
    icon: 'mdi:chat-processing-outline',
    intro:
      'Which stream shall this conversation join? Choose a channel that suits your vibe.',
    choices: ['channel'],
    model: 'Chat',
    allowCustom: false,
  },
  {
    label: 'artPrompt',
    icon: 'mdi:image-filter-hdr',
    intro:
      'Visualize the chat’s aesthetic. Lo-fi lounge? Dreamy void? Neon shrine? Let’s set the mood.',
    choices: ['artPrompt'],
    model: 'Chat',
    allowCustom: true,
  },
]
