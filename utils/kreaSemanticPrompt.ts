// /utils/kreaSemanticPrompt.ts
//
// Krea 2 is caption-conditioned. It does not have a hidden instruction/context
// channel, so everything placed in positive conditioning is a candidate visual
// concept. Keep application/database labels, prompt-writing instructions, and
// exclusion vocabulary out of that conditioning while preserving the useful
// visual content.

type JsonRecord = Record<string, unknown>

const ENTITY_TYPES =
  '(?:bot|dream|character|scenario|reward|facet|project|achievement)'

const CONTEXT_LABELS = [
  'Name',
  'Title',
  'Subtitle',
  'Label',
  'Description',
  'Pitch',
  'Tagline',
  'Flavor text',
  'Existing art prompt',
  'Art direction',
  'Theme',
  'Goal',
  'Collection',
  'Model type',
  'Dream type',
  'Character class',
  'Class',
  'Species',
  'Role',
  'Presentation',
  'Personality',
  'Quirks',
  'Backstory',
  'Scenario description',
  'Intro',
  'Opening ideas',
  'Location',
  'Locations',
  'Genre',
  'Genres',
  'Inspirations',
  'Cast',
  'Reward type',
  'Type',
  'Rarity',
  'Effect',
  'Message',
  'Hint',
  'Tooltip',
  'Examples',
  'Content filters',
  'Kind',
  'Status',
  'Priority',
  'Facet direction',
] as const

const DROP_LABEL_VALUES = new Set([
  'name',
  'title',
  'subtitle',
  'label',
  'message',
  'hint',
  'tooltip',
  'status',
  'priority',
  'model type',
])

const LABEL_PATTERN = new RegExp(
  `\\b(${CONTEXT_LABELS.map((value) => value.replace(/ /g, '\\s+')).join('|')}):\\s*`,
  'gi',
)

const TEXT_NOUN =
  '(?:readable\\s+|visible\\s+|legible\\s+|written\\s+|accidental\\s+)?(?:text|lettering|letters|words|wording|logo|logos|watermark|watermarks|signature|signatures|caption|captions|typography|writing)'

const KREA_CONTEXT_NOISE_PATTERNS = [
  /\bIllustrate the Facet concept\b/i,
  /\bfor Kind Robots\b/i,
  new RegExp(`\\bCompose this as [^.\\n]{1,240} for the following ${ENTITY_TYPES}\\b`, 'i'),
  new RegExp(`\\bCreate this artwork for the following ${ENTITY_TYPES}\\b`, 'i'),
  /\bTreat the first paragraph as (?:the )?(?:primary )?art direction\b/i,
  /\bUse the (?:entity|dream|facet|character|scenario|reward|bot) context\b/i,
  /\bFacet direction:\s*/i,
  new RegExp(`\\b(?:no|without|free of)\\s+${TEXT_NOUN}\\b`, 'i'),
  new RegExp(`\\b(?:do not|don't|never)\\s+(?:render|add|include|show|write)[^.]{0,120}${TEXT_NOUN}`, 'i'),
]

function asRecord(value: unknown): JsonRecord {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as JsonRecord)
    : {}
}

function normalize(value: unknown): string {
  return String(value || '')
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

function cleanFragment(value: string): string {
  let text = normalize(value)
  if (!text) return ''

  // Text exclusions are instructions, not desired image content. On Krea they
  // become positive text concepts, so remove the whole clause rather than
  // repeating the offending nouns in a negative prompt.
  text = text
    .replace(
      new RegExp(
        `\\b(?:no|without|free of)\\s+${TEXT_NOUN}(?:\\s*(?:,|and)\\s*(?:no\\s+|without\\s+|free of\\s+)?${TEXT_NOUN})*`,
        'gi',
      ),
      ' ',
    )
    .replace(
      new RegExp(
        `\\b(?:do not|don't|never)\\s+(?:render|add|include|show|write)[^.]{0,180}${TEXT_NOUN}[^.]*\\.?`,
        'gi',
      ),
      ' ',
    )
    .replace(/\bEvery surface in frame is blank and unmarked\.?/gi, ' ')
    .replace(/\bKeep text-bearing surfaces blank[^.]*\.?/gi, ' ')
    .replace(/\bclean unmarked surfaces\b/gi, 'clean surfaces')
    .replace(/\bunmarked surfaces\b/gi, 'clean surfaces')
    .replace(/\s+([,.;])/g, '$1')
    .replace(/(?:\s*[,.]){2,}/g, ',')
    .replace(/\s+/g, ' ')
    .replace(/^[,.;\s]+|[,;\s]+$/g, '')
    .trim()

  return text
}

function pushUnique(output: string[], value: string): void {
  const clean = cleanFragment(value)
  if (!clean) return
  const key = clean.toLowerCase()
  if (output.some((entry) => entry.toLowerCase() === key)) return
  output.push(clean)
}

/**
 * True when a stored/request prompt carries application or instruction prose
 * known to be dangerous in Krea positive conditioning.
 */
export function kreaPromptHasContextNoise(value: unknown): boolean {
  const prompt = normalize(value)
  if (!prompt) return false
  if (KREA_CONTEXT_NOISE_PATTERNS.some((pattern) => pattern.test(prompt))) return true

  const labels = [...prompt.matchAll(new RegExp(LABEL_PATTERN.source, 'gi'))]
  return labels.length >= 2
}

/**
 * Convert a contextual prompt into caption-like visual conditioning. This is a
 * deliberately conservative transform: identity labels such as Name/Title are
 * discarded, while visual fields such as description, species, role, mood,
 * backstory, effect, and existing art direction keep their values without the
 * database labels.
 */
export function buildKreaSemanticPrompt(value: unknown): string {
  let prompt = normalize(value)
  if (!prompt) return ''

  const output: string[] = []

  // Preserve the visual concept from the exact old Facet wrapper, but not the
  // words "Facet", "Illustrate", or the app-purpose sentence around it.
  prompt = prompt.replace(
    /\bIllustrate the Facet concept\s+["']([^"']+)["']\.?/gi,
    (_match, concept: string) => {
      pushUnique(output, concept)
      return ' '
    },
  )

  // Geometry is useful conditioning; entity/database purpose is not.
  prompt = prompt.replace(
    new RegExp(
      `\\bCompose this as ([^.]{1,240}?) for the following ${ENTITY_TYPES}\\.?`,
      'gi',
    ),
    (_match, framing: string) => {
      pushUnique(output, framing)
      return ' '
    },
  )

  prompt = prompt
    .replace(
      /\bCreate (?:this as|a|one) [^.]{0,260}\bfor Kind Robots\b[^.]*\.?/gi,
      ' ',
    )
    .replace(
      new RegExp(`\\bCreate this artwork for the following ${ENTITY_TYPES}\\.?`, 'gi'),
      ' ',
    )
    .replace(
      /\bTreat the first paragraph as (?:the )?(?:primary )?art direction\.[^.]*?(?:render|checklist)[^.]*\.?/gi,
      ' ',
    )
    .replace(
      /\bTreat the first paragraph as (?:the )?(?:primary )?art direction\.?/gi,
      ' ',
    )
    .replace(
      /\bUse the (?:entity|dream|facet|character|scenario|reward|bot) context[^.]*\.?/gi,
      ' ',
    )
    .replace(/\bto be used as [^.]*\.?/gi, ' ')

  const matches = [...prompt.matchAll(new RegExp(LABEL_PATTERN.source, 'gi'))]
  if (!matches.length) {
    pushUnique(output, prompt)
  } else {
    const firstIndex = matches[0]?.index ?? 0
    pushUnique(output, prompt.slice(0, firstIndex))

    for (let index = 0; index < matches.length; index += 1) {
      const match = matches[index]!
      const label = normalize(match[1]).toLowerCase()
      const start = (match.index ?? 0) + match[0].length
      const end = matches[index + 1]?.index ?? prompt.length
      if (!DROP_LABEL_VALUES.has(label)) {
        pushUnique(output, prompt.slice(start, end))
      }
    }
  }

  const result = output
    .map(cleanFragment)
    .filter(Boolean)
    .join('. ')
    .replace(/\.\s*\./g, '.')
    .replace(/\s+/g, ' ')
    .trim()

  return result || 'atmospheric illustrative composition'
}

/**
 * Rewrite only the positive text-conditioning nodes in an existing Krea
 * workflow. The raw request is retained in `_meta.request_prompt` for audit
 * provenance; ComfyUI does not condition on `_meta` values.
 */
export function rewriteKreaWorkflowPositivePrompt<T>(
  workflowValue: T,
  requestPrompt: unknown,
): { workflow: T; prompt: string; rewrittenNodes: number } {
  const workflow = structuredClone(workflowValue) as T
  const root = asRecord(workflow)
  const semanticPrompt = buildKreaSemanticPrompt(requestPrompt)
  const rawPrompt = normalize(requestPrompt)
  let rewrittenNodes = 0
  let provenanceAttached = false

  for (const value of Object.values(root)) {
    const node = asRecord(value)
    const inputs = asRecord(node.inputs)
    const meta = asRecord(node._meta)
    const classType = String(node.class_type || '')
    const title = normalize(meta.title).toLowerCase()
    if (title.includes('negative')) continue

    let touched = false
    if (classType === 'CLIPTextEncode' && typeof inputs.text === 'string') {
      inputs.text = semanticPrompt
      touched = true
    } else if (classType === 'ImpactWildcardEncode') {
      if (typeof inputs.wildcard_text === 'string') {
        inputs.wildcard_text = semanticPrompt
        touched = true
      }
      if (typeof inputs.populated_text === 'string') {
        inputs.populated_text = semanticPrompt
        touched = true
      }
    } else if (
      classType === 'PrimitiveStringMultiline' &&
      title.includes('prompt') &&
      typeof inputs.value === 'string'
    ) {
      inputs.value = semanticPrompt
      touched = true
    }

    if (!touched) continue
    node.inputs = inputs
    if (!provenanceAttached && rawPrompt) {
      node._meta = { ...meta, request_prompt: rawPrompt }
      provenanceAttached = true
    }
    rewrittenNodes += 1
  }

  return { workflow, prompt: semanticPrompt, rewrittenNodes }
}
