// /stores/helpers/modelBuilderFields.ts
//
// Per-model field knowledge for the Model Builder: what fields each target model
// needs, which are required, sensible defaults, and choice pools. Grounded in the
// Prisma schema + the existing builder card configs (registerBuilderStore /
// *Cards). Used to auto-fill the FIELDS stage and to ground AI drafting so a
// created record comes out complete and specific (a Reward gets a real
// type/rarity/effect) instead of a generic sentence.
import type { SourceTypeKey } from '@/stores/helpers/modelBuilderRecipes'
import { DAISY_CARD_THEMES } from '@/utils/entityTheme'

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

// Facet.kind is a compatibility column. Model Builder accepts the authoritative
// FacetProfile taxonomy and the commit route derives kind internally.
const FACET_TAXONOMIES = [
  'GENRE',
  'ANIMAL',
  'COLOR',
  'THEME',
  'CORE',
  'MOOD',
  'STYLE',
  'SETTING',
  'ART_DIRECTION',
  'SPECIES',
  'OCCUPATION',
  'ARCHETYPE',
  'ROLE',
  'ALIGNMENT',
  'GENDER',
  'BOT_TYPE',
  'DREAM_TYPE',
  'REWARD_TYPE',
  'RARITY',
  'PERSONALITY',
  'BACKSTORY',
  'QUIRK',
  'MATERIAL',
  'PROMPT_ENHANCEMENT',
  'OTHER',
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
    /*
     * Card theme. Silas, 2026-08-10: "we should add theme choice to our model
     * builder options, when the user manually creates new stuffs."
     *
     * No `default`, on purpose: leaving it blank is what tells the commit route
     * to pick one at random, which is the behaviour every other creation path
     * gets. A default here would make one theme the silent house pick.
     */
    { key: 'theme', label: 'Card theme', choices: [...DAISY_CARD_THEMES] },
  ],
  Bot: [
    { key: 'name', label: 'Name', required: true },
    {
      key: 'botType',
      label: 'Bot type',
      default: 'CHATBOT',
      choices: BOT_TYPES,
    },
    { key: 'subtitle', label: 'Subtitle' },
    { key: 'description', label: 'Description', prose: true },
    { key: 'personality', label: 'Personality' },
    { key: 'botIntro', label: 'Bot intro', prose: true },
    { key: 'userIntro', label: 'User intro', prose: true },
    { key: 'prompt', label: 'System prompt', prose: true },
    /*
     * Card theme. Silas, 2026-08-10: "we should add theme choice to our model
     * builder options, when the user manually creates new stuffs."
     *
     * No `default`, on purpose: leaving it blank is what tells the commit route
     * to pick one at random, which is the behaviour every other creation path
     * gets. A default here would make one theme the silent house pick.
     */
    { key: 'theme', label: 'Card theme', choices: [...DAISY_CARD_THEMES] },
  ],
  Reward: [
    { key: 'name', label: 'Name', required: true },
    {
      key: 'rewardType',
      label: 'Type',
      required: true,
      default: 'ITEM',
      choices: REWARD_TYPES,
    },
    { key: 'rarity', label: 'Rarity', default: 'COMMON', choices: RARITY },
    { key: 'effect', label: 'Effect', required: true, prose: true },
    { key: 'description', label: 'Description', prose: true },
    { key: 'flavorText', label: 'Flavor text', prose: true },
    { key: 'collection', label: 'Collection' },
    /*
     * Card theme. Silas, 2026-08-10: "we should add theme choice to our model
     * builder options, when the user manually creates new stuffs."
     *
     * No `default`, on purpose: leaving it blank is what tells the commit route
     * to pick one at random, which is the behaviour every other creation path
     * gets. A default here would make one theme the silent house pick.
     */
    { key: 'theme', label: 'Card theme', choices: [...DAISY_CARD_THEMES] },
  ],
  Dream: [
    { key: 'title', label: 'Title', required: true },
    { key: 'dreamType', label: 'Type', default: 'PITCH', choices: DREAM_TYPES },
    { key: 'pitch', label: 'Pitch', prose: true },
    { key: 'description', label: 'Description', prose: true },
    { key: 'flavorText', label: 'Flavor text', prose: true },
    { key: 'examples', label: 'Examples (pipe-separated)' },
    /*
     * Card theme. Silas, 2026-08-10: "we should add theme choice to our model
     * builder options, when the user manually creates new stuffs."
     *
     * No `default`, on purpose: leaving it blank is what tells the commit route
     * to pick one at random, which is the behaviour every other creation path
     * gets. A default here would make one theme the silent house pick.
     */
    { key: 'theme', label: 'Card theme', choices: [...DAISY_CARD_THEMES] },
  ],
  Scenario: [
    { key: 'title', label: 'Title', required: true },
    { key: 'description', label: 'Description', required: true, prose: true },
    { key: 'intros', label: 'Intros', required: true, prose: true },
    { key: 'difficulty', label: 'Difficulty' },
    { key: 'locations', label: 'Locations' },
    { key: 'inspirations', label: 'Inspirations' },
    /*
     * Card theme. Silas, 2026-08-10: "we should add theme choice to our model
     * builder options, when the user manually creates new stuffs."
     *
     * No `default`, on purpose: leaving it blank is what tells the commit route
     * to pick one at random, which is the behaviour every other creation path
     * gets. A default here would make one theme the silent house pick.
     */
    { key: 'theme', label: 'Card theme', choices: [...DAISY_CARD_THEMES] },
  ],
  Project: [
    { key: 'title', label: 'Title', required: true },
    { key: 'description', label: 'Description', prose: true },
    { key: 'pitch', label: 'Pitch', prose: true },
    { key: 'goal', label: 'Goal', prose: true },
  ],
  Facet: [
    { key: 'title', label: 'Title', required: true },
    {
      key: 'taxonomy',
      label: 'Taxonomy',
      default: 'OTHER',
      choices: FACET_TAXONOMIES,
    },
    { key: 'description', label: 'Description', prose: true },
    { key: 'examples', label: 'Examples' },
    /*
     * Card theme. Silas, 2026-08-10: "we should add theme choice to our model
     * builder options, when the user manually creates new stuffs."
     *
     * No `default`, on purpose: leaving it blank is what tells the commit route
     * to pick one at random, which is the behaviour every other creation path
     * gets. A default here would make one theme the silent house pick.
     */
    { key: 'theme', label: 'Card theme', choices: [...DAISY_CARD_THEMES] },
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

// --- FIELDS blob helpers ----------------------------------------------------

export interface FieldLine {
  key: string
  value: string
}

// Whether `line` opens a new "key: value" field. When `modelType` is given,
// only a key present in that model's own field spec counts as a field start
// -- so a stray colon inside a multi-line prose value (e.g. "Note: it was
// raining." as the second sentence of a backstory) can't be mistaken for a
// new field. When `modelType` is omitted, any non-empty key before the first
// colon counts (the old, fully-generic behavior).
//
// Matched case-insensitively against the spec (model-builder/t-029, cycle
// 18): MODEL_FIELDS' own keys are lowerCamelCase ('name', 'rewardType', ...),
// but nothing about the FIELDS_AND_PROMPTS textarea tells a user typing a
// field by hand to match that exact casing -- every other place the same key
// surfaces (field.label in the batch editor, e.g. "Name", "Class") is
// capitalized, which is exactly what someone free-typing "Name: Aria" would
// reach for. Before this fix, "Name:" failed the case-sensitive knownKeys
// check, so it wasn't a recognized field start -- and since it's typically
// also the FIRST line of the blob, `previous` in parseFieldLines' loop below
// is still unset, so the line (and often every line after it, cascading the
// same miss) was silently dropped rather than merely mis-parsed. A record
// committed from such a blob came out with blank/default fields and no error
// anywhere -- the exact "silent data loss" class this file's continuation
// fix (see parseFieldLines' own doc comment) already exists to prevent, just
// reached through a case mismatch instead of a missing colon. Returning the
// canonical spec-cased key (not the user's raw casing) keeps every
// downstream consumer -- commit.post.ts's own `.toLowerCase()` lookups,
// which already tolerated this, and readFieldLine/setFieldLine's direct
// `line.key === key` comparisons against a caller-supplied canonical key,
// which did not -- working consistently regardless of how the field was
// originally typed.
function isFieldStart(
  line: string,
  knownKeys: Map<string, string> | null,
): { key: string; rest: string } | null {
  const idx = line.indexOf(':')
  if (idx === -1) return null
  const rawKey = line.slice(0, idx).trim()
  if (!rawKey) return null
  if (knownKeys) {
    const canonicalKey = knownKeys.get(rawKey.toLowerCase())
    if (!canonicalKey) return null
    return { key: canonicalKey, rest: line.slice(idx + 1).trim() }
  }
  return { key: rawKey, rest: line.slice(idx + 1).trim() }
}

function knownKeysFor(modelType?: string): Map<string, string> | null {
  if (!modelType) return null
  const spec = fieldSpecFor(modelType)
  return spec.length
    ? new Map(spec.map((field) => [field.key.toLowerCase(), field.key]))
    : null
}

// Splits a FIELDS_AND_PROMPTS blob ("key: value" lines, one per field) into
// structured lines. A line that doesn't open a recognized field is treated
// as a continuation of the previous field's value rather than being dropped.
//
// This matters because several fields are declared `prose: true` (backstory,
// personality, quirks, description, effect, flavorText, botIntro, userIntro,
// prompt, pitch, goal, intros -- see MODEL_FIELDS above) specifically to
// allow long, multi-paragraph text (commit.post.ts's own pickText() allows
// up to 20000 chars for these). A user typing a paragraph break, or an AI
// draft that wraps onto a second line, previously had every line after the
// first silently discarded on the very next parse -- including at COMMIT
// time (server/api/model-builder/items/[id]/commit.post.ts parses this same
// blob into the typed columns it writes), so the committed record ended up
// permanently missing everything past the first line with no error shown.
// The commit preview panel shows the raw, un-parsed blob (correct, full
// text) right up until the moment of commit, which made the truncation
// invisible until after the record already existed.
export function parseFieldLines(blob: string, modelType?: string): FieldLine[] {
  const knownKeys = knownKeysFor(modelType)
  const lines: FieldLine[] = []
  for (const rawLine of blob.split('\n')) {
    const start = isFieldStart(rawLine, knownKeys)
    if (start) {
      lines.push({ key: start.key, value: start.rest })
      continue
    }
    const previous = lines[lines.length - 1]
    if (!previous) continue
    const continuation = rawLine.trim()
    if (!continuation) continue
    previous.value = previous.value
      ? `${previous.value}\n${continuation}`
      : continuation
  }
  return lines
}

export function readFieldLine(
  blob: string,
  key: string,
  modelType?: string,
): string {
  return (
    parseFieldLines(blob, modelType).find((line) => line.key === key)?.value ??
    ''
  )
}

export function setFieldLine(
  blob: string,
  key: string,
  value: string,
  modelType?: string,
): string {
  const knownKeys = knownKeysFor(modelType)
  const rawLines = blob.split('\n')
  const next: string[] = []
  let found = false
  let i = 0
  while (i < rawLines.length) {
    const line = rawLines[i]!
    const start = isFieldStart(line, knownKeys)
    if (start && start.key === key) {
      found = true
      next.push(`${key}: ${value}`)
      i += 1
      // Also consume this field's own existing continuation lines, or the
      // old value's trailing paragraphs would bleed in right after the
      // replacement.
      while (i < rawLines.length && !isFieldStart(rawLines[i]!, knownKeys)) {
        i += 1
      }
      continue
    }
    next.push(line)
    i += 1
  }
  if (!found) {
    const last = next[next.length - 1]
    if (last !== undefined && last.trim() === '') next.pop()
    next.push(`${key}: ${value}`)
  }
  return next.join('\n')
}
