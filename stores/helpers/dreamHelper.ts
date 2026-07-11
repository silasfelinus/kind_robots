// /stores/helpers/dreamHelper.ts
import type {
  CreationSource,
  Dream,
  DreamType as PrismaDreamType,
} from '~/prisma/generated/prisma/client'

export const DREAM_TYPES = [
  'ART',
  'BRAINSTORM',
  'PROMPTBOT',
  'NARRATOR',
  'CHARACTER',
  'PROJECT',
  'REWARD',
  'SCENARIO',
  'LOCATION',
  'PITCH',
  'GENRE',
  'WISH',
] as const satisfies readonly PrismaDreamType[]

export type DreamType = (typeof DREAM_TYPES)[number]
export type CreatableDreamType = Exclude<DreamType, 'PROJECT' | 'GENRE'>

export const CREATABLE_DREAM_TYPES = DREAM_TYPES.filter(
  (type): type is CreatableDreamType =>
    type !== 'PROJECT' && type !== 'GENRE',
)

type DreamWithRequiredSlug<T> = T & { slug: string }

export const CREATION_SOURCES = [
  'HUMAN',
  'AI',
  'HYBRID',
  'UPLOAD',
  'UNKNOWN',
] as const satisfies readonly CreationSource[]

export type DreamCreationSource = (typeof CREATION_SOURCES)[number]

type LegacyPitchLike = Omit<
  Partial<Dream>,
  'title' | 'pitch' | 'artPrompt' | 'designer' | 'creationSource'
> & {
  title?: string | null
  PitchType?: string | null
  pitch?: string | null
  artPrompt?: string | null
  designer?: string | null
  creationSource?: string | null
}

const LEGACY_DREAM_TYPE_MAP: Record<string, DreamType> = {
  ARTDREAM: 'ART',
  ARTPITCH: 'ART',
  BOT: 'PROMPTBOT',
  DREAM: 'LOCATION',
  INSPIRATION: 'PITCH',
  RANDOMLIST: 'BRAINSTORM',
  TEXT: 'PITCH',
  TITLE: 'BRAINSTORM',
  VIBE: 'GENRE',
  WEIRDLANDIA: 'LOCATION',
}

const DREAM_TYPE_LABELS: Record<DreamType, string> = {
  ART: 'Art',
  BRAINSTORM: 'Brainstorm',
  PROMPTBOT: 'Prompt Bot',
  NARRATOR: 'Narrator',
  CHARACTER: 'Character',
  PROJECT: 'Project',
  REWARD: 'Reward',
  SCENARIO: 'Scenario',
  LOCATION: 'Location',
  PITCH: 'Pitch',
  GENRE: 'Genre',
  WISH: 'Wish',
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

function cleanString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function cleanOptionalString(value: unknown): string | null {
  const cleaned = cleanString(value)
  return cleaned || null
}

function fallbackTitle(seed?: string | null): string {
  const cleaned = cleanString(seed)
  if (!cleaned) return 'Untitled Dream'
  return cleaned.length > 80 ? `${cleaned.slice(0, 77)}...` : cleaned
}

export function parseDreamType(value?: string | null): DreamType {
  const normalized = cleanString(value).toUpperCase()
  const legacyType = LEGACY_DREAM_TYPE_MAP[normalized]

  if (legacyType) return legacyType

  return DREAM_TYPES.includes(normalized as DreamType)
    ? (normalized as DreamType)
    : 'PITCH'
}

export function parseCreationSource(
  value?: string | null,
): DreamCreationSource {
  const normalized = cleanString(value).toUpperCase()

  return CREATION_SOURCES.includes(normalized as DreamCreationSource)
    ? (normalized as DreamCreationSource)
    : 'UNKNOWN'
}

export function normalizeDreamType<T extends Partial<Dream>>(dream: T): T {
  return {
    ...dream,
    dreamType: parseDreamType(
      dream.dreamType as unknown as string,
    ) as T['dreamType'],
    creationSource: parseCreationSource(
      dream.creationSource as unknown as string,
    ) as T['creationSource'],
  }
}

export function sortDreamsByNewest<T extends { id: number }>(a: T, b: T) {
  return b.id - a.id
}

export function filterDreamsByType<T extends Partial<Dream>>(
  type: 'PROJECT',
  dreams: T[],
): DreamWithRequiredSlug<T>[]
export function filterDreamsByType<T extends Partial<Dream>>(
  type: DreamType,
  dreams: T[],
): T[]
export function filterDreamsByType<T extends Partial<Dream>>(
  type: DreamType,
  dreams: T[],
): T[] | DreamWithRequiredSlug<T>[] {
  const typedDreams = dreams.filter(
    (dream) => parseDreamType(dream.dreamType as string) === type,
  )

  if (type !== 'PROJECT') return typedDreams

  return typedDreams.filter(
    (dream): dream is DreamWithRequiredSlug<T> => Boolean(cleanString(dream.slug)),
  )
}

export function groupDreamsByTitle<T extends Partial<Dream>>(
  dreams: T[],
): Record<string, T[]> {
  return dreams.reduce(
    (acc, dream) => {
      const key = dream.title || dream.pitch || 'Untitled'
      if (!acc[key]) acc[key] = []
      acc[key].push(dream)
      return acc
    },
    {} as Record<string, T[]>,
  )
}

export function filterPublicDreams<T extends Partial<Dream>>(
  dreams: T[],
  userId?: number | null,
  isAdmin = false,
) {
  return dreams.filter((dream) => {
    if (isAdmin) return true
    return dream.isPublic || dream.userId === userId || dream.userId === 0
  })
}

export function filterVisibleDreams<T extends Partial<Dream>>(
  dreams: T[],
  userId?: number | null,
  showMature = false,
  isAdmin = false,
) {
  return dreams.filter((dream) => {
    if (!dream.isActive && !isAdmin) return false
    if (dream.isMature && !showMature && !isAdmin) return false
    return dream.isPublic || dream.userId === userId || isAdmin
  })
}

export function randomEntry(dreamName: string, allDreams: Partial<Dream>[]) {
  const dream = allDreams.find((entry) => {
    return (
      parseDreamType(entry.dreamType as string) === 'BRAINSTORM' &&
      entry.title?.toLowerCase() === dreamName.toLowerCase()
    )
  })

  if (!dream?.examples) return dreamName

  const examples = extractExamples(dream.examples)

  return examples.length
    ? examples[Math.floor(Math.random() * examples.length)] || dreamName
    : dreamName
}

export function extractExamples(exampleString?: string | null): string[] {
  if (!exampleString) return []

  return exampleString
    .replace(/^EXAMPLES:\|\|/, '')
    .replace(/\|\|"?$/, '')
    .split('|')
    .map((example) => example.trim())
    .filter(Boolean)
}

export function joinExamples(examples: string[]): string {
  return examples
    .map((example) => example.trim())
    .filter(Boolean)
    .join('|')
}

export function buildTitleStormPrompt(
  title: string,
  description: string,
  numberOfRequests: number,
  exampleString?: string,
): string {
  const examples = exampleString
    ? ` Existing examples: ||${exampleString}||`
    : ''

  return `Please generate ${numberOfRequests} new and original examples for: ${title}. ${description}.${examples} Separate examples with a | delimiter and bookend the list with two delimiters using this response format: EXAMPLES:||example one|example two||`
}

export function buildBrainstormPrompt(
  title: string,
  description: string,
  numberOfRequests: number,
  exampleString?: string,
): string {
  const examples = exampleString
    ? `\nExisting examples: ||${exampleString}||`
    : ''

  return `Title: ${title}\nDescription: ${description}\nPlease provide ${numberOfRequests} original examples separated by | delimiters.${examples}`
}

export function isValidDream(dream: Partial<Dream>): dream is Dream {
  return Boolean(cleanString(dream.title) || cleanString(dream.pitch))
}

export function hasExamples(dream: Partial<Dream>): boolean {
  return typeof dream.examples === 'string' && dream.examples.includes('|')
}

export function dreamTypeLabel(type?: string | null): string {
  return DREAM_TYPE_LABELS[parseDreamType(type)]
}

export function estimateTokenCount(text: string): number {
  return Math.ceil(text.trim().split(/\s+/).filter(Boolean).length * 1.33)
}

export function normalizeBrainstormResponse(value: unknown): string {
  if (!value) return ''
  if (typeof value === 'string') return value

  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === 'string') return item

        if (isRecord(item)) {
          return [item.title, item.pitch, item.description, item.content]
            .map(cleanString)
            .filter(Boolean)
            .join(': ')
        }

        return String(item)
      })
      .filter(Boolean)
      .join('\n')
  }

  if (isRecord(value)) {
    return normalizeBrainstormResponse(
      value.ideas ?? value.text ?? value.content ?? value.message ?? value.data,
    )
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
    userId: dream.userId ?? 10,
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
