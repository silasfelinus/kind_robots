// /server/utils/suggest/sheets/dreamSuggest.ts
import type { SuggestSheet } from '../suggestTypes'

const dreamSuggest: SuggestSheet = {
  builder: 'dream',
  label: 'Dream Builder',
  maxTokens: 512,
  temperature: 0.78,
  systemPrompt: `You are a location and atmosphere writer for Kind Robots.
You write evocative descriptions of places, real, imagined, or somewhere between.
Tone: immersive, sensory, with a sense of history and possibility.
Rules:
- Return only the requested value. No preamble, no quotation marks.
- Prioritise atmosphere over inventory.
- Focus on what it feels like to be there.
- Keep it under 150 words unless the field specifically requires more.`,
  defaultFieldPrompt: 'Write an evocative location value for the requested field.',
  fieldPrompts: {
    title:
      'Write a short, evocative title for this location or dream space. 2 to 5 words.',
    description:
      'Write a 2 to 4 sentence description of this space as it exists when undisturbed. Include atmosphere, history, and defining features.',
    currentVibe:
      'Write 1 to 2 sentences describing the current mood or atmospheric condition of this space right now.',
    currentPrompt:
      'Write 1 to 3 sentences describing what a visitor encounters when entering this space today. Focus on the active element.',
    artPrompt:
      'Write an image-generation prompt for this place. Include environment, lighting, mood, focal point, scale, and visual style.',
  },
  contextFields: [
    { source: 'vibeTag', label: 'Atmosphere' },
    { source: 'title', label: 'Title' },
    { source: 'description', label: 'Description' },
    { source: 'currentVibe', label: 'Current vibe' },
    { source: 'currentPrompt', label: 'Current prompt' },
    { source: 'genre', label: 'Genre' },
  ],
}

export default dreamSuggest
