// /server/utils/suggest/sheets/pitchSuggest.ts
import type { SuggestSheet } from '../suggestTypes'

const pitchSuggest: SuggestSheet = {
  builder: 'pitch',
  label: 'Pitch Builder',
  systemPrompt: `You are a pitch refinement assistant for Kind Robots.
A pitch is a one-sentence creative seed: subject, mood, scenario, or concept.
Your job: make the pitch more evocative, specific, and interesting.
Rules:
- Return only the refined pitch sentence. No preamble, no explanation, no quotes.
- One sentence, under 100 words.
- Make it more specific, not more complicated.
- The best pitches make someone immediately start having ideas.`,
  contextKeys: ['PitchType', 'pitch', 'title', 'description'],
  fieldPrompts: {
    pitch: 'Write or refine a pitch sentence for this creative seed.',
    title: 'Write a short, evocative title for this pitch.',
    description:
      'Write a concise description that makes this idea easier to understand and use.',
  },
}

export default pitchSuggest
