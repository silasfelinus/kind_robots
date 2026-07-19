import { createError } from 'h3'
import {
  ScenarioOutputType,
  type Prisma,
} from '~/prisma/generated/prisma/client'
import prisma from '@/server/utils/prisma'
import { normalizeSlugInput } from '~/utils/slugify'

export const SCENARIO_RELATION_ID_LIMIT = 100
export const SCENARIO_BATCH_LIMIT = 100
export const SCENARIO_JSON_TEXT_LIMIT = 50_000

const scenarioMutationFields = [
  'title',
  'slug',
  'description',
  'intros',
  'outputType',
  'cast',
  'dreamIds',
  'characterIds',
  'facetIds',
  'artImageId',
  'imagePath',
  'locations',
  'artPrompt',
  'genres',
  'inspirations',
  'isMature',
  'isPublic',
  'isActive',
  'difficulty',
  'tier',
  'group',
  'secretNotes',
] as const

export const scenarioCreateFields = new Set<string>(scenarioMutationFields)
export const scenarioPatchFields = new Set<string>(scenarioMutationFields)
export const scenarioBatchPatchFields = new Set<string>([
  ...scenarioMutationFields,
  'id',
])

export type ScenarioMutationInput = Record<string, unknown> & {
  id?: unknown
  title?: unknown
  slug?: unknown
  description?: unknown
  intros?: unknown
  outputType?: unknown
  cast?: unknown
  dreamIds?: unknown
  characterIds?: unknown
  facetIds?: unknown
  artImageId?: unknown
  imagePath?: unknown
  locations?: unknown
  artPrompt?: unknown
  genres?: unknown
  inspirations?: unknown
  isMature?: unknown
  isPublic?: unknown
  isActive?: unknown
  difficulty?: unknown
  tier?: unknown
  group?: unknown
  secretNotes?: unknown
}

type ScenarioBoundaryOptions = {
  allowedFields: ReadonlySet<string>
  context: string
  requireNonEmpty?: boolean
}

const nullableTextFields = [
  'imagePath',
  'locations',
  'artPrompt',
  'genres',
  'inspirations',
  'tier',
  'group',
  'secretNotes',
] as const

const booleanFields = ['isMature', 'isPublic', 'isActive'] as const
const relationFields = ['dreamIds', 'characterIds', 'facetIds'] as const
const outputTypes = Object.values(ScenarioOutputType)

export function assertScenarioMutationInput(
  body: unknown,
  options: ScenarioBoundaryOptions,
): asserts body is ScenarioMutationInput {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw createError({
      statusCode: 400,
      message: `${options.context} must be a JSON object.`,
    })
  }

  const fields = Object.keys(body)

  if (options.requireNonEmpty && fields.length === 0) {
    throw createError({
      statusCode: 400,
      message: 'No data provided for update.',
    })
  }

  const unsupported = fields.filter(
    (field) => !options.allowedFields.has(field),
  )

  if (unsupported.length) {
    throw createError({
      statusCode: 400,
      message: `Unsupported Scenario fields in ${options.context}: ${unsupported.join(', ')}. IDs, timestamps, identity, and system fields are server-owned.`,
    })
  }

  const input = body as ScenarioMutationInput

  if (input.title !== undefined) {
    normalizeScenarioRequiredString(input.title, 'title')
  }

  if (input.slug !== undefined) {
    if (
      input.slug !== null &&
      (typeof input.slug !== 'string' || !input.slug.trim())
    ) {
      throw createError({
        statusCode: 400,
        message: 'The "slug" field must be a non-empty string or null.',
      })
    }
  }

  if (input.description !== undefined) {
    normalizeScenarioString(input.description, 'description')
  }

  if (input.intros !== undefined) normalizeScenarioIntros(input.intros)
  if (input.outputType !== undefined) normalizeScenarioOutputType(input.outputType)
  if (input.cast !== undefined) normalizeScenarioJsonString(input.cast, 'cast')

  for (const field of nullableTextFields) {
    if (input[field] !== undefined) {
      normalizeScenarioNullableString(input[field], field)
    }
  }

  for (const field of booleanFields) {
    if (input[field] !== undefined) {
      normalizeScenarioBoolean(input[field], field)
    }
  }

  if (input.difficulty !== undefined) {
    normalizeScenarioNullableInteger(input.difficulty, 'difficulty')
  }

  if (input.artImageId !== undefined) {
    normalizeScenarioNullableId(input.artImageId, 'artImageId')
  }

  for (const field of relationFields) {
    if (input[field] !== undefined) {
      normalizeScenarioIdArray(input[field], field)
    }
  }
}

export function normalizeScenarioRequiredString(
  value: unknown,
  field: string,
  maxLength = 191,
): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw createError({
      statusCode: 400,
      message: `The "${field}" field is required and must be a non-empty string.`,
    })
  }

  const trimmed = value.trim()

  if (trimmed.length > maxLength) {
    throw createError({
      statusCode: 400,
      message: `The "${field}" field must be ${maxLength} characters or fewer.`,
    })
  }

  return trimmed
}

export function normalizeScenarioString(
  value: unknown,
  field: string,
  fallback?: string,
): string {
  if (value === undefined && fallback !== undefined) return fallback

  if (typeof value !== 'string') {
    throw createError({
      statusCode: 400,
      message: `The "${field}" field must be a string.`,
    })
  }

  return value.trim()
}

export function normalizeScenarioNullableString(
  value: unknown,
  field: string,
): string | null | undefined {
  if (value === undefined) return undefined
  if (value === null) return null

  if (typeof value !== 'string') {
    throw createError({
      statusCode: 400,
      message: `The "${field}" field must be a string or null.`,
    })
  }

  const trimmed = value.trim()
  return trimmed || null
}

export function normalizeScenarioBoolean(
  value: unknown,
  field: string,
): boolean {
  if (typeof value !== 'boolean') {
    throw createError({
      statusCode: 400,
      message: `The "${field}" field must be a boolean.`,
    })
  }

  return value
}

export function normalizeScenarioNullableInteger(
  value: unknown,
  field: string,
): number | null | undefined {
  if (value === undefined) return undefined
  if (value === null || value === '') return null

  const parsed = Number(value)

  if (!Number.isInteger(parsed)) {
    throw createError({
      statusCode: 400,
      message: `The "${field}" field must be an integer or null.`,
    })
  }

  return parsed
}

export function normalizeScenarioNullableId(
  value: unknown,
  field: string,
): number | null | undefined {
  if (value === undefined) return undefined
  if (value === null || value === '') return null

  const parsed = Number(value)

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw createError({
      statusCode: 400,
      message: `The "${field}" field must be a positive integer or null.`,
    })
  }

  return parsed
}

export function normalizeScenarioIdArray(
  value: unknown,
  field: string,
): number[] | undefined {
  if (value === undefined) return undefined

  if (!Array.isArray(value)) {
    throw createError({
      statusCode: 400,
      message: `The "${field}" field must be an array of positive integer IDs.`,
    })
  }

  if (value.length > SCENARIO_RELATION_ID_LIMIT) {
    throw createError({
      statusCode: 400,
      message: `The "${field}" field may contain at most ${SCENARIO_RELATION_ID_LIMIT} entries.`,
    })
  }

  const ids = value.map((entry, index) => {
    const id = Number(entry)

    if (!Number.isInteger(id) || id <= 0) {
      throw createError({
        statusCode: 400,
        message: `The "${field}" field contains an invalid ID at index ${index}.`,
      })
    }

    return id
  })

  return [...new Set(ids)]
}

export function normalizeScenarioOutputType(
  value: unknown,
  fallback?: ScenarioOutputType,
): ScenarioOutputType {
  if (value === undefined && fallback) return fallback

  if (
    typeof value !== 'string' ||
    !outputTypes.includes(value as ScenarioOutputType)
  ) {
    throw createError({
      statusCode: 400,
      message: `The "outputType" field must be one of: ${outputTypes.join(', ')}.`,
    })
  }

  return value as ScenarioOutputType
}

export function normalizeScenarioIntros(value: unknown): string {
  if (value === null || value === undefined || value === '') return '[]'

  let entries: unknown[]

  if (Array.isArray(value)) {
    entries = value
  } else if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) return '[]'

    try {
      const parsed = JSON.parse(trimmed)
      entries = Array.isArray(parsed) ? parsed : [trimmed]
    } catch {
      entries = trimmed.split('\n')
    }
  } else {
    throw createError({
      statusCode: 400,
      message:
        'The "intros" field must be an array, JSON array string, plain string, or null.',
    })
  }

  if (entries.length > SCENARIO_RELATION_ID_LIMIT) {
    throw createError({
      statusCode: 400,
      message: `The "intros" field may contain at most ${SCENARIO_RELATION_ID_LIMIT} entries.`,
    })
  }

  const normalized = entries.map((entry, index) => {
    if (typeof entry !== 'string') {
      throw createError({
        statusCode: 400,
        message: `The "intros" field contains a non-string entry at index ${index}.`,
      })
    }

    return entry.trim()
  }).filter(Boolean)

  const serialized = JSON.stringify(normalized)

  if (serialized.length > SCENARIO_JSON_TEXT_LIMIT) {
    throw createError({
      statusCode: 400,
      message: `The "intros" field must serialize to ${SCENARIO_JSON_TEXT_LIMIT} characters or fewer.`,
    })
  }

  return serialized
}

export function normalizeScenarioJsonString(
  value: unknown,
  field: string,
): string | null | undefined {
  if (value === undefined) return undefined
  if (value === null || value === '') return null

  let serialized: string

  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) return null

    try {
      JSON.parse(trimmed)
      serialized = trimmed
    } catch {
      serialized = JSON.stringify(trimmed)
    }
  } else {
    try {
      serialized = JSON.stringify(value)
    } catch {
      throw createError({
        statusCode: 400,
        message: `The "${field}" field must be JSON-serializable.`,
      })
    }
  }

  if (serialized.length > SCENARIO_JSON_TEXT_LIMIT) {
    throw createError({
      statusCode: 400,
      message: `The "${field}" field must serialize to ${SCENARIO_JSON_TEXT_LIMIT} characters or fewer.`,
    })
  }

  return serialized
}

async function assertIdsExist(options: {
  model: 'artImage' | 'dream' | 'character' | 'facet'
  ids: number[]
  label: string
}): Promise<void> {
  if (!options.ids.length) return

  const records = await (prisma[options.model] as {
    findMany(args: unknown): Promise<Array<{ id: number }>>
  }).findMany({
    where: { id: { in: options.ids } },
    select: { id: true },
  })
  const found = new Set(records.map((record) => record.id))
  const missing = options.ids.filter((id) => !found.has(id))

  if (missing.length) {
    throw createError({
      statusCode: 404,
      message: `${options.label} IDs not found: ${missing.join(', ')}.`,
    })
  }
}

export async function assertScenarioRelationsExist(input: {
  artImageId?: number | null
  dreamIds?: number[]
  characterIds?: number[]
  facetIds?: number[]
}): Promise<void> {
  await Promise.all([
    assertIdsExist({
      model: 'artImage',
      ids: typeof input.artImageId === 'number' ? [input.artImageId] : [],
      label: 'ArtImage',
    }),
    assertIdsExist({
      model: 'dream',
      ids: input.dreamIds ?? [],
      label: 'Dream',
    }),
    assertIdsExist({
      model: 'character',
      ids: input.characterIds ?? [],
      label: 'Character',
    }),
    assertIdsExist({
      model: 'facet',
      ids: input.facetIds ?? [],
      label: 'Facet',
    }),
  ])
}

export async function buildScenarioUpdateInput(
  body: ScenarioMutationInput,
): Promise<Prisma.ScenarioUpdateInput> {
  const data: Prisma.ScenarioUpdateInput = {}

  if ('title' in body) {
    data.title = normalizeScenarioRequiredString(body.title, 'title')
  }
  if ('slug' in body) data.slug = normalizeSlugInput(body.slug)
  if ('description' in body) {
    data.description = normalizeScenarioString(body.description, 'description')
  }
  if ('intros' in body) data.intros = normalizeScenarioIntros(body.intros)
  if ('outputType' in body) {
    data.outputType = normalizeScenarioOutputType(body.outputType)
  }
  if ('cast' in body) data.cast = normalizeScenarioJsonString(body.cast, 'cast')

  for (const field of nullableTextFields) {
    if (field in body) {
      data[field] = normalizeScenarioNullableString(
        body[field],
        field,
      ) as never
    }
  }

  for (const field of booleanFields) {
    if (field in body) {
      data[field] = normalizeScenarioBoolean(body[field], field) as never
    }
  }

  if ('difficulty' in body) {
    data.difficulty = normalizeScenarioNullableInteger(
      body.difficulty,
      'difficulty',
    )
  }

  const artImageId = normalizeScenarioNullableId(body.artImageId, 'artImageId')
  const dreamIds = normalizeScenarioIdArray(body.dreamIds, 'dreamIds')
  const characterIds = normalizeScenarioIdArray(
    body.characterIds,
    'characterIds',
  )
  const facetIds = normalizeScenarioIdArray(body.facetIds, 'facetIds')

  await assertScenarioRelationsExist({
    artImageId,
    dreamIds,
    characterIds,
    facetIds,
  })

  if ('artImageId' in body) {
    data.ArtImage =
      typeof artImageId === 'number'
        ? { connect: { id: artImageId } }
        : { disconnect: true }
  }
  if (dreamIds !== undefined) {
    data.Dreams = { set: dreamIds.map((id) => ({ id })) }
  }
  if (characterIds !== undefined) {
    data.Characters = { set: characterIds.map((id) => ({ id })) }
  }
  if (facetIds !== undefined) {
    data.Facets = { set: facetIds.map((id) => ({ id })) }
  }

  return data
}
