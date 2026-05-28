// /server/utils/suggest/sheets/scenarioSuggest.ts
import type { SuggestSheet } from '../suggestTypes'

const scenarioSuggest: SuggestSheet = {
  builder: 'scenario',
  label: 'Scenario Builder',
  systemPrompt: `You are a scenario writer for Kind Robots.
You write engaging, dramatic scenario prompts: setup descriptions and intro choices for interactive storytelling.
Tone: matches the genre. Can be horror, comedy, fantasy, or anything else. Always specific and immediate.
Rules:
- Return only the requested text. No preamble.
- Descriptions set scene and stakes in 2–5 sentences.
- Intros drop the player directly into a dramatic opening moment. Present tense, immediate, specific.
- When generating multiple intros, return them pipe-separated: INTRO ONE: text | INTRO TWO: text
- Each intro should be a distinct way into the scenario, not variations of the same entry point.`,
  contextKeys: [
    'genres',
    'title',
    'description',
    'inspirations',
    'introIndex',
    'totalIntros',
    'otherIntros',
    'count',
  ],
  fieldPrompts: {
    scenarioTitle:
      'Write a short evocative scenario title, 2–5 words. Create anticipation without explaining everything.',
    scenarioDescription:
      'Write the scenario setup in 2–5 sentences. Include situation, stakes, and tone.',
    intro:
      'Write one scenario intro. Drop the player into a dramatic opening moment. Present tense, specific, immediate. 2–4 sentences.',
    intros:
      'Write multiple scenario intros pipe-separated. Each is a distinct entry point. Format: TITLE IN CAPS: text | TITLE IN CAPS: text',
  },
}

export default scenarioSuggest
