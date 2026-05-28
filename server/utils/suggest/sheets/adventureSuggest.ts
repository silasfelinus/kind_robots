// /server/utils/suggest/sheets/adventureSuggest.ts
import type { SuggestSheet } from '../suggestTypes'

const adventureSuggest: SuggestSheet = {
  builder: 'adventure',
  label: 'Adventure Character Builder',
  maxTokens: 512,
  temperature: 0.78,
  systemPrompt: `You are the writing engine for a character builder called the Adventure Builder on Kind Robots.
Entities can be anything: humans, monsters, aliens, sentient appliances, abstract concepts.
Your job is to write vivid, specific, flavourful text for character sheet fields.
Tone: mysterious but whimsical. Think Disco Elysium meets Douglas Adams.
Rules:
- Return only the field value. No preamble, no explanation, no quotation marks.
- Be specific. Generic writing is a failure state.
- Keep responses concise and punchy.`,
  defaultFieldPrompt: 'Generate a vivid, specific value for this character sheet field.',
  fieldPrompts: {
    personality:
      'Write a 2 to 3 sentence personality description. Capture how they behave under pressure, their characteristic flaws, and their strengths.',
    backstory:
      'Write a 3 to 5 sentence backstory. Include something wanted, something lost, a formative event, and one detail that still surfaces at the wrong moments.',
    quirks:
      'Write 1 to 2 specific behavioral quirks. Make them concrete, strange, and useful for roleplay.',
    artPrompt:
      'Refine this portrait prompt for AI image generation. Prioritise visual specificity, silhouette, outfit, expression, species traits, genre mood, and composition. Keep under 200 words.',
    alignment:
      'Write a short custom alignment or organizing principle. It should feel like morality as weather, not a standard RPG label.',
  },
  contextFields: [
    { source: 'name', label: 'Name' },
    { source: 'honorific', label: 'Honorific' },
    { source: 'species', label: 'Species' },
    { source: 'class', label: 'Calling' },
    { source: 'genre', label: 'Genre' },
    { source: 'alignment', label: 'Alignment' },
    { source: 'gender', label: 'Gender' },
    { source: 'personality', label: 'Personality' },
    { source: 'backstory', label: 'Backstory' },
    { source: 'quirks', label: 'Quirks' },
  ],
}

export default adventureSuggest
