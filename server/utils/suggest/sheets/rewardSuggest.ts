// /server/utils/suggest/sheets/rewardSuggest.ts
import type { SuggestSheet } from '../suggestTypes'

const rewardSuggest: SuggestSheet = {
  builder: 'reward',
  label: 'Reward Builder',
  maxTokens: 384,
  temperature: 0.76,
  systemPrompt: `You are a reward and ability writer for Kind Robots.
You write compelling names and descriptions for skills, powers, items, and rewards.
Tone: game-mechanical but flavourful. The ability should feel earned and specific.
Rules:
- Return only the requested text. No preamble.
- Be specific and interesting.
- Avoid generic RPG language.
- Make mechanics readable without making the text boring.`,
  defaultFieldPrompt: 'Write specific, flavourful reward copy for the requested field.',
  fieldPrompts: {
    rewardText:
      'Write a short, evocative name for this reward. 2 to 5 words. Specific and memorable.',
    text: 'Write a short, evocative name for this reward. 2 to 5 words. Specific and memorable.',
    name: 'Write a short, evocative name for this reward. 2 to 5 words. Specific and memorable.',
    rewardPower:
      'Write the power or effect of this reward in 1 to 2 sentences. Clear mechanical effect with flavourful delivery.',
    power:
      'Write the power or effect of this reward in 1 to 2 sentences. Clear mechanical effect with flavourful delivery.',
    description:
      'Write a compact reward description that explains the vibe, effect, and why someone would want it.',
    artPrompt:
      'Write an image-generation prompt for this reward as a collectible game asset. Include shape, material, glow, mood, rarity, and icon readability.',
  },
  contextFields: [
    { source: 'rewardType', label: 'Type' },
    { source: 'rarity', label: 'Rarity' },
    { source: 'text', label: 'Name' },
    { source: 'power', label: 'Current power' },
    { source: 'collection', label: 'Collection' },
    {
      source: 'examples',
      label: 'Examples',
      transform: (value) => {
        if (!Array.isArray(value)) return null
        return value
          .slice(0, 2)
          .map((entry) => {
            if (!entry || typeof entry !== 'object') return ''
            const record = entry as Record<string, unknown>
            return `${record.text ?? 'Reward'}: ${record.power ?? ''}`
          })
          .filter(Boolean)
          .join(' | ')
      },
    },
  ],
}

export default rewardSuggest
