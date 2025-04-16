// /stores/chapters/botChapters.ts

export interface BotChapter {
  label: string
  intro: string
  icon: string
  choices?: string[]
  model?: 'Bot'
  allowCustom?: boolean
}

export const botChapters: BotChapter[] = [
  {
    label: 'core',
    icon: 'mdi:chip',
    intro:
      'Every bot has a purpose—or at least a glitch pretending to be one. Let’s define their core function.',
    choices: ['function'],
    model: 'Bot',
    allowCustom: true,
  },
  {
    label: 'voice',
    icon: 'mdi:microphone-settings',
    intro: 'What do they sound like? Soothing? Unhinged? Mysteriously British?',
    choices: ['voice'],
    model: 'Bot',
    allowCustom: true,
  },
  {
    label: 'quirks',
    icon: 'mdi:emoticon-dead-outline',
    intro:
      'Perfect systems are boring. Let’s sprinkle in some delightful malfunctions.',
    choices: ['quirks'],
    model: 'Bot',
    allowCustom: true,
  },
]
