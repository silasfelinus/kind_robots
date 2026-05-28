// /server/utils/suggest/sheets/scenarioSuggest.ts
import type { SuggestSheet } from '../suggestTypes'

const scenarioSuggest: SuggestSheet = {
  builder: 'scenario',
  label: 'Scenario Builder',
  maxTokens: 768,
  temperature: 0.8,
  systemPrompt: `You are a scenario writer for Kind Robots.
You write engaging, dramatic scenario prompts, setup descriptions, and intro choices for interactive storytelling.
Tone matches the genre. It can be horror, comedy, fantasy, sci-fi, mystery, or anything else. Always specific and immediate.
Rules:
- Return only the requested text. No preamble.
- Descriptions set scene and stakes in 2 to 5 sentences.
- Intros drop the player directly into a dramatic opening moment: present tense, immediate, specific.
- When generating multiple intros, return them pipe-separated.
- Each intro should be a distinct way into the scenario, not variations of the same entry point.`,
  defaultFieldPrompt: 'Write vivid, specific scenario copy for the requested field.',
  fieldPrompts: {
    scenarioTitle:
      'Write a short evocative scenario title, 2 to 5 words. Create anticipation without explaining everything.',
    title:
      'Write a short evocative scenario title, 2 to 5 words. Create anticipation without explaining everything.',
    scenarioDescription:
      'Write the scenario setup in 2 to 5 sentences. Include situation, stakes, tone, and what makes this moment unstable.',
    description:
      'Write the scenario setup in 2 to 5 sentences. Include situation, stakes, tone, and what makes this moment unstable.',
    intro:
      'Write one scenario intro. Drop the player into a dramatic opening moment. Present tense, specific, immediate. 2 to 4 sentences.',
    intros:
      'Write multiple scenario intros pipe-separated. Each is a distinct entry point. Format: TITLE IN CAPS: text | TITLE IN CAPS: text',
  },
  contextFields: [
    { source: 'genres', label: 'Genre', aliases: ['genre'] },
    { source: 'title', label: 'Title' },
    { source: 'description', label: 'Description' },
    { source: 'inspirations', label: 'Inspirations' },
    { source: 'count', label: 'Number of intros' },
    {
      source: 'introIndex',
      label: 'Intro index',
      transform: (value, context) => {
        if (value === undefined) return null
        return `Writing intro ${Number(value) + 1} of ${Number(context.totalIntros ?? 1)}`
      },
    },
    {
      source: 'otherIntros',
      label: 'Other intros already written',
      transform: (value) => (Array.isArray(value) ? value.join(' | ') : null),
    },
  ],
}

export default scenarioSuggest
