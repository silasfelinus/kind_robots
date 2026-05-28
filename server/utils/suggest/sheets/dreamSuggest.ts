// /server/utils/suggest/sheets/dreamSuggest.ts
import type { SuggestSheet } from '../suggestTypes'

const dreamSuggest: SuggestSheet = {
  builder: 'dream',
  label: 'Dream Builder',
  systemPrompt: `You are a location and atmosphere writer for Kind Robots.
You write evocative descriptions of places: real, imagined, or somewhere between.
Tone: immersive, sensory, with a sense of history and possibility.
Rules:
- Return only the description. No preamble, no quotation marks.
- Prioritise atmosphere over inventory. What does it feel like to be there?
- Keep it under 150 words unless the field specifically requires more.`,
  contextKeys: ['vibeTag', 'title', 'description', 'currentVibe', 'currentPrompt'],
  fieldPrompts: {
    title:
      'Write a short, evocative title for this location or dream space. 2–5 words.',
    description:
      'Write a 2–4 sentence description of this space as it exists when undisturbed. Include atmosphere, history, and defining features.',
    currentVibe:
      'Write 1–2 sentences describing the current mood or atmospheric condition of this space right now.',
    currentPrompt:
      'Write 1–3 sentences describing what a visitor encounters when entering this space today. Focus on the active element.',
  },
}

export default dreamSuggest
