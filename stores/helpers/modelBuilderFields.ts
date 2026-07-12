// /stores/helpers/modelBuilderFields.ts
//
// Per-model field knowledge for the Model Builder: what fields each target model
// needs, which are required, sensible defaults, and choice pools. Grounded in the
// Prisma schema + the existing builder card configs (registerBuilderStore /
// *Cards). Used to auto-fill the FIELDS stage and to ground AI drafting so a
// created record comes out complete and specific (a Reward gets a real
// type/rarity/effect) instead of a generic sentence.

import type { SourceTypeKey } from '@/stores/helpers/modelBuilderRecipes'

export interface ModelFieldSpec {
  key: string
  label: string
  required?: boolean
  default?: string
  choices?: string[]
  // Longer free-text fields the AI should write prose for.
  prose?: boolean
}

const RARITY = ['COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY', 'MYTHIC']
const REWARD_TYPES = ['ITEM', 'PET', 'SKILL', 'POWER', 'MAGIC', 'FAVOR']
const BOT_TYPES = ['CHATBOT', 'PROMPTBOT', 'ARTBOT']
const DREAM_TYPES = [
  'ART',
  'BRAINSTORM',
  'CHARACTER',
  'REWARD',
  'SCENARIO',
  'LOCATION',
  'PITCH',
  'WISH',
]

// Keyed by the model type (matches SourceTypeKey / the CREATE target types).
export const MODEL_FIELDS: Record<string, ModelFieldSpec[]> = {
  Character: [
    { key: 'name', label: 'Name', required: true },
    { key: 'class', label: 'Class' },
    { key: 'species', label: 'Species' },
    { key: 'honorific', label: 'Honorific', default: 'adventurer' },
    { key: 'personality', label: 'Personality', prose: true },
    { key: 'backstory', label: 'Backstory', prose: true },
    { key: 'quirks', label: 'Quirks', prose: true },
    { key: 'charm', label: 'Charm', default: 'COMMON', choices: RARITY },
    { key: 'empathy', label: 'Empathy', default: 'COMMON', choices: RARITY },
    { key: 'grace', label: 'Grace', default: 'COMMON', choices: RARITY },
    { key: 'luck', label: 'Luck', default: 'COMMON', choices: RARITY },
    { key: 'might', label: 'Might', default: 'COMMON', choices: RARITY },
    { key: 'wits', label: 'Wits', default: 'COMMON', choices: RARITY },
  ],
  Bot: [
    { key: 'name', label: 'Name', required: true },
    { key: 'botType', label: 'Bot type', default: 'CHATBOT', choices: BOT_TYPES },
    { key: 'subtitle', label: 'Subtitle' },
    { key: 'description', label: 'Description', prose: true },
    { key: 'personality', label: 'Personality' },
    { key: 'botIntro', label: 'Bot intro', prose: true },
    { key: 'userIntro', label: 'User intro', prose: true },
    { key: 'prompt', label: 'System prompt', prose: true },
  ],
  Reward: [
    { key: 'name', label: 'Name', required: true },
    { key: 'rewardType', label: 'Type', required: true, default: 'ITEM', choices: REWARD_TYPES },
    { key: 'rarity', label: 'Rarity', default: 'COMMON', choices: RARITY },
    { key: 'effect', label: 'Effect', required: true, prose: true },
    { key: 'description', label: 'Description', prose: true },
    { key: 'flavorText', label: 'Flavor text', prose: true },
    { key: 'collection', label: 'Collection' },
  ],
  Dream: [
    { key: 'title', label: 'Title', required: true },
    { key: 'dreamType', label: 'Type', default: 'PITCH', choices: DREAM_TYPES },
    { key: 'pitch', label: 'Pitch', prose: true },
    { key: 'description', label: 'Description', prose: true },
    { key: 'flavorText', label: 'Flavor text', prose: true },
    { key: 'examples', label: 'Examples (pipe-separated)' },
  ],
  Scenario: [
    { key: 'title', label: 'Title', required: true },
    { key: 'description', label: 'Description', required: true, prose: true },
    { key: 'intros', label: 'Intros', required: true, prose: true },
    { key: 'difficulty', label: 'Difficulty' },
    { key: 'locations', label: 'Locations' },
    { key: 'inspirations', label: 'Inspirations' },
  ],
  Project: [
    { key: 'title', label: 'Title', required: true },
    { key: 'description', label: 'Description', prose: true },
    { key: 'pitch', label: 'Pitch', prose: true },
    { key: 'goal', label: 'Goal', prose: true },
  ],
  Facet: [
    { key: 'title', label: 'Title', required: true },
    { key: 'kind', label: 'Kind', default: 'OTHER' },
    { key: 'description', label: 'Description', prose: true },
    { key: 'examples', label: 'Examples' },
  ],
}

export function fieldSpecFor(modelType: string): ModelFieldSpec[] {
  return MODEL_FIELDS[modelType] ?? []
}

// A pre-filled "key: value" skeleton for the FIELDS stage — required fields and
// any with a default, so the editor starts populated rather than blank. The user
// fills the rest (or AI-drafts them), and can toggle in optional fields.
export function defaultFieldsTemplate(modelType: string): string {
  const spec = fieldSpecFor(modelType)
  if (!spec.length) return ''
  return spec
    .filter((field) => field.required || field.default)
    .map((field) => `${field.key}: ${field.default ?? ''}`)
    .join('\n')
}

// A compact human/LLM-readable description of the target model's fields, fed into
// the draft context so a generated record is complete and uses valid choices.
export function fieldsBrief(modelType: string): string {
  const spec = fieldSpecFor(modelType)
  if (!spec.length) return ''
  return spec
    .map((field) => {
      const parts = [field.key]
      if (field.required) parts.push('(required)')
      if (field.choices) parts.push(`one of: ${field.choices.join('/')}`)
      else if (field.default) parts.push(`default ${field.default}`)
      return parts.join(' ')
    })
    .join('; ')
}

// Which model a build item ultimately writes to. CREATE items target the mapped
// expansion type; UPDATE/ASSET_ONLY items target the run's source model.
export const CREATE_TARGETS: Record<string, SourceTypeKey> = {
  'expand-characters': 'Character',
  'expand-signature-rewards': 'Reward',
  'expand-rewards': 'Reward',
  'expand-scenarios': 'Scenario',
  'expand-manager-bot': 'Bot',
  'expand-narrator-bot': 'Bot',
}
