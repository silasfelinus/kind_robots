// /stores/helpers/dreamHelper.ts
import type {
  CreationSource,
  Dream,
  DreamType,
} from '~/prisma/generated/prisma/client'

export const DREAM_TYPES: DreamType[] = [
  'ART',
  'BRAINSTORM',
  'PROMPTBOT',
  'NARRATOR',
  'CHARACTER',
  'REWARD',
  'SCENARIO',
  'LOCATION',
  'PITCH',
  'WISH',
]

export const CREATABLE_DREAM_TYPES: DreamType[] = [
  'ART',
  'BRAINSTORM',
  'CHARACTER',
  'REWARD',
  'SCENARIO',
  'LOCATION',
  'PITCH',
  'WISH',
]

export type LegacyPitchLike = Partial<Dream> & {
  id?: number
  title?: string | null
  pitch?: string | null
  description?: string | null
  PitchType?: string | null
  dreamType?: DreamType | string | null
  flavorText?: string | null
  artPrompt?: string | null
  imagePath?: string | null
  highlightImage?: string | null
  designer?: string | null
  creationSource?: CreationSource | string | null
}

const LEGACY_DREAM_TYPE_MAP: Record<string, DreamType> = {
  TITLE: 'PITCH',
  RANDOMLIST: 'BRAINSTORM',
  LIST: 'BRAINSTORM',
  BRAINSTORM: 'BRAINSTORM',
  ART: 'ART',
  PROMPTBOT: 'PROMPTBOT',
  NARRATOR: 'NARRATOR',
  CHARACTER: 'CHARACTER',
  REWARD: 'REWARD',
  SCENARIO: 'SCENARIO',
  LOCATION: 'LOCATION',
  PITCH: 'PITCH',
  WISH: 'WISH',
}

function cleanOptionalString(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed || null
}

function fallbackTitle(seed?: string | null): string {
  const normalized = cleanOptionalString(seed)
  if (!normalized) return 'Untitled Dream'
  if (normalized.length <= 72) return normalized
  return `${normalized.slice(0, 69).trim()}...`
}

export function parseDreamType(
  value?: DreamType | string | null,
): DreamType {
  const key = String(value ?? '')
    .trim()
    .toUpperCase()

  return LEGACY_DREAM_TYPE_MAP[key] ?? 'PITCH'
}

export function dreamTypeLabel(value?: DreamType | string | null): string {
  const type = parseDreamType(value)
  return type
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

export function normalizeDream<T extends Partial<Dream>>(dream: T): T {
  return {
    ...dream,
    title: cleanOptionalString(dream.title) ?? fallbackTitle(dream.pitch),
    dreamType: parseDreamType(dream.dreamType as unknown as string),
    pitch: cleanOptionalString(dream.pitch),
    description: cleanOptionalString(dream.description),
    flavorText: cleanOptionalString(dream.flavorText),
    examples: cleanOptionalString(dream.examples),
    artPrompt: cleanOptionalString(dream.artPrompt),
    imagePath: cleanOptionalString(dream.imagePath),
    highlightImage: cleanOptionalString(dream.highlightImage),
    icon: cleanOptionalString(dream.icon) ?? 'kind-icon:dream',
    designer: cleanOptionalString(dream.designer),
    isPublic: dream.isPublic ?? true,
    isMature: dream.isMature ?? false,
    isActive: dream.isActive ?? true,
  } as T
}

export function normalizeDreams<T extends Partial<Dream>>(dreams: T[]): T[] {
  return dreams.map((dream) => normalizeDream(dream))
}

export function extractExamples(examples?: string | null): string[] {
  const source = cleanOptionalString(examples)
  if (!source) return []

  try {
    const parsed = JSON.parse(source)
    if (Array.isArray(parsed)) {
      return parsed
        .map((entry) => cleanOptionalString(entry))
        .filter((entry): entry is string => Boolean(entry))
    }
  } catch {
    // Legacy examples were often newline-, pipe-, or comma-separated text.
  }

  return source
    .split(/\r?\n|\||;/)
    .flatMap((entry) =>
      entry.includes(',') ? entry.split(',').map((part) => part.trim()) : [entry],
    )
    .map((entry) => entry.trim())
    .filter(Boolean)
}

export function joinExamples(examples: string[]): string | null {
  const cleaned = examples
    .map((example) => cleanOptionalString(example))
    .filter((example): example is string => Boolean(example))

  return cleaned.length ? cleaned.join('\n') : null
}

export function groupDreamsByTitle<T extends Partial<Dream>>(
  dreams: T[],
): Record<string, T[]> {
  return dreams.reduce<Record<string, T[]>>((groups, dream) => {
    const title = cleanOptionalString(dream.title) ?? 'Untitled Dream'
    ;(groups[title] ||= []).push(dream)
    return groups
  }, {})
}

export function filterDreamsByType<T extends Partial<Dream>>(
  type: DreamType | string,
  dreams: T[],
): T[] {
  const normalizedType = parseDreamType(type)
  return dreams.filter(
    (dream) => parseDreamType(dream.dreamType as unknown as string) === normalizedType,
  )
}

export function filterPublicDreams<T extends Partial<Dream>>(
  dreams: T[],
  currentUserId?: number | null,
  isAdmin = false,
): T[] {
  return dreams.filter(
    (dream) =>
      dream.isActive !== false &&
      (dream.isPublic === true ||
        isAdmin ||
        (currentUserId != null && dream.userId === currentUserId)),
  )
}

export function filterVisibleDreams<T extends Partial<Dream>>(
  dreams: T[],
  currentUserId?: number | null,
  showMature = false,
  isAdmin = false,
): T[] {
  return filterPublicDreams(dreams, currentUserId, isAdmin).filter(
    (dream) => showMature || isAdmin || dream.isMature !== true,
  )
}

export function sortDreamsByNewest<T extends Partial<Dream>>(a: T, b: T): number {
  const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0
  const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0
  return bTime - aTime
}

/**
 * Deprecated compatibility adapter.
 *
 * RANDOMLIST-era Dreams previously sampled their `examples` field here. Reusable
 * creative randomness is now canonical Facet data, so this method deliberately
 * returns the supplied value unchanged. It remains temporarily callable while
 * old store consumers disappear, but it no longer treats Dreams as random lists.
 */
export function randomEntry(
  dreamName: string,
  _allDreams: Partial<Dream>[] = [],
): string {
  return dreamName
}

export function randomSeedDream(): string {
  const seeds = [
    'A kindness nobody expected changes the rules of the world.',
    'A lost machine remembers a future that never happened.',
    'A tiny creature carries a message meant for the moon.',
    'A city appears for one night and asks visitors to solve its oldest regret.',
    'Two rivals discover their powers only work when they cooperate.',
  ]

  return seeds[Math.floor(Math.random() * seeds.length)] || seeds[0]
}

export function buildBrainstormPrompt(
  title: string,
  description: string,
  count = 10,
  examples = '',
): string {
  const normalizedTitle = cleanOptionalString(title) ?? 'Untitled Dream'
  const normalizedDescription =
    cleanOptionalString(description) ?? 'Create imaginative possibilities.'
  const exampleText = cleanOptionalString(examples)

  return [
    `Generate ${Math.max(1, count)} fresh ideas for a Dream called "${normalizedTitle}".`,
    normalizedDescription,
    exampleText ? `Existing examples to learn from, not repeat:\n${exampleText}` : '',
    'Return concise, distinct entries separated by newlines.',
  ]
    .filter(Boolean)
    .join('\n\n')
}

export function buildTitleStormPrompt(
  title: string,
  description: string,
  count = 10,
  examples = '',
): string {
  const normalizedTitle = cleanOptionalString(title) ?? 'Untitled Dream'
  const normalizedDescription =
    cleanOptionalString(description) ?? 'Create imaginative title variations.'
  const exampleText = cleanOptionalString(examples)

  return [
    `Generate ${Math.max(1, count)} memorable title variations inspired by "${normalizedTitle}".`,
    normalizedDescription,
    exampleText ? `Existing examples to avoid repeating:\n${exampleText}` : '',
    'Return titles only, one per line.',
  ]
    .filter(Boolean)
    .join('\n\n')
}

export function normalizeBrainstormResponse(value: unknown): string {
  if (typeof value === 'string') return value.trim()
  if (Array.isArray(value)) {
    return value
      .map((entry) => cleanOptionalString(entry))
      .filter((entry): entry is string => Boolean(entry))
      .join('\n')
  }

  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>
    for (const key of ['content', 'response', 'text', 'message', 'data']) {
      const candidate = record[key]
      if (typeof candidate === 'string') return candidate.trim()
      if (Array.isArray(candidate)) {
        return candidate
          .map((entry) => cleanOptionalString(entry))
          .filter((entry): entry is string => Boolean(entry))
          .join('\n')
      }
    }
  }

  return String(value)
}

export function buildDreamPayload(dream: Partial<Dream>): Partial<Dream> {
  const pitch =
    cleanOptionalString(dream.pitch) ?? cleanOptionalString(dream.title)
  const title = cleanOptionalString(dream.title) ?? fallbackTitle(pitch)

  return {
    title,
    slug: cleanOptionalString(dream.slug),
    dreamType: parseDreamType(dream.dreamType as unknown as string),
    pitch,
    description: cleanOptionalString(dream.description),
    flavorText: cleanOptionalString(dream.flavorText),
    examples: cleanOptionalString(dream.examples),
    artPrompt: cleanOptionalString(dream.artPrompt),
    imagePath: cleanOptionalString(dream.imagePath),
    highlightImage: cleanOptionalString(dream.highlightImage),
    icon: cleanOptionalString(dream.icon) ?? 'kind-icon:dream',
    designer: cleanOptionalString(dream.designer),
    creationSource: parseCreationSource(
      dream.creationSource as unknown as string,
    ) as CreationSource,
    isPublic: dream.isPublic ?? true,
    isMature: dream.isMature ?? false,
    isActive: dream.isActive ?? true,
    artImageId: dream.artImageId ?? null,
    artCollectionId: dream.artCollectionId ?? null,
  }
}

export function legacyPitchToDreamPayload(
  pitch: LegacyPitchLike,
): Partial<Dream> {
  const dreamType = parseDreamType(pitch.PitchType ?? pitch.dreamType)
  const seed =
    cleanOptionalString(pitch.pitch) ?? cleanOptionalString(pitch.title)

  return buildDreamPayload({
    ...pitch,
    dreamType,
    title: cleanOptionalString(pitch.title) ?? fallbackTitle(seed),
    pitch: seed,
    description: pitch.description ?? seed,
    flavorText: pitch.flavorText ?? null,
    artPrompt: pitch.artPrompt ?? null,
    designer: pitch.designer ?? null,
    creationSource: parseCreationSource(pitch.creationSource),
  })
}

function parseCreationSource(value: unknown): CreationSource {
  const normalized = String(value ?? '')
    .trim()
    .toUpperCase()
  if (
    normalized === 'HUMAN' ||
    normalized === 'AI' ||
    normalized === 'HYBRID' ||
    normalized === 'UPLOAD' ||
    normalized === 'UNKNOWN'
  ) {
    return normalized as CreationSource
  }
  return 'UNKNOWN'
}
