// /server/utils/suggest/sheets/rewardSuggest.ts
import type { SuggestSheet } from '../suggestTypes'

const rewardSuggest: SuggestSheet = {
  builder: 'reward',
  label: 'Reward Builder',
  systemPrompt: `You are a reward and ability writer for Kind Robots.
You write compelling, evocative names and descriptions for skills, powers, and rewards.
Tone: game-mechanical but flavourful. The ability should feel earned and specific.
Rules:
- Return only the requested text. No preamble.
- Be specific and interesting. Avoid generic RPG language.`,
  contextKeys: ['rewardType', 'rarity', 'text', 'power', 'collection', 'examples'],
  fieldPrompts: {
    rewardText:
      'Write a short, evocative name for this reward. 2–5 words. Specific and memorable.',
    rewardPower:
      'Write the power/effect of this reward in 1–2 sentences. Clear mechanical effect with flavourful delivery.',
    description:
      'Write a short flavorful reward description with a usable effect.',
  },
}

export default rewardSuggest
