// /server/utils/suggest/sheets/modelBuilderSuggest.ts
import type { SuggestSheet, SuggestBody } from '../suggestTypes'

// Pull a compact digest of the selected SOURCE record's canon so drafts stay
// on-brand instead of generic. The Model Builder store sends the whole record as
// context.source plus a few run-level keys.
function buildSourceContext(context: Record<string, unknown>): string[] {
  const lines: string[] = []

  const push = (label: string, value: unknown): void => {
    if (value == null) return
    const text = Array.isArray(value)
      ? value.filter(Boolean).join(', ')
      : String(value)
    const trimmed = text.trim()
    if (trimmed) lines.push(`${label}: ${trimmed}`)
  }

  push('Source type', context.sourceType)
  push('Source', context.sourceLabel)
  push('Recipe', context.recipe)
  push('Output', context.output)
  push('Item', context.itemLabel)
  push('Action', context.action)
  push('Target model', context.targetModel)
  push('Fields to fill', context.expectedFields)

  const source =
    context.source && typeof context.source === 'object'
      ? (context.source as Record<string, unknown>)
      : null
  if (source) {
    const canonKeys = [
      'name',
      'title',
      'subtitle',
      'tagline',
      'class',
      'species',
      'rewardType',
      'dreamType',
      'kind',
      'personality',
      'quirks',
      'backstory',
      'description',
      'pitch',
      'flavorText',
      'botIntro',
    ]
    for (const key of canonKeys) {
      const value = source[key]
      if (typeof value === 'string' && value.trim()) {
        const clipped = value.length > 240 ? `${value.slice(0, 240)}…` : value
        push(`  ${key}`, clipped)
      }
    }
  }

  // Existing sibling drafts help keep the pitch/fields/prompt consistent.
  push('Existing pitch', context.pitch)
  push('Existing fields', context.fields)

  return lines
}

const modelBuilderSuggest: SuggestSheet = {
  builder: 'model-builder',
  label: 'Model Builder',
  systemPrompt: `You are the Model Builder drafting assistant for Kind Robots.
You help upgrade or create records (Project, Character, Bot, Facet, Dream, Reward,
Scenario) by drafting concise, on-brand, schema-ready text for one build output,
grounded in the selected SOURCE record's canon and the chosen recipe/output.
Rules:
- Return only the requested value. No preamble, no quotation marks, no labels.
- Stay consistent with the source's established identity — never contradict its canon.
- Fit the specific output being built and the source's model type.
- Be tight and concrete.`,
  contextKeys: [
    'sourceType',
    'sourceLabel',
    'recipe',
    'output',
    'itemLabel',
    'action',
  ],
  fieldPrompts: {
    pitch:
      'Write a concise 2–3 sentence pitch for this output — why it exists for the source record and what it should convey. Ground it in the source canon.',
    fields:
      'Fill in the target model as concrete "field: value" lines, one per line, using every field in "Fields to fill" (respect required fields and pick a valid option for choice fields). Invent a specific, characterful record grounded in the source canon — real names and effects, not vague summaries.',
    artPrompt:
      'Write a single vivid image-generation prompt for this output, grounded in the source record\'s look and canon. Comma-separated descriptors, no sentences.',
  },
  buildContext: (context: Record<string, unknown>, _body: SuggestBody) =>
    buildSourceContext(context),
}

export default modelBuilderSuggest
