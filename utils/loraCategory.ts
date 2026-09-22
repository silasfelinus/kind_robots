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
const CIVITAI_TAG_CATEGORIES: Array<[LoraCategory, string[]]> = [
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
    'ACTION',
    ['poses', 'pose', 'action', 'motion', 'dance', 'dancing', 'gesture'],
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

// Filename/label/description fallbacks, reported as HEURISTIC. Word-boundary
// matched: a substring test makes "portrait" match "trait" and "style" match
// "freestyle", and a miscategorised LoRA is worse than an unclassified one.
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
      'comic',
      'manga',
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
      'suit',
      'jacket',
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
      'forest',
      'dungeon',
      'castle',
      'tavern',
      'skyline',
      'architecture',
    ],
  ],
  [
    'ACTION',
    [
      'pose',
      'poses',
      'posing',
      'running',
      'jumping',
      'dancing',
      'fighting',
      'sitting',
      'flying',
      'motion',
    ],
  ],
  [
    'CREATURE',
    [
      'creature',
      'monster',
      'dragon',
      'beast',
      'animal',
      'wolf',
      'octopus',
      'kaiju',
      'griffin',
    ],
  ],
  [
    'OBJECT',
    [
      'vehicle',
      'mecha',
      'spaceship',
      'weapon',
      'sword',
      'firearm',
      'furniture',
      'jewel\\w*',
      'food',
    ],
  ],
  [
    'DETAIL',
    [
      'detail\\w*',
      'enhancer',
      'sharpen\\w*',
      'skin texture',
      'add[_ -]?detail',
      'upscal\\w*',
      'hand fix',
      'eye fix',
    ],
  ],
  ['CHARACTER', ['character', 'oc\\b', 'persona', 'portrait of']],
  ['CONCEPT', ['concept', 'abstract', 'effect', 'glow', 'lighting']],
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

function matchesWord(haystack: string, pattern: string): boolean {
  return new RegExp(`(^|[^a-z0-9])${pattern}($|[^a-z0-9])`, 'i').test(haystack)
}

/**
 * Best-effort category for a LoRA, or nothing.
 *
 * Civitai tags win over filename heuristics, and the first matching category
 * in each table wins over later ones -- STYLE is checked before CHARACTER in
 * the heuristics because "kim jung gi style" is a style LoRA that also names a
 * person, and reading it the other way around is the mistake that would put an
 * artist in the character pool.
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
    if (hit) return { category, source: 'CIVITAI', signal: hit }
  }

  const haystack = [
    input.customLabel,
    input.name,
    input.triggerWords,
    input.description,
  ]
    .map((value) => String(value ?? '').replace(/[_]+/g, ' '))
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  if (!haystack.trim()) return UNRESOLVED

  for (const [category, patterns] of HEURISTIC_CATEGORIES) {
    const hit = patterns.find((pattern) => matchesWord(haystack, pattern))
    if (hit) {
      return {
        category,
        source: 'HEURISTIC',
        signal: hit.replace(/\\w\*|\\b|\?/g, ''),
      }
    }
  }

  return UNRESOLVED
}

/**
 * Whether a stored classification may be replaced by a fresh inference.
 *
 * A HUMAN decision is permanent: the whole point of the source column is that
 * re-running the classifier over the catalog is a safe, repeatable operation
 * rather than something that silently undoes Silas's corrections.
 */
export function canReclassify(storedSource: unknown): boolean {
  return normalizeLoraCategorySource(storedSource) !== 'HUMAN'
}
