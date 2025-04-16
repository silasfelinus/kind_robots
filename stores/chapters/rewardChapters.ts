// /stores/chapters/rewardChapters.ts

export interface RewardChapter {
  label: string
  intro: string
  icon: string
  choices?: string[]
  model?: 'Reward'
  allowCustom?: boolean
}

export const rewardChapters: RewardChapter[] = [
  {
    label: 'gift',
    icon: 'mdi:gift-outline',
    intro:
      'This reward changes everything—or maybe just makes snacks taste better. Pick something delightful or dangerous.',
    choices: ['rewardEssence'],
    model: 'Reward',
    allowCustom: true,
  },
  {
    label: 'tradeoff',
    icon: 'mdi:scale-balance',
    intro:
      "What’s the catch? Power always has a price—sometimes it's just *weird*.",
    choices: ['curse', 'cost'],
    model: 'Reward',
    allowCustom: true,
  },
]
