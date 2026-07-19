import { createError } from 'h3'
import type {
  CreationSource,
  DreamType,
  Prisma,
} from '~/prisma/generated/prisma/client'
import { creationSources, dreamTypes } from './index'

export const DREAM_RELATION_ID_LIMIT = 100

const persistedMutationFields = [
  'title',
  'slug',
  'dreamType',
  'creationSource',
  'description',
  'pitch',
  'flavorText',
  'examples',
  'artPrompt',
  'imagePath',
  'cardPath',
  'heroPath',
  'highlightImage',
  'icon',
  'designer',
  'allowReviews',
  'artImageId',
  'artCollectionId',
  'scenarioId',
  'scenarioIds',
  'Scenarios',
  'characterIds',
  'rewardIds',
  'artImageIds',
  'artCollectionIds',
  'isPublic',
  'isMature',
  'isActive',
] as const

// The singular store still sends matching userId plus legacy tag/prompt arrays.
// They are validated and ignored until the client compatibility stage is removed.
const compatibilityFields = ['userId', 'tagIds', 'promptIds'] as const

export const dreamCreateFields = new Set<string>([
  ...persistedMutationFields,
  ...compatibilityFields,
])

export const dreamPatchFields = new Set<string>([
  ...persistedMutationFields,
  ...compatibilityFields,
  'id',
])

export const dreamBatchCreateFields = new Set<string>(persistedMutationFields)

export type DreamMutationBody = Record<string, unknown> & {
  id?: number
  userId?: number
  title?: string
  slug?: string | null
  dreamType?: DreamType
  creationSource?: CreationSource
  description?: string | null
  pitch?: string | null
  flavorText?: string | null
  examples?: string | null
  artPrompt?: string | null
  imagePath?: string | null
  cardPath?: string | null
  heroPath?: string | null
  highlightImage?: string | null
  icon?: string | null
  designer?: string | null
  allowReviews?: boolean
  artImageId?: number | null
  artCollectionId?: number | null
  scenarioId?: number | null
  scenarioIds?: number[]
  Scenarios?: Array<number | { id: number }>
  characterIds?: number[]
  rewardIds?: number[]
  artImageIds?: number[]
  artCollectionIds?: number[]
  tagIds?: number[]
  promptIds?: number[]
  isPublic?: boolean
  isMature?: boolean
  isActive?: boolean
}

type DreamMutationBoundaryOptions = {
  allowedFields: ReadonlySet<string>
  context: string
  authenticatedUserId?: number
  routeId?: number
  requireNonEmpty?: boolean
}

const optionalTextFields = [
  'description',
  'pitch',
  'flavorText',
  'examples',
  'artPrompt',
  'imagePath',
  'cardPath',
  'heroPath',
  'highlightImage',
  'icon',
  'designer',
] as const

const booleanFields = [
  'allowReviews',
  'isPublic',
  'isMature',
  'isActive',
] as const

const relationArrayFields = [
  'scenarioIds',
  'Scenarios',
  'characterIds',
  'rewardIds',
  'artImageIds',
  'artCollectionIds',
  'tagIds',
  'promptIds',
] as const

function positiveInteger(value: unknown, field: string): number {
  const parsed = Number(value)

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw createError({
      statusCode: 400,
      message: `Dream field "${field}" must be a positive integer.`,
    })
  }

  return parsed
}

export function normalizeBoundedDreamNullableId(
  value: unknown,
  field: string,
): number | null | undefined {
  if (value === null) return null
  if (value === undefined || value === '') return undefined
  return positiveInteger(value, field)
}

export function normalizeBoundedDreamIdArray(
  value: unknown,
  field: string,
): number[] | undefined {
  if (value === undefined) return undefined

  if (!Array.isArray(value)) {
    throw createError({
      statusCode: 400,
      message: `Dream field "${field}" must be an array.`,
    })
  }

  if (value.length > DREAM_RELATION_ID_LIMIT) {
    throw createError({
      statusCode: 400,
      message: `Dream field "${field}" may contain at most ${DREAM_RELATION_ID_LIMIT} entries.`,
    })
  }

  const ids = value.map((entry, index) => {
    const candidate =
      entry && typeof entry === 'object' && 'id' in entry
        ? (entry as { id?: unknown }).id
        : entry

    try {
      return positiveInteger(candidate, `${field}[${index}]`)
    } catch {
      throw createError({
        statusCode: 400,
        message: `Dream field "${field}" contains an invalid ID at index ${index}.`,
      })
    }
  })

  return Array.from(new Set(ids))
}

export function normalizeBoundedDreamScenarioIds(
  body: DreamMutationBody,
): number[] | undefined {
  if (body.scenarioIds !== undefined) {
    return normalizeBoundedDreamIdArray(body.scenarioIds, 'scenarioIds')
  }

  if (body.Scenarios !== undefined) {
    return normalizeBoundedDreamIdArray(body.Scenarios, 'Scenarios')
  }

  const scenarioId = normalizeBoundedDreamNullableId(
    body.scenarioId,
    'scenarioId',
  )

  return typeof scenarioId === 'number' ? [scenarioId] : undefined
}

export function boundedScenariosRelationFromPatch(
  body: DreamMutationBody,
): Prisma.ScenarioUpdateManyWithoutDreamsNestedInput | undefined {
  if (body.scenarioIds !== undefined) {
    const ids = normalizeBoundedDreamIdArray(body.scenarioIds, 'scenarioIds') ?? []
    return { set: ids.map((id) => ({ id })) }
  }

  if (body.Scenarios !== undefined) {
    const ids = normalizeBoundedDreamIdArray(body.Scenarios, 'Scenarios') ?? []
    return { set: ids.map((id) => ({ id })) }
  }

  if (body.scenarioId === undefined) return undefined

  const scenarioId = normalizeBoundedDreamNullableId(
    body.scenarioId,
    'scenarioId',
  )

  if (scenarioId === null) return { set: [] }
  if (scenarioId) return { set: [{ id: scenarioId }] }
  return undefined
}

function assertOptionalText(body: DreamMutationBody, field: string): void {
  const value = body[field]
  if (value === undefined || value === null) return

  if (typeof value !== 'string') {
    throw createError({
      statusCode: 400,
      message: `Dream field "${field}" must be a string or null.`,
    })
  }
}

export function assertDreamMutationInput(
  body: unknown,
  options: DreamMutationBoundaryOptions,
): asserts body is DreamMutationBody {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw createError({
      statusCode: 400,
      message: `${options.context} must be a JSON object.`,
    })
  }

  const input = body as DreamMutationBody
  const fields = Object.keys(input)

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
      message: `Unsupported Dream fields in ${options.context}: ${unsupported.join(', ')}. IDs, timestamps, identity, and system fields are server-owned.`,
    })
  }

  if (Object.prototype.hasOwnProperty.call(input, 'userId')) {
    if (!options.authenticatedUserId) {
      throw createError({
        statusCode: 400,
        message: 'Dream ownership is server-owned.',
      })
    }

    const requestedUserId = positiveInteger(input.userId, 'userId')
    if (requestedUserId !== options.authenticatedUserId) {
      throw createError({
        statusCode: 400,
        message: 'Unsupported Dream ownership assignment. Ownership is server-owned.',
      })
    }
  }

  if (Object.prototype.hasOwnProperty.call(input, 'id')) {
    const requestedId = positiveInteger(input.id, 'id')
    if (!options.routeId || requestedId !== options.routeId) {
      throw createError({
        statusCode: 400,
        message: 'Dream ID is immutable and must match the route.',
      })
    }
  }

  if (input.title !== undefined && typeof input.title !== 'string') {
    throw createError({
      statusCode: 400,
      message: 'Dream field "title" must be a string.',
    })
  }

  if (
    input.slug !== undefined &&
    input.slug !== null &&
    typeof input.slug !== 'string'
  ) {
    throw createError({
      statusCode: 400,
      message: 'Dream field "slug" must be a string or null.',
    })
  }

  for (const field of optionalTextFields) assertOptionalText(input, field)

  if (
    input.dreamType !== undefined &&
    !dreamTypes.includes(input.dreamType as DreamType)
  ) {
    throw createError({
      statusCode: 400,
      message: `Dream field "dreamType" must be one of: ${dreamTypes.join(', ')}.`,
    })
  }

  if (
    input.creationSource !== undefined &&
    !creationSources.includes(input.creationSource as CreationSource)
  ) {
    throw createError({
      statusCode: 400,
      message: `Dream field "creationSource" must be one of: ${creationSources.join(', ')}.`,
    })
  }

  for (const field of booleanFields) {
    if (input[field] !== undefined && typeof input[field] !== 'boolean') {
      throw createError({
        statusCode: 400,
        message: `Dream field "${field}" must be a boolean.`,
      })
    }
  }

  normalizeBoundedDreamNullableId(input.artImageId, 'artImageId')
  normalizeBoundedDreamNullableId(input.artCollectionId, 'artCollectionId')
  normalizeBoundedDreamNullableId(input.scenarioId, 'scenarioId')

  for (const field of relationArrayFields) {
    if (input[field] !== undefined) {
      normalizeBoundedDreamIdArray(input[field], field)
    }
  }
}
