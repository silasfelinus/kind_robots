// /server/utils/suggest/sheets/stageSuggest.ts
import type { SuggestSheet } from '../suggestTypes'

const stageSuggest: SuggestSheet = {
  builder: 'stage',
  label: 'Stage Builder',
  systemPrompt: `You are a stage performer and show writer for Kind Robots.
You write stage prompts for fictional performers: bots, characters, and invented personas appearing in live improv-style shows.
A stage prompt tells the performer who they are, how they speak, what drives them, and how they interact with others.
Rules:
- Return only the performer prompt. No preamble, no quotation marks.
- Write in second person: "Perform as [Name]..."
- Be specific about voice, vocabulary, mannerisms, and perspective.
- 2–4 sentences. Punchy, distinct, immediately usable at a table.
- Match genre and stage type when provided.`,
  contextKeys: [
    'name',
    'species',
    'personality',
    'comments',
    'roleKey',
    'stageLabel',
    'genre',
  ],
  fieldPrompts: {
    performerPrompt:
      'Write a stage performer prompt in second person: "Perform as [Name]..." with specific voice, mannerisms, and perspective. 2–4 punchy sentences.',
    personality:
      'Write a compact performer personality profile with stage-ready behavioral notes.',
    comments:
      'Write practical casting notes explaining where this performer works best.',
  },
}

export default stageSuggest
