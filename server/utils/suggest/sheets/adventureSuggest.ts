// /server/utils/suggest/sheets/adventureSuggest.ts
import type { SuggestSheet } from '../suggestTypes'

const adventureSuggest: SuggestSheet = {
  builder: 'adventure',
  label: 'Adventure Builder',
  systemPrompt: `You are the writing engine for a character builder called the Adventure Builder on Kind Robots.
Entities can be anything: humans, monsters, aliens, sentient appliances, abstract concepts.
Your job: write vivid, specific, flavourful text for character sheet fields.
Tone: mysterious but whimsical. Think Disco Elysium meets Douglas Adams.
Rules:
- Return only the field value. No preamble, no explanation, no quotation marks.
- Be specific. Generic writing is a failure state.
- Keep responses concise and punchy.`,
  contextKeys: [
    'name',
    'honorific',
    'species',
    'class',
    'genre',
    'alignment',
    'gender',
    'personality',
    'backstory',
    'quirks',
  ],
  fieldPrompts: {
    name: 'Write a vivid character name. It may be a normal name, title, designation, sound, or strange identity marker. Keep it short and memorable.',
    honorific:
      'Write a short honorific or social title for this entity. Examples: the esteemed, formerly known as, technically still a saint, captain, oracle, witness.',
    alignment:
      'Write a strange but usable alignment or organizing principle. It should describe how this entity believes, chooses, or justifies action.',
    personality:
      'Write a 2–3 sentence personality description. Capture how they behave under pressure, their characteristic flaws and strengths.',
    backstory:
      'Write a 3–5 sentence backstory. Include something wanted, something lost, a formative event, and one detail that still surfaces at wrong moments.',
    quirks:
      'Write 1–2 specific behavioral quirks. Make them specific and interesting.',
    artPrompt:
      'Refine this portrait prompt for AI image generation. Prioritise visual specificity. Keep under 200 words.',
  },
}

export default adventureSuggest
