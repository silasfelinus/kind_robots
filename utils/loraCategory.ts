// /utils/loraCategory.ts
//
// What a LoRA is FOR, and how to guess it from what Civitai already told us.
//
// The catalog has always recorded what a LoRA loads onto and, since t-069,
// where it attaches -- never what it does. That gap is the whole reason
// "{character} running in {style}" had no answer: both placeholders resolved
// to the same undifferentiated pool of ~1,500 rows.
//
// Classification is deliberately conservative. A LoRA left unclassified is
// skipped by the randomizer, which is a visibly empty pool someone can go fix.
// A LoRA guessed wrong is a character rolled into the style slot, which looks
// like the randomizer is broken and is far harder to trace back to its cause.
// So: match a signal, or return nothing. Never infer CHARACTER from a bare
// proper noun -- almost every LoRA is named after something.

export const LORA_CATEGORIES = [
  'CHARACTER',
  'STYLE',
  'SETTING',
  'ACTION',
  'CLOTHING',
  'OBJECT',
  'CREATURE',
  'DETAIL',
  'CONCEPT',
  'OTHER',
] as const

export type LoraCategory = (typeof LORA_CATEGORIES)[number]

export const LORA_CATEGORY_SOURCES = ['CIVITAI', 'HEURISTIC', 'HUMAN'] as const

export type LoraCategorySource = (typeof LORA_CATEGORY_SOURCES)[number]

export type LoraCategoryMeta = {
  category: LoraCategory
  label: string
  /** What a prompt writes to roll this category. First entry is canonical. */
  placeholders: string[]
  hint: string
}

export const LORA_CATEGORY_META: Record<LoraCategory, LoraCategoryMeta> = {
  CHARACTER: {
    category: 'CHARACTER',
    label: 'Character',
    placeholders: ['character', 'char', 'person', 'who'],
    hint: 'A specific person, hero, or named figure.',
  },
  STYLE: {
    category: 'STYLE',
    label: 'Style',
    placeholders: ['style', 'artstyle', 'aesthetic', 'medium'],
    hint: 'How it is drawn — an art style, medium, or artist look.',
  },
  SETTING: {
    category: 'SETTING',
    label: 'Setting',
    placeholders: ['setting', 'location', 'place', 'background', 'scene'],
    hint: 'Where it happens — a place, environment, or backdrop.',
  },
  ACTION: {
    category: 'ACTION',
    label: 'Action',
    placeholders: ['action', 'pose', 'motion', 'doing'],
    hint: 'What the subject is doing — a pose or movement.',
  },
  CLOTHING: {
    category: 'CLOTHING',
    label: 'Clothing',
    placeholders: ['clothing', 'outfit', 'costume', 'wearing'],
    hint: 'What the subject is wearing.',
  },
  OBJECT: {
    category: 'OBJECT',
    label: 'Object',
    placeholders: ['object', 'prop', 'item', 'thing', 'vehicle'],
    hint: 'A prop, vehicle, or thing in the frame.',
  },
  CREATURE: {
    category: 'CREATURE',
    label: 'Creature',
    placeholders: ['creature', 'animal', 'monster', 'beast'],
    hint: 'An animal, monster, or species rather than a named person.',
  },
  DETAIL: {
    category: 'DETAIL',
    label: 'Detail',
    placeholders: ['detail', 'enhancer', 'quality'],
    hint: 'A sharpener or enhancer that changes texture, not subject.',
  },
  CONCEPT: {
    category: 'CONCEPT',
    label: 'Concept',
    placeholders: ['concept', 'idea', 'effect'],
    hint: 'An abstract idea or effect that is not a subject or a style.',
  },
  OTHER: {
    category: 'OTHER',
    label: 'Other',
    placeholders: ['other'],
    hint: 'Looked at, and none of the categories fit.',
  },
}

export function isLoraCategory(value: unknown): value is LoraCategory {
  return LORA_CATEGORIES.includes(String(value).toUpperCase() as LoraCategory)
}

export function normalizeLoraCategory(value: unknown): LoraCategory | null {
  const normalized = String(value ?? '')
    .trim()
    .toUpperCase()
  return isLoraCategory(normalized) ? (normalized as LoraCategory) : null
}

export function normalizeLoraCategorySource(
  value: unknown,
): LoraCategorySource | null {
  const normalized = String(value ?? '')
    .trim()
    .toUpperCase()
  return LORA_CATEGORY_SOURCES.includes(normalized as LoraCategorySource)
    ? (normalized as LoraCategorySource)
    : null
}

function normalizePlaceholder(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
}

const PLACEHOLDER_TO_CATEGORY: Map<string, LoraCategory> = new Map(
  LORA_CATEGORIES.flatMap((category) =>
    LORA_CATEGORY_META[category].placeholders.map(
      (placeholder) =>
        [normalizePlaceholder(placeholder), category] as [string, LoraCategory],
    ),
  ),
)

/** Which category a `{placeholder}` in a prompt rolls from, if any. */
export function loraCategoryForPlaceholder(
  placeholder: string,
): LoraCategory | null {
  return PLACEHOLDER_TO_CATEGORY.get(normalizePlaceholder(placeholder)) ?? null
}

export function loraCategoryPlaceholders(): string[] {
  return [...PLACEHOLDER_TO_CATEGORY.keys()]
}

// Civitai's own tag vocabulary, which is the only classification signal that
// did not come from someone reading a filename. These are checked first and
// reported as CIVITAI, so the editor can show "upstream said so" rather than
// "we guessed".
// PURPOSE TAGS BEFORE CHARACTER. Civitai commonly tags a pose/style LoRA with
// the generic character umbrella as well as the tag that says what it actually
// does. CHARACTER-first made those rows disappear from {action}/{style}.
// HUMAN classifications are separate and are never touched by this table.
const CIVITAI_TAG_CATEGORIES: Array<[LoraCategory, string[]]> = [
  [
    'ACTION',
    ['poses', 'pose', 'action', 'motion', 'dance', 'dancing', 'gesture'],
  ],
  [
    'STYLE',
    [
      'style',
      'styles',
      'art style',
      'artstyle',
      'artist',
      'aesthetic',
      'anime style',
      'painting style',
    ],
  ],
  [
    'CHARACTER',
    [
      'character',
      'characters',
      'celebrity',
      'actor',
      'actress',
      'singer',
      'idol',
      'waifu',
    ],
  ],
  [
    'SETTING',
    [
      'background',
      'backgrounds',
      'landscape',
      'scenery',
      'environment',
      'architecture',
      'buildings',
      'building',
      'interior',
      'city',
      'nature',
    ],
  ],
  [
    'CLOTHING',
    [
      'clothing',
      'clothes',
      'outfit',
      'costume',
      'dress',
      'uniform',
      'armor',
      'lingerie',
      'swimsuit',
      'fashion',
    ],
  ],
  [
    'OBJECT',
    [
      'vehicle',
      'vehicles',
      'car',
      'weapon',
      'weapons',
      'objects',
      'object',
      'tool',
      'tools',
      'furniture',
      'food',
      'props',
      'prop',
    ],
  ],
  [
    'CREATURE',
    [
      'animal',
      'animals',
      'creature',
      'creatures',
      'monster',
      'monsters',
      'dragon',
      'cat',
      'dog',
      'furry',
      'pokemon',
    ],
  ],
  [
    'DETAIL',
    [
      'detail',
      'details',
      'enhancer',
      'quality',
      'sharpness',
      'skin',
      'eyes',
      'hands',
      'texture',
    ],
  ],
  [
    'CONCEPT',
    ['concept', 'concepts', 'abstract', 'effect', 'effects', 'lighting'],
  ],
]

// TITLE-ONLY fallbacks, reported as HEURISTIC.
//
// WHAT WENT WRONG THE FIRST TIME. These patterns were run against the title
// AND the description, and a Resource description is prose -- a Civitai blurb,
// or this repo's own `base: ... | module: ... | detected via ...` string. Prose
// contains category words incidentally, so the first live run (2026-09-22,
// 1,004 rows) produced things like:
//
//   "Elvira - Mistress of the Dark"      -> CLOTHING  (a `dress` in the blurb)
//   "Daphne Blake - Scooby-Doo franchise" -> CLOTHING  (likewise)
//   "POV Blowjob - FLUX"                  -> ACTION    (a `sitting` in the blurb)
//   "Cute Animals"                        -> STYLE     (a `style` in the blurb)
//   "Poison Ivy XL + SD1.5 + F1D"         -> STYLE     (likewise)
//
// Every one of those is a CHARACTER LoRA, and not one of them has a category
// word in its own title. The design was supposed to be conservative and then
// got fed the noisiest field on the row, which turned "say nothing unless
// sure" into "say something about everything".
//
// So: the title only (customLabel, then name). A LoRA's title is chosen to say
// what it is; its description is chosen to sell it.
//
// AND NOTHING GUESSES CHARACTER HERE. A character LoRA is named after the
// character, which is exactly the case no keyword table can see -- "Rogue",
// "Yor Briar", "Tinker bell" carry no signal a regex can reach. Leaving those
// NULL is the correct answer: an unclassified row is visible in the editor's
// Unclassified count and rolls for nothing, while a row confidently filed under
// CLOTHING is invisible and poisons the {clothing} pool. Civitai's own
// `character` tag (--fetch-tags) and the editor are what fill this in.
const HEURISTIC_CATEGORIES: Array<[LoraCategory, string[]]> = [
  [
    'STYLE',
    [
      'style',
      'artstyle',
      'painterly',
      'watercolou?r',
      'oil painting',
      'sketch',
      'lineart',
      'line art',
      'woodcut',
      'ukiyo-?e',
      'impressionis[tm]',
      'art nouveau',
      'bauhaus',
      'cel ?shad\\w*',
      'pixel ?art',
      // Not a bare `comic`: "DC Comics" and "Marvel Comics" are publishers
      // attached to a character's name, not a drawing style.
      'comic (?:book|art|style)',
      'cartoon',
      'render style',
    ],
  ],
  [
    'CLOTHING',
    [
      'outfit',
      'costume',
      'clothing',
      'dress',
      'uniform',
      'armou?r',
      'kimono',
      'hoodie',
      'lingerie',
      'swimsuit',
      'cosplay',
    ],
  ],
  [
    'SETTING',
    [
      'background',
      'landscape',
      'scenery',
      'environment',
      'interior',
      'cityscape',
      'skyline',
      'architecture',
    ],
  ],
  ['ACTION', ['pose', 'poses', 'posing']],
  [
    'CREATURE',
    ['creature', 'monster', 'dragon', 'beast', 'animal', 'animals', 'kaiju'],
  ],
  [
    'OBJECT',
    ['vehicle', 'mecha', 'spaceship', 'weapon', 'firearm', 'furniture'],
  ],
  [
    'DETAIL',
    [
      // Not a bare `detail\\w*`: "detailed erect nipples" is an adjective on a
      // subject, not an enhancer. These are the noun forms an enhancer uses.
      'detail',
      'details',
      'detailer',
      'add[_ -]?detail',
      'skin texture',
      'hand fix',
      'eye fix',
    ],
  ],
  ['CONCEPT', ['concept']],
]

export type LoraCategoryInference = {
  category: LoraCategory | null
  source: LoraCategorySource | null
  /** The exact tag or word that decided it, for the editor to show. */
  signal: string | null
}

const UNRESOLVED: LoraCategoryInference = {
  category: null,
  source: null,
  signal: null,
}

export type LoraCategoryInferenceInput = {
  name?: string | null
  customLabel?: string | null
  description?: string | null
  triggerWords?: string | null
  /** Civitai model tags, when the hash lookup resolved one. */
  civitaiTags?: string[] | null
}

/** The text the pattern actually matched in `haystack`, or null. */
function matchedWord(haystack: string, pattern: string): string | null {
  const match = new RegExp(
    `(?:^|[^a-z0-9])(${pattern})(?:$|[^a-z0-9])`,
    'i',
  ).exec(haystack)
  return match ? match[1]! : null
}

/**
 * The text a heuristic may read: the LoRA's own title, and nothing else.
 *
 * Deliberately excludes `description` (prose, see the table above) and
 * `triggerWords` (often a bare invocation token, sometimes a whole sentence
 * lifted from the model page -- same noise problem, smaller sample).
 */
function heuristicTitle(input: LoraCategoryInferenceInput): string {
  return [input.customLabel, input.name]
    .map((value) => String(value ?? '').replace(/[_]+/g, ' '))
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
}

/**
 * Best-effort category for a LoRA, or nothing.
 *
 * Civitai tags are read first and reported as CIVITAI: they are the only
 * signal here that came from someone describing the model rather than from a
 * regex reading its filename, and they are the only way a character LoRA gets
 * classified without a human. `--fetch-tags` on the backfill exists for this
 * reason and is worth its runtime.
 *
 * The heuristics below are a weak fallback over the TITLE only, and are
 * expected to return null often. That is the intended outcome, not a gap to
 * close by loosening them -- see the table's note.
 */
export function inferLoraCategory(
  input: LoraCategoryInferenceInput,
): LoraCategoryInference {
  const tags = (input.civitaiTags ?? [])
    .map((tag) =>
      String(tag ?? '')
        .trim()
        .toLowerCase(),
    )
    .filter(Boolean)

  for (const [category, tagValues] of CIVITAI_TAG_CATEGORIES) {
    const hit = tagValues.find((tag) => tags.includes(tag))
    if (hit) return { category, source: 'CIVITAI', signal: `tag: ${hit}` }
  }

  const title = heuristicTitle(input)
  if (!title.trim()) return UNRESOLVED

  for (const [category, patterns] of HEURISTIC_CATEGORIES) {
    for (const pattern of patterns) {
      // The matched TEXT, not the pattern. A reviewer scanning a dry run needs
      // to see the word that decided it -- `comic book` -- not the regex that
      // found it, `comic (?:book|art|style)`.
      const hit = matchedWord(title, pattern)
      if (hit) return { category, source: 'HEURISTIC', signal: `title: ${hit}` }
    }
  }

  return UNRESOLVED
}

/**
 * Category the RANDOMIZER may use without mutating the Resource row.
 *
 * Existing imports predate the corrected Civitai priority above, so some
 * clearly named pose LoRAs can still be persisted as CHARACTER (or left NULL)
 * until the next catalog refresh. For ACTION only, let the same conservative
 * title heuristic repair that read at request time. A HUMAN decision is the
 * hard stop: never reinterpret one, and never write this fallback back to DB.
 *
 * We intentionally do not generalize this to every category. The symptom being
 * repaired is a one-item {action} pool, and broad silent reclassification would
 * turn a targeted compatibility fix into a second taxonomy system.
 */
export function randomizerLoraCategory(input: {
  name?: string | null
  customLabel?: string | null
  loraCategory?: unknown
  loraCategorySource?: unknown
}): LoraCategory | null {
  const stored = normalizeLoraCategory(input.loraCategory)
  const source = normalizeLoraCategorySource(input.loraCategorySource)
  if (source === 'HUMAN') return stored

  const inferred = inferLoraCategory({
    name: input.name,
    customLabel: input.customLabel,
  })

  if (inferred.category === 'ACTION') return 'ACTION'
  return stored
}

export function canReclassify(storedSource: unknown): boolean {
  return normalizeLoraCategorySource(storedSource) !== 'HUMAN'
}
