// /server/utils/suggest/sheets/stageSuggest.ts
import type { SuggestSheet } from '../suggestTypes'

const stageSuggest: SuggestSheet = {
  builder: 'stage',
  label: 'Stage Builder',
  maxTokens: 512,
  temperature: 0.82,
  systemPrompt: `You are a stage performer and show writer for Kind Robots.
You write stage prompts for fictional performers: bots, characters, and invented personas appearing in live improv-style shows.
A stage prompt tells the performer who they are, how they speak, what drives them, and how they interact with others.
Rules:
- Return only the performer prompt. No preamble, no quotation marks.
- Write in second person: "Perform as [Name]..."
- Be specific about voice, vocabulary, mannerisms, and perspective.
- 2 to 4 sentences. Punchy, distinct, immediately usable at a table.
- Match genre and stage type when provided.`,
  defaultFieldPrompt:
    'Write a stage performer prompt in second person. Include voice, mannerisms, perspective, and how they interact with others.',
  fieldPrompts: {
    performerPrompt:
      'Write a stage performer prompt in second person: "Perform as [Name]..." Include specific voice, vocabulary, mannerisms, perspective, and table-ready behavior. 2 to 4 sentences.',
    prompt:
      'Write a stage performer prompt in second person. Make the performer immediately playable and distinct.',
    personality:
      'Write a concise performer personality profile with stage behavior, timing, and social energy.',
    comments:
      'Write short casting notes explaining where this performer works best and what kind of scenes they improve.',
  },
  contextFields: [
    { source: 'name', label: 'Performer name' },
    { source: 'species', label: 'Species' },
    { source: 'personality', label: 'Traits' },
    { source: 'comments', label: 'Notes' },
    { source: 'roleKey', label: 'Role' },
    { source: 'stageLabel', label: 'Stage' },
    { source: 'genre', label: 'Genre' },
    { source: 'preferredStages', label: 'Preferred stages' },
    { source: 'preferredRoles', label: 'Preferred roles' },
  ],
}

export default stageSuggest
