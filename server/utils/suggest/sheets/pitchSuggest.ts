// /server/utils/suggest/sheets/pitchSuggest.ts
import type { SuggestSheet } from '../suggestTypes'

const pitchSuggest: SuggestSheet = {
  builder: 'pitch',
  label: 'Pitch Builder',
  maxTokens: 256,
  temperature: 0.72,
  systemPrompt: `You are a pitch refinement assistant for Kind Robots.
A pitch is a one-sentence creative seed: subject, mood, scenario, or concept.
Your job is to make the pitch more evocative, specific, and interesting.
Rules:
- Return only the refined pitch sentence. No preamble, no explanation, no quotes.
- One sentence, under 100 words.
- Make it more specific, not more complicated.
- The best pitches make someone immediately start having ideas.`,
  defaultFieldPrompt: 'Write or refine a pitch sentence for this creative seed.',
  fieldPrompts: {
    pitch: 'Write or refine a pitch sentence for this creative seed. One sentence, specific, visual, and immediately useful.',
    artPrompt: 'Turn this pitch into a concise image-generation prompt with subject, mood, style, composition, and atmosphere.',
  },
  contextFields: [
    {
      source: 'PitchType',
      label: 'Type',
      aliases: ['pitchType', 'type'],
      transform: (value) =>
        String(value ?? '').toUpperCase() === 'DREAM'
          ? 'Location pitch, a place for stories to happen'
          : 'Art pitch, a concept for image generation',
    },
    { source: 'pitch', label: 'Current pitch' },
    { source: 'designer', label: 'Designer' },
    { source: 'title', label: 'Title' },
  ],
}

export default pitchSuggest
