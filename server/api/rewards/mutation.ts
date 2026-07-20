// /server/api/rewards/mutation.ts
import { createError } from 'h3'
import { Rarity, RewardType } from '~/prisma/generated/prisma/client'
import prisma from '../../utils/prisma'

export const REWARD_RELATION_ID_LIMIT = 100
export const REWARD_BATCH_LIMIT = 100

// Scalar/alias fields the Reward builders persist. Aliases (label/text/power/type)
// are retained for the current client and normalized in buildCreate/UpdateData.
const persistedMutationFields = [
  'name',
  'label',
  'slug',
  'description',
  'text',
  'flavorText',
  'effect',
  'power',
  'icon',
  'collection',
  'rarity',
  'rewardType',
  'type',
  'artImageId',
  'imagePath',
  'artPrompt',
  'isMature',
  'isPublic',
  'isActive',
] as const

const createRelationFields = ['characterIds', 'dreamIds'] as const
const patchRelationFields = [
  'characterIds',
  'dreamIds',
  'setCharacterIds',
  'setDreamIds',
  'removeCharacterIds',
  'removeDreamIds',
] as const

// A matching userId is validated by the routes (403 on mismatch). It is allowlisted
// on singular routes so it is not rejected as an unknown field; batch stays strict.
const compatibilityFields = ['userId'] as const

export const rewardCreateFields = new Set<string>([
  ...persistedMutationFields,
  ...createRelationFields,
  ...compatibilityFields,
])

export const rewardPatchFields = new Set<string>([
  ...persistedMutationFields,
  ...patchRelationFields,
  ...compatibilityFields,
  'id',
])

export const rewardBatchCreateFields = new Set<string>([
  ...persistedMutationFields,
  ...createRelationFields,
])

export type RewardMutationBody = Record<string, unknown> & {
  id?: number
  userId?: number | null
  rarity?: unknown
  rewardType?: unknown
  type?: unknown
  artImageId?: number | null
  characterIds?: unknown
  dreamIds?: unknown
  setCharacterIds?: unknown
  setDreamIds?: unknown
  removeCharacterIds?: unknown
  removeDreamIds?: unknown
}

type RewardMutationBoundaryOptions = {
  allowedFields: ReadonlySet<string>
  context: string
  routeId?: number
  requireNonEmpty?: boolean
}

const validRarities = new Set<string>(Object.values(Rarity))
const validRewardTypes = new Set<string>(Object.values(RewardType))

const nullableTextFields = [
  'slug',
  'description',
  'text',
  'flavorText',
  'effect',
  'power',
  'icon',
  'collection',
  'imagePath',
  'artPrompt',
] as const

const booleanFields = ['isMature', 'isPublic', 'isActive'] as const

const relationArrayFields = [
  'characterIds',
  'dreamIds',
  'setCharacterIds',
  'setDreamIds',
  'removeCharacterIds',
  'removeDreamIds',
] as const

function positiveInteger(value: unknown, field: string): number {
  const parsed = Number(value)

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw createError({
      statusCode: 400,
      message: `Reward field "${field}" must be a positive integer.`,
    })
  }

  return parsed
}

export function normalizeBoundedRewardNullableId(
  value: unknown,
  field: string,
): number | null | undefined {
  if (value === null) return null
  if (value === undefined || value === '') return undefined
  return positiveInteger(value, field)
}

export function normalizeBoundedRewardIdArray(
  value: unknown,
  field: string,
): number[] | undefined {
  if (value === undefined) return undefined

  if (!Array.isArray(value)) {
    throw createError({
      statusCode: 400,
      message: `Reward field "${field}" must be an array.`,
    })
  }

  if (value.length > REWARD_RELATION_ID_LIMIT) {
    throw createError({
      statusCode: 400,
      message: `Reward field "${field}" may contain at most ${REWARD_RELATION_ID_LIMIT} entries.`,
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
        message: `Reward field "${field}" contains an invalid ID at index ${index}.`,
      })
    }
  })

  return Array.from(new Set(ids))
}

function assertNullableText(body: RewardMutationBody, field: string): void {
  const value = body[field]
  if (value === undefined || value === null) return

  if (typeof value !== 'string') {
    throw createError({
      statusCode: 400,
      message: `Reward field "${field}" must be a string or null.`,
    })
  }
}

function assertEnum(
  body: RewardMutationBody,
  field: 'rarity' | 'rewardType' | 'type',
  valid: ReadonlySet<string>,
  label: string,
): void {
  const value = body[field]
  if (value === undefined) return

  if (typeof value !== 'string' || !valid.has(value.toUpperCase())) {
    throw createError({
      statusCode: 400,
      message: `Reward field "${field}" must be a valid ${label}.`,
    })
  }
}

export function assertRewardMutationInput(
  body: unknown,
  options: RewardMutationBoundaryOptions,
): asserts body is RewardMutationBody {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw createError({
      statusCode: 400,
      message: `${options.context} must be a JSON object.`,
    })
  }

  const input = body as RewardMutationBody
  const fields = Object.keys(input)

  if (options.requireNonEmpty && fields.length === 0) {
    throw createError({
      statusCode: 400,
      message: 'No valid data provided for update.',
    })
  }

  const unsupported = fields.filter(
    (field) => !options.allowedFields.has(field),
  )

  if (unsupported.length) {
    throw createError({
      statusCode: 400,
      message: `Unsupported Reward fields in ${options.context}: ${unsupported.join(', ')}. IDs, timestamps, identity, and system fields are server-owned.`,
    })
  }

  // Ownership (userId) is enforced by the routes (403 on mismatch); it is only
  // allowlisted here. Route identity stays immutable.
  if (Object.prototype.hasOwnProperty.call(input, 'id')) {
    const requestedId = positiveInteger(input.id, 'id')
    if (!options.routeId || requestedId !== options.routeId) {
      throw createError({
        statusCode: 400,
        message: 'Reward ID is immutable and must match the route.',
      })
    }
  }

  if (
    input.name !== undefined &&
    input.name !== null &&
    typeof input.name !== 'string'
  ) {
    throw createError({
      statusCode: 400,
      message: 'Reward field "name" must be a string.',
    })
  }

  if (
    input.label !== undefined &&
    input.label !== null &&
    typeof input.label !== 'string'
  ) {
    throw createError({
      statusCode: 400,
      message: 'Reward field "label" must be a string.',
    })
  }

  for (const field of nullableTextFields) assertNullableText(input, field)

  for (const field of booleanFields) {
    if (input[field] !== undefined && typeof input[field] !== 'boolean') {
      throw createError({
        statusCode: 400,
        message: `Reward field "${field}" must be a boolean.`,
      })
    }
  }

  assertEnum(input, 'rarity', validRarities, 'Rarity')
  assertEnum(input, 'rewardType', validRewardTypes, 'RewardType')
  assertEnum(input, 'type', validRewardTypes, 'RewardType')

  normalizeBoundedRewardNullableId(input.artImageId, 'artImageId')

  for (const field of relationArrayFields) {
    if (input[field] !== undefined) {
      normalizeBoundedRewardIdArray(input[field], field)
    }
  }
}

type RewardRelationExistenceInput = {
  characterIds?: unknown
  dreamIds?: unknown
  setCharacterIds?: unknown
  setDreamIds?: unknown
  artImageId?: unknown
}

type OwnableRow = { id: number; userId: number | null; isPublic: boolean | null }

// Verifies existence (404 for missing) and permission (403 for a private target
// owned by someone else) for every connect/set relation target. A non-admin may
// only attach public or self-owned rows; admins skip the permission check but
// still get the existence check. Disconnect (remove*) targets are not checked
// because disconnecting a missing relation is a no-op.
async function assertRelationAccessible(
  ids: number[],
  find: (idsIn: number[]) => Promise<OwnableRow[]>,
  label: string,
  userId: number,
  isAdmin: boolean,
): Promise<void> {
  if (!ids.length) return

  const rows = await find(ids)
  const foundIds = new Set(rows.map((row) => row.id))
  const missing = ids.filter((id) => !foundIds.has(id))

  if (missing.length) {
    throw createError({
      statusCode: 404,
      message: `${label} not found: ${missing.join(', ')}.`,
    })
  }

  if (isAdmin) return

  const forbidden = rows.filter(
    (row) => row.userId !== userId && row.isPublic !== true,
  )

  if (forbidden.length) {
    throw createError({
      statusCode: 403,
      message: `You do not have permission to attach one or more ${label} records to this Reward.`,
    })
  }
}

export async function assertRewardRelationsAttachable(
  input: RewardRelationExistenceInput,
  userId: number,
  isAdmin: boolean,
): Promise<void> {
  const characterIds = Array.from(
    new Set([
      ...(normalizeBoundedRewardIdArray(input.characterIds, 'characterIds') ??
        []),
      ...(normalizeBoundedRewardIdArray(
        input.setCharacterIds,
        'setCharacterIds',
      ) ?? []),
    ]),
  )

  const dreamIds = Array.from(
    new Set([
      ...(normalizeBoundedRewardIdArray(input.dreamIds, 'dreamIds') ?? []),
      ...(normalizeBoundedRewardIdArray(input.setDreamIds, 'setDreamIds') ?? []),
    ]),
  )

  const artImageId = normalizeBoundedRewardNullableId(
    input.artImageId,
    'artImageId',
  )

  await assertRelationAccessible(
    characterIds,
    (idsIn) =>
      prisma.character.findMany({
        where: { id: { in: idsIn } },
        select: { id: true, userId: true, isPublic: true },
      }),
    'Reward Character relation',
    userId,
    isAdmin,
  )

  await assertRelationAccessible(
    dreamIds,
    (idsIn) =>
      prisma.dream.findMany({
        where: { id: { in: idsIn } },
        select: { id: true, userId: true, isPublic: true },
      }),
    'Reward Dream relation',
    userId,
    isAdmin,
  )

  await assertRelationAccessible(
    typeof artImageId === 'number' ? [artImageId] : [],
    (idsIn) =>
      prisma.artImage.findMany({
        where: { id: { in: idsIn } },
        select: { id: true, userId: true, isPublic: true },
      }),
    'Reward ArtImage relation',
    userId,
    isAdmin,
  )
}
