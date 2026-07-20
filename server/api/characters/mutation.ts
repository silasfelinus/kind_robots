import { createError } from 'h3'
import {
  Rarity,
  type Prisma,
} from '~/prisma/generated/prisma/client'
import prisma from '@/server/utils/prisma'

export const CHARACTER_RELATION_ID_LIMIT = 100
export const CHARACTER_BATCH_LIMIT = 100
export const CHARACTER_LONG_TEXT_LIMIT = 50_000
export const CHARACTER_SHORT_TEXT_LIMIT = 764

const characterScalarFields = [
  'name',
  'slug',
  'honorific',
  'title',
  'role',
  'class',
  'species',
  'gender',
  'presentation',
  'genre',
  'alignment',
  'personality',
  'sampleResponse',
  'voice',
  'drive',
  'backstory',
  'achievements',
  'quirks',
  'luck',
  'might',
  'wits',
  'grace',
  'charm',
  'empathy',
  'artPrompt',
  'imagePath',
  'experience',
  'level',
  'designer',
  'isPublic',
  'isMature',
  'isActive',
  'artImageId',
  'rewardIds',
  'scenarioIds',
  'dreamIds',
] as const

const characterBatchRelationFields = ['Rewards', 'Scenarios', 'Dreams'] as const

export const characterCreateFields = new Set<string>(characterScalarFields)
export const characterPatchFields = new Set<string>(characterScalarFields)
export const characterBatchCreateFields = new Set<string>([
  ...characterScalarFields,
  ...characterBatchRelationFields,
])

export type CharacterMutationInput = Record<string, unknown> & {
  name?: unknown
  slug?: unknown
  honorific?: unknown
  title?: unknown
  role?: unknown
  class?: unknown
  species?: unknown
  gender?: unknown
  presentation?: unknown
  genre?: unknown
  alignment?: unknown
  personality?: unknown
  sampleResponse?: unknown
  voice?: unknown
  drive?: unknown
  backstory?: unknown
  achievements?: unknown
  quirks?: unknown
  luck?: unknown
  might?: unknown
  wits?: unknown
  grace?: unknown
  charm?: unknown
  empathy?: unknown
  artPrompt?: unknown
  imagePath?: unknown
  experience?: unknown
  level?: unknown
  designer?: unknown
  isPublic?: unknown
  isMature?: unknown
  isActive?: unknown
  artImageId?: unknown
  rewardIds?: unknown
  scenarioIds?: unknown
  dreamIds?: unknown
  Rewards?: unknown
  Scenarios?: unknown
  Dreams?: unknown
}

type CharacterBoundaryOptions = {
  allowedFields: ReadonlySet<string>
  context: string
  requireNonEmpty?: boolean
}

const shortTextFields = [
  'honorific',
  'title',
  'role',
  'class',
  'species',
  'gender',
  'presentation',
  'genre',
  'alignment',
  'drive',
  'achievements',
  'imagePath',
  'designer',
] as const

const longTextFields = [
  'personality',
  'sampleResponse',
  'voice',
  'backstory',
  'quirks',
  'artPrompt',
] as const

const rarityFields = ['luck', 'might', 'wits', 'grace', 'charm', 'empathy'] as const
const booleanFields = ['isPublic', 'isMature', 'isActive'] as const
const rarityValues = Object.values(Rarity)
const rarityByNumber: Record<number, Rarity> = {
  1: Rarity.COMMON,
  2: Rarity.UNCOMMON,
  3: Rarity.RARE,
  4: Rarity.EPIC,
  5: Rarity.LEGENDARY,
  6: Rarity.MYTHIC,
}

export function assertCharacterMutationInput(
  body: unknown,
  options: CharacterBoundaryOptions,
): asserts body is CharacterMutationInput {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw createError({
      statusCode: 400,
      message: `${options.context} must be a JSON object.`,
    })
  }

  const fields = Object.keys(body)

  if (options.requireNonEmpty && fields.length === 0) {
    throw createError({ statusCode: 400, message: 'No data provided for update.' })
  }

  const unsupported = fields.filter((field) => !options.allowedFields.has(field))

  if (unsupported.length) {
    throw createError({
      statusCode: 400,
      message: `Unsupported Character fields in ${options.context}: ${unsupported.join(', ')}. IDs, timestamps, identity, and system fields are server-owned.`,
    })
  }

  const input = body as CharacterMutationInput

  if (input.name !== undefined) normalizeCharacterName(input.name)

  if (
    input.slug !== undefined &&
    input.slug !== null &&
    typeof input.slug !== 'string'
  ) {
    throw createError({
      statusCode: 400,
      message: 'The "slug" field must be a string or null.',
    })
  }

  for (const field of shortTextFields) {
    if (input[field] !== undefined) {
      normalizeCharacterNullableText(
        input[field],
        field,
        CHARACTER_SHORT_TEXT_LIMIT,
      )
    }
  }

  for (const field of longTextFields) {
    if (input[field] !== undefined) {
      normalizeCharacterNullableText(
        input[field],
        field,
        CHARACTER_LONG_TEXT_LIMIT,
      )
    }
  }

  for (const field of rarityFields) {
    if (input[field] !== undefined) {
      normalizeCharacterRarity(input[field], field)
    }
  }

  for (const field of booleanFields) {
    if (input[field] !== undefined) {
      normalizeCharacterBoolean(input[field], field)
    }
  }

  if (input.experience !== undefined) {
    normalizeCharacterInteger(input.experience, 'experience', 0)
  }
  if (input.level !== undefined) {
    normalizeCharacterInteger(input.level, 'level', 1)
  }
  if (input.artImageId !== undefined) {
    normalizeCharacterNullableId(input.artImageId, 'artImageId')
  }

  for (const field of ['rewardIds', 'scenarioIds', 'dreamIds'] as const) {
    if (input[field] !== undefined) {
      normalizeCharacterIdArray(input[field], field)
    }
  }

  for (const field of characterBatchRelationFields) {
    if (input[field] !== undefined) {
      normalizeCharacterConnectIds(input[field], field)
    }
  }
}

export function normalizeCharacterName(value: unknown): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw createError({
      statusCode: 400,
      message: 'The "name" field is required and must be a non-empty string.',
    })
  }

  const name = value.trim()

  if (name.length > CHARACTER_SHORT_TEXT_LIMIT) {
    throw createError({
      statusCode: 400,
      message: `The "name" field must be ${CHARACTER_SHORT_TEXT_LIMIT} characters or fewer.`,
    })
  }

  return name
}

export function normalizeCharacterNullableText(
  value: unknown,
  field: string,
  maxLength: number,
): string | null | undefined {
  if (value === undefined) return undefined
  if (value === null) return null

  if (typeof value !== 'string') {
    throw createError({
      statusCode: 400,
      message: `The "${field}" field must be a string or null.`,
    })
  }

  const text = value.trim()

  if (text.length > maxLength) {
    throw createError({
      statusCode: 400,
      message: `The "${field}" field must be ${maxLength} characters or fewer.`,
    })
  }

  return text || null
}

export function normalizeCharacterRarity(
  value: unknown,
  field: string,
  fallback?: Rarity,
): Rarity {
  if (value === undefined || value === null || value === '') {
    if (fallback) return fallback
    throw createError({
      statusCode: 400,
      message: `The "${field}" field must be a valid rarity.`,
    })
  }

  if (typeof value === 'number' && rarityByNumber[value]) {
    return rarityByNumber[value]
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toUpperCase() as Rarity
    if (rarityValues.includes(normalized)) return normalized
  }

  throw createError({
    statusCode: 400,
    message: `The "${field}" field must be one of: ${rarityValues.join(', ')}, or a legacy number from 1 through 6.`,
  })
}

export function normalizeCharacterBoolean(value: unknown, field: string): boolean {
  if (typeof value !== 'boolean') {
    throw createError({
      statusCode: 400,
      message: `The "${field}" field must be a boolean.`,
    })
  }

  return value
}

export function normalizeCharacterInteger(
  value: unknown,
  field: string,
  minimum: number,
): number {
  const parsed = Number(value)

  if (!Number.isInteger(parsed) || parsed < minimum) {
    throw createError({
      statusCode: 400,
      message: `The "${field}" field must be an integer greater than or equal to ${minimum}.`,
    })
  }

  return parsed
}

export function normalizeCharacterNullableId(
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

export function normalizeCharacterIdArray(
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

  if (value.length > CHARACTER_RELATION_ID_LIMIT) {
    throw createError({
      statusCode: 400,
      message: `The "${field}" field may contain at most ${CHARACTER_RELATION_ID_LIMIT} entries.`,
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

export function normalizeCharacterConnectIds(
  value: unknown,
  field: string,
): number[] {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw createError({
      statusCode: 400,
      message: `The "${field}" field must use { connect: [{ id }] }.`,
    })
  }

  const connect = (value as { connect?: unknown }).connect
  if (connect === undefined || connect === null) return []
  const entries = Array.isArray(connect) ? connect : [connect]

  return normalizeCharacterIdArray(
    entries.map((entry) =>
      entry && typeof entry === 'object' && !Array.isArray(entry)
        ? (entry as { id?: unknown }).id
        : undefined,
    ),
    `${field}.connect`,
  ) ?? []
}

export function normalizeCharacterRelationIds(
  directValue: unknown,
  connectValue: unknown,
  directField: string,
  connectField: string,
): number[] {
  const direct = normalizeCharacterIdArray(directValue, directField) ?? []
  const connected =
    connectValue === undefined
      ? []
      : normalizeCharacterConnectIds(connectValue, connectField)
  const ids = [...new Set([...direct, ...connected])]

  if (ids.length > CHARACTER_RELATION_ID_LIMIT) {
    throw createError({
      statusCode: 400,
      message: `Combined ${directField}/${connectField} relations may contain at most ${CHARACTER_RELATION_ID_LIMIT} IDs.`,
    })
  }

  return ids
}

function assertFound(
  requestedIds: number[],
  records: Array<{ id: number }>,
  label: string,
): void {
  const found = new Set(records.map((record) => record.id))
  const missing = requestedIds.filter((id) => !found.has(id))

  if (missing.length) {
    throw createError({
      statusCode: 404,
      message: `${label} IDs not found: ${missing.join(', ')}.`,
    })
  }
}

export async function assertCharacterRelationsExist(input: {
  artImageId?: number | null
  rewardIds?: number[]
  scenarioIds?: number[]
  dreamIds?: number[]
}): Promise<void> {
  const artImageIds = typeof input.artImageId === 'number' ? [input.artImageId] : []
  const rewardIds = input.rewardIds ?? []
  const scenarioIds = input.scenarioIds ?? []
  const dreamIds = input.dreamIds ?? []

  const [artImages, rewards, scenarios, dreams] = await Promise.all([
    artImageIds.length
      ? prisma.artImage.findMany({
          where: { id: { in: artImageIds } },
          select: { id: true },
        })
      : [],
    rewardIds.length
      ? prisma.reward.findMany({
          where: { id: { in: rewardIds } },
          select: { id: true },
        })
      : [],
    scenarioIds.length
      ? prisma.scenario.findMany({
          where: { id: { in: scenarioIds } },
          select: { id: true },
        })
      : [],
    dreamIds.length
      ? prisma.dream.findMany({
          where: { id: { in: dreamIds } },
          select: { id: true },
        })
      : [],
  ])

  assertFound(artImageIds, artImages, 'ArtImage')
  assertFound(rewardIds, rewards, 'Reward')
  assertFound(scenarioIds, scenarios, 'Scenario')
  assertFound(dreamIds, dreams, 'Dream')
}

// Permission gate for relation connects: a non-admin may only attach public or
// self-owned ArtImage/Reward/Scenario/Dream targets. Composes with the existence
// check (which runs inside the builders) — it counts only rows that exist AND are
// private AND owned by someone else, so a missing ID still yields the 404 existence
// error rather than a masked 403. Admins bypass. Handles both the direct id-array
// and batch connect-object relation forms.
export async function assertCharacterRelationsAttachable(
  body: {
    artImageId?: unknown
    rewardIds?: unknown
    Rewards?: unknown
    scenarioIds?: unknown
    Scenarios?: unknown
    dreamIds?: unknown
    Dreams?: unknown
  },
  userId: number,
  isAdmin: boolean,
): Promise<void> {
  if (isAdmin) return

  const artImageId = normalizeCharacterNullableId(body.artImageId, 'artImageId')
  const artImageIds = typeof artImageId === 'number' ? [artImageId] : []
  const rewardIds = normalizeCharacterRelationIds(
    body.rewardIds,
    body.Rewards,
    'rewardIds',
    'Rewards',
  )
  const scenarioIds = normalizeCharacterRelationIds(
    body.scenarioIds,
    body.Scenarios,
    'scenarioIds',
    'Scenarios',
  )
  const dreamIds = normalizeCharacterRelationIds(
    body.dreamIds,
    body.Dreams,
    'dreamIds',
    'Dreams',
  )

  const notAttachable = { NOT: { OR: [{ userId }, { isPublic: true }] } }

  const [artForbidden, rewardForbidden, scenarioForbidden, dreamForbidden] =
    await Promise.all([
      artImageIds.length
        ? prisma.artImage.count({
            where: { id: { in: artImageIds }, ...notAttachable },
          })
        : 0,
      rewardIds.length
        ? prisma.reward.count({
            where: { id: { in: rewardIds }, ...notAttachable },
          })
        : 0,
      scenarioIds.length
        ? prisma.scenario.count({
            where: { id: { in: scenarioIds }, ...notAttachable },
          })
        : 0,
      dreamIds.length
        ? prisma.dream.count({
            where: { id: { in: dreamIds }, ...notAttachable },
          })
        : 0,
    ])

  const forbiddenLabel =
    artForbidden > 0
      ? 'ArtImage'
      : rewardForbidden > 0
        ? 'Reward'
        : scenarioForbidden > 0
          ? 'Scenario'
          : dreamForbidden > 0
            ? 'Dream'
            : null

  if (forbiddenLabel) {
    throw createError({
      statusCode: 403,
      message: `You do not have permission to attach one or more ${forbiddenLabel} records to this Character.`,
    })
  }
}

export async function buildCharacterCreateInput(options: {
  rawInput: unknown
  userId: number
  slug: string | null
  batch?: boolean
}): Promise<Prisma.CharacterCreateInput> {
  assertCharacterMutationInput(options.rawInput, {
    allowedFields: options.batch
      ? characterBatchCreateFields
      : characterCreateFields,
    context: options.batch
      ? 'Character batch create item'
      : 'Character create payload',
  })

  const body = options.rawInput
  const rewardIds = options.batch
    ? normalizeCharacterRelationIds(
        body.rewardIds,
        body.Rewards,
        'rewardIds',
        'Rewards',
      )
    : normalizeCharacterIdArray(body.rewardIds, 'rewardIds') ?? []
  const scenarioIds = options.batch
    ? normalizeCharacterRelationIds(
        body.scenarioIds,
        body.Scenarios,
        'scenarioIds',
        'Scenarios',
      )
    : normalizeCharacterIdArray(body.scenarioIds, 'scenarioIds') ?? []
  const dreamIds = options.batch
    ? normalizeCharacterRelationIds(
        body.dreamIds,
        body.Dreams,
        'dreamIds',
        'Dreams',
      )
    : normalizeCharacterIdArray(body.dreamIds, 'dreamIds') ?? []
  const artImageId = normalizeCharacterNullableId(body.artImageId, 'artImageId')

  await assertCharacterRelationsExist({
    artImageId,
    rewardIds,
    scenarioIds,
    dreamIds,
  })

  return {
    User: { connect: { id: options.userId } },
    name: normalizeCharacterName(body.name),
    slug: options.slug,
    honorific:
      normalizeCharacterNullableText(
        body.honorific,
        'honorific',
        CHARACTER_SHORT_TEXT_LIMIT,
      ) ?? 'adventurer',
    title: normalizeCharacterNullableText(
      body.title,
      'title',
      CHARACTER_SHORT_TEXT_LIMIT,
    ),
    role: normalizeCharacterNullableText(
      body.role,
      'role',
      CHARACTER_SHORT_TEXT_LIMIT,
    ),
    class: normalizeCharacterNullableText(
      body.class,
      'class',
      CHARACTER_SHORT_TEXT_LIMIT,
    ),
    species: normalizeCharacterNullableText(
      body.species,
      'species',
      CHARACTER_SHORT_TEXT_LIMIT,
    ),
    gender: normalizeCharacterNullableText(
      body.gender,
      'gender',
      CHARACTER_SHORT_TEXT_LIMIT,
    ),
    presentation: normalizeCharacterNullableText(
      body.presentation,
      'presentation',
      CHARACTER_SHORT_TEXT_LIMIT,
    ),
    genre: normalizeCharacterNullableText(
      body.genre,
      'genre',
      CHARACTER_SHORT_TEXT_LIMIT,
    ),
    alignment: normalizeCharacterNullableText(
      body.alignment,
      'alignment',
      CHARACTER_SHORT_TEXT_LIMIT,
    ),
    personality: normalizeCharacterNullableText(
      body.personality,
      'personality',
      CHARACTER_LONG_TEXT_LIMIT,
    ),
    sampleResponse: normalizeCharacterNullableText(
      body.sampleResponse,
      'sampleResponse',
      CHARACTER_LONG_TEXT_LIMIT,
    ),
    voice: normalizeCharacterNullableText(
      body.voice,
      'voice',
      CHARACTER_LONG_TEXT_LIMIT,
    ),
    drive: normalizeCharacterNullableText(
      body.drive,
      'drive',
      CHARACTER_SHORT_TEXT_LIMIT,
    ),
    backstory: normalizeCharacterNullableText(
      body.backstory,
      'backstory',
      CHARACTER_LONG_TEXT_LIMIT,
    ),
    achievements: normalizeCharacterNullableText(
      body.achievements,
      'achievements',
      CHARACTER_SHORT_TEXT_LIMIT,
    ),
    quirks: normalizeCharacterNullableText(
      body.quirks,
      'quirks',
      CHARACTER_LONG_TEXT_LIMIT,
    ),
    luck: normalizeCharacterRarity(body.luck, 'luck', Rarity.COMMON),
    might: normalizeCharacterRarity(body.might, 'might', Rarity.COMMON),
    wits: normalizeCharacterRarity(body.wits, 'wits', Rarity.COMMON),
    grace: normalizeCharacterRarity(body.grace, 'grace', Rarity.COMMON),
    charm: normalizeCharacterRarity(body.charm, 'charm', Rarity.COMMON),
    empathy: normalizeCharacterRarity(body.empathy, 'empathy', Rarity.COMMON),
    artPrompt: normalizeCharacterNullableText(
      body.artPrompt,
      'artPrompt',
      CHARACTER_LONG_TEXT_LIMIT,
    ),
    imagePath: normalizeCharacterNullableText(
      body.imagePath,
      'imagePath',
      CHARACTER_SHORT_TEXT_LIMIT,
    ),
    experience:
      body.experience === undefined
        ? 0
        : normalizeCharacterInteger(body.experience, 'experience', 0),
    level:
      body.level === undefined
        ? 1
        : normalizeCharacterInteger(body.level, 'level', 1),
    designer: normalizeCharacterNullableText(
      body.designer,
      'designer',
      CHARACTER_SHORT_TEXT_LIMIT,
    ),
    isPublic:
      body.isPublic === undefined
        ? true
        : normalizeCharacterBoolean(body.isPublic, 'isPublic'),
    isMature:
      body.isMature === undefined
        ? false
        : normalizeCharacterBoolean(body.isMature, 'isMature'),
    isActive:
      body.isActive === undefined
        ? true
        : normalizeCharacterBoolean(body.isActive, 'isActive'),
    ArtImage:
      typeof artImageId === 'number'
        ? { connect: { id: artImageId } }
        : undefined,
    Rewards: rewardIds.length
      ? { connect: rewardIds.map((id) => ({ id })) }
      : undefined,
    Scenarios: scenarioIds.length
      ? { connect: scenarioIds.map((id) => ({ id })) }
      : undefined,
    Dreams: dreamIds.length
      ? { connect: dreamIds.map((id) => ({ id })) }
      : undefined,
  }
}

export async function buildCharacterUpdateInput(
  body: CharacterMutationInput,
): Promise<Prisma.CharacterUpdateInput> {
  const data: Prisma.CharacterUpdateInput = {}

  for (const field of shortTextFields) {
    if (field in body) {
      data[field] = normalizeCharacterNullableText(
        body[field],
        field,
        CHARACTER_SHORT_TEXT_LIMIT,
      ) as never
    }
  }

  for (const field of longTextFields) {
    if (field in body) {
      data[field] = normalizeCharacterNullableText(
        body[field],
        field,
        CHARACTER_LONG_TEXT_LIMIT,
      ) as never
    }
  }

  for (const field of rarityFields) {
    if (field in body) {
      data[field] = normalizeCharacterRarity(body[field], field) as never
    }
  }

  for (const field of booleanFields) {
    if (field in body) {
      data[field] = normalizeCharacterBoolean(body[field], field) as never
    }
  }

  if ('experience' in body) {
    data.experience = normalizeCharacterInteger(body.experience, 'experience', 0)
  }
  if ('level' in body) {
    data.level = normalizeCharacterInteger(body.level, 'level', 1)
  }

  const artImageId = normalizeCharacterNullableId(body.artImageId, 'artImageId')
  const rewardIds = normalizeCharacterIdArray(body.rewardIds, 'rewardIds')
  const scenarioIds = normalizeCharacterIdArray(body.scenarioIds, 'scenarioIds')
  const dreamIds = normalizeCharacterIdArray(body.dreamIds, 'dreamIds')

  await assertCharacterRelationsExist({
    artImageId,
    rewardIds,
    scenarioIds,
    dreamIds,
  })

  if ('artImageId' in body) {
    data.ArtImage =
      typeof artImageId === 'number'
        ? { connect: { id: artImageId } }
        : { disconnect: true }
  }
  if (rewardIds !== undefined) {
    data.Rewards = { set: rewardIds.map((id) => ({ id })) }
  }
  if (scenarioIds !== undefined) {
    data.Scenarios = { set: scenarioIds.map((id) => ({ id })) }
  }
  if (dreamIds !== undefined) {
    data.Dreams = { set: dreamIds.map((id) => ({ id })) }
  }

  return data
}
