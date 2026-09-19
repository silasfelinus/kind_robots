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

// Labels whose VALUE is an identifier, not a picture. Dropped outright.
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

/*
 * Labels whose value is narrative or rules prose: what the thing DOES, what it
 * means, how it reads on a card. None of it is a picture, and on a Qwen-lineage
 * text specialist a paragraph of prose in positive conditioning is a paragraph
 * of painted text.
 *
 * This file used to keep every one of these on the reasoning that description,
 * backstory and effect are "visual fields". ArtJob 28759 (2026-09-19, Reward
 * 393) is what that produces. Its first paragraph was already a complete
 * caption -- a gold ring on a leaf, a bird and a beetle leaning in, sound
 * rendered as ripples of light -- and then came:
 *
 *   "... ITEM. COMMON. A modest ring that lets the wearer understand and speak
 *    with animals. Named for its inventor, who spent her life proving the beasts
 *    had plenty to say ... The wearer can converse with any animal. Use it for
 *    unlikely allies, overheard creature-gossip ..."
 *
 * Ninety words of rules text with nothing to draw in them. Krea drew them: the
 * finished image is the ring, correctly, under a block of garbled painted
 * caption reading "ITEM. COMMON. A modest that lets the warrer understand and
 * speak with animals." Stripping the LABEL while keeping the VALUE removed the
 * one clue that the text was metadata and left the text.
 *
 * Kept, because their values genuinely name something visible: species, class,
 * role, presentation, genre, theme, location, and any field that is already art
 * direction. Personality and quirks are kept too -- "patient, curious,
 * observant" is three adjectives an illustrator draws into a face, not a
 * paragraph of rules text. The line is prose volume, not lore: what gets cut
 * here is the sentence-shaped fields, the ones that read as card copy.
 */
const NARRATIVE_LABEL_VALUES = new Set([
  'description',
  'scenario description',
  'pitch',
  'tagline',
  'flavor text',
  'effect',
  'backstory',
  'intro',
  'opening ideas',
  'inspirations',
  'cast',
  'examples',
  'content filters',
  'goal',
  'rarity',
  'type',
  'reward type',
  'dream type',
  'kind',
  'collection',
])

/*
 * ... with one exception, because the opposite failure is real too: a record
 * whose art direction is empty has nothing BUT its prose, and a near-empty
 * prompt is how 154 Facets came back as the same grey bust (2026-09-14). So if
 * dropping the narrative leaves too little to draw, the best single narrative
 * field comes back as the subject -- one of them, in preference order, not the
 * whole card.
 */
const NARRATIVE_FALLBACK_ORDER = [
  'description',
  'scenario description',
  'pitch',
  'backstory',
  'effect',
  'flavor text',
] as const

// Below this, the prompt is a label rather than a picture. Deliberately low:
// the fallback is for a record with no art direction at all, not a second
// chance to append the card text to a prompt that already works.
const MIN_VISUAL_WORDS = 12

const LABEL_PATTERN = new RegExp(
  `\\b(${CONTEXT_LABELS.map((value) => value.replace(/ /g, '\\s+')).join('|')}):\\s*`,
  'gi',
)

const TEXT_NOUN =
  '(?:readable\\s+|visible\\s+|legible\\s+|written\\s+|accidental\\s+)?(?:text|lettering|letters|words|wording|logo|logos|watermark|watermarks|signature|signatures|caption|captions|typography|writing)'

/*
 * The nouns an exclusion tail names. Krea has no channel to receive an
 * exclusion on -- at cfg 1 the ComfyUI negative prompt is inert -- so the only
 * place "no readable text, no logo, no watermark, no collage" can land is
 * positive conditioning, where it is four things to draw. Stripping the clause
 * is the only handling that works; there is nowhere to move it to.
 *
 * PEOPLE_NOUN is the same rule applied to the other family: "No figure." on
 * Reward 393 rendered a crowd of Victorian faces. See
 * server/utils/artPromptContract.ts rule 7.
 */
const PEOPLE_NOUN =
  '(?:full\\s+|clear\\s+|mortal\\s+|literal\\s+|visible\\s+|identifiable\\s+|specific\\s+|real\\s+|fixed\\s+|central\\s+)*' +
  '(?:figures?|persons?|people|humans?|characters?|faces?|crowds?|bystanders?|onlookers?|spectators?|portraits?|silhouettes?|bodies|body|hands?)'

const LAYOUT_NOUN = '(?:collages?|contact\\s+sheets?|grids?|borders?|frames?|panels?|watermarks?)'

const EXCLUDABLE_NOUN = `(?:${TEXT_NOUN}|${PEOPLE_NOUN}|${LAYOUT_NOUN})`

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

// Whitespace-only normalization, byte-for-byte what
// server/utils/artJobProvenance.ts#normalizeArtPrompt applies to the
// top-level promptString. The `_meta.request_prompt` provenance copy must
// use THIS, not normalize(): provenance reconciles the request by exact
// string equality against the workflow's text candidates, so folding curly
// quotes to straight ones there made every request containing ’ “ ” fail
// enqueue with "workflow prompt does not match the top-level promptString"
// (22 Facet titles such as "Pallas’s Cat" and "Can’t resist counting things
// aloud." hit it in the 2026-09-05 repair run; any user-typed smart quote
// hit it through /api/art/enqueue).
function normalizeWhitespace(value: unknown): string {
  return String(value || '')
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
        `\\b(?:no|without|free of|devoid of|avoiding|avoid)\\s+${EXCLUDABLE_NOUN}` +
          `(?:\\s*(?:,|and|or)\\s*(?:no\\s+|without\\s+|free of\\s+)?${EXCLUDABLE_NOUN})*`,
        'gi',
      ),
      ' ',
    )
    .replace(
      new RegExp(
        `\\b(?:do not|don't|never)\\s+(?:render|add|include|show|write|depict)[^.]{0,180}${EXCLUDABLE_NOUN}[^.]*\\.?`,
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

function wordCount(value: string): number {
  const trimmed = value.trim()
  return trimmed ? trimmed.split(/\s+/).length : 0
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
  const narrative = new Map<string, string>()
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
      const value = prompt.slice(start, end)
      if (DROP_LABEL_VALUES.has(label)) continue
      if (NARRATIVE_LABEL_VALUES.has(label)) {
        // Held back, not discarded: it becomes the subject only if nothing
        // else in the prompt is one.
        if (!narrative.has(label)) narrative.set(label, value)
        continue
      }
      pushUnique(output, value)
    }
  }

  const join = (parts: string[]): string =>
    parts
      .map(cleanFragment)
      .filter(Boolean)
      .join('. ')
      .replace(/\.\s*\./g, '.')
      .replace(/\s+/g, ' ')
      .trim()

  let result = join(output)

  if (wordCount(result) < MIN_VISUAL_WORDS) {
    for (const label of NARRATIVE_FALLBACK_ORDER) {
      const value = narrative.get(label)
      if (!value) continue
      pushUnique(output, value)
      result = join(output)
      break
    }
  }

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
  const rawPrompt = normalizeWhitespace(requestPrompt)
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
