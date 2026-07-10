// /server/api/characters/batch.post.ts
import { defineEventHandler, readBody, createError } from 'h3'
import { errorHandler } from '../../utils/error'
import { validateApiKey } from '../../utils/validateKey'
import prisma from '../../utils/prisma'
import { normalizeSlugInput } from '../../../utils/slugify'
import {
  getCharacterNameKey,
  getUniqueCharacterSlug,
} from '../../utils/characterSlug'
import type {
  Prisma,
  Character,
  Rarity,
} from '~/prisma/generated/prisma/client'

type ConnectById = {
  id: number
}

type RelationConnectInput = {
  connect?: ConnectById | ConnectById[]
}

type CharacterBatchCreateBody = Partial<Character> & {
  rewardIds?: number[]
  scenarioIds?: number[]
  dreamIds?: number[]
  Rewards?: RelationConnectInput
  Scenarios?: RelationConnectInput
  Dreams?: RelationConnectInput
}

type BatchBody =
  | CharacterBatchCreateBody[]
  | {
      characters?: CharacterBatchCreateBody[]
      data?: CharacterBatchCreateBody[]
    }

const fallbackRarity: Rarity = 'COMMON'
const transactionMaxWaitMs = 10000
const transactionTimeoutMs = 30000

const characterInclude = {
  ArtImage: true,
  Rewards: true,
  Scenarios: true,
  Dreams: true,
} satisfies Prisma.CharacterInclude

type CreatedCharacter = Prisma.CharacterGetPayload<{
  include: typeof characterInclude
}>

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function normalizeRarity(value: unknown): Rarity {
  if (
    value === 'COMMON' ||
    value === 'UNCOMMON' ||
    value === 'RARE' ||
    value === 'EPIC' ||
    value === 'LEGENDARY' ||
    value === 'MYTHIC'
  ) {
    return value
  }

  if (typeof value === 'number') {
    const rarityByNumber: Record<number, Rarity> = {
      1: 'COMMON',
      2: 'UNCOMMON',
      3: 'RARE',
      4: 'EPIC',
      5: 'LEGENDARY',
      6: 'MYTHIC',
    }

    return rarityByNumber[value] ?? fallbackRarity
  }

  return fallbackRarity
}

function normalizeIdArray(value: unknown, fieldName: string): number[] {
  if (typeof value === 'undefined' || value === null) return []

  if (!Array.isArray(value)) {
    throw createError({
      statusCode: 400,
      message: `${fieldName} must be an array of IDs.`,
    })
  }

  const ids = value.map((entry) => Number(entry))

  if (!ids.every((id) => Number.isInteger(id) && id > 0)) {
    throw createError({
      statusCode: 400,
      message: `${fieldName} must contain only positive integers.`,
    })
  }

  return [...new Set(ids)]
}

function normalizeConnectIds(value: unknown, fieldName: string): number[] {
  if (typeof value === 'undefined' || value === null) return []

  if (!isRecord(value)) {
    throw createError({
      statusCode: 400,
      message: `${fieldName} must use { connect: [{ id }] }.`,
    })
  }

  const connect = value.connect

  if (typeof connect === 'undefined' || connect === null) return []

  const entries = Array.isArray(connect) ? connect : [connect]

  const ids = entries.map((entry) => {
    if (!isRecord(entry)) return NaN
    return Number(entry.id)
  })

  if (!ids.every((id) => Number.isInteger(id) && id > 0)) {
    throw createError({
      statusCode: 400,
      message: `${fieldName}.connect must contain only positive integer IDs.`,
    })
  }

  return [...new Set(ids)]
}

function normalizeRelationIds(
  directValue: unknown,
  connectValue: unknown,
  directFieldName: string,
  connectFieldName: string,
): number[] {
  return [
    ...new Set([
      ...normalizeIdArray(directValue, directFieldName),
      ...normalizeConnectIds(connectValue, connectFieldName),
    ]),
  ]
}

function cleanText(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function cleanShortText(value: unknown): string | null {
  const text = cleanText(value)
  return text ? text.slice(0, 764) : null
}

function normalizeBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback
}

function normalizeOptionalPositiveInt(
  value: unknown,
  fieldName: string,
): number | null {
  if (typeof value === 'undefined' || value === null) return null

  const id = Number(value)

  if (!Number.isInteger(id) || id <= 0) {
    throw createError({
      statusCode: 400,
      message: `${fieldName} must be a positive integer.`,
    })
  }

  return id
}

function normalizeLevel(value: unknown): number {
  const level = Number(value)
  return Number.isInteger(level) && level > 0 ? level : 1
}

function normalizeExperience(value: unknown): number {
  const experience = Number(value)
  return Number.isInteger(experience) && experience >= 0 ? experience : 0
}

function normalizeBatchBody(body: BatchBody): CharacterBatchCreateBody[] {
  if (Array.isArray(body)) return body

  if (isRecord(body) && Array.isArray(body.characters)) {
    return body.characters as CharacterBatchCreateBody[]
  }

  if (isRecord(body) && Array.isArray(body.data)) {
    return body.data as CharacterBatchCreateBody[]
  }

  throw createError({
    statusCode: 400,
    message:
      'Request body must be an array, or an object with a characters array.',
  })
}

function buildCharacterCreateInput(
  characterData: CharacterBatchCreateBody,
  userId: number,
  index: number,
  slug: string | null,
): Prisma.CharacterCreateInput {
  if (!characterData.name || typeof characterData.name !== 'string') {
    throw createError({
      statusCode: 400,
      message: `characters[${index}].name is required and must be a string.`,
    })
  }

  const rewardIds = normalizeRelationIds(
    characterData.rewardIds,
    characterData.Rewards,
    `characters[${index}].rewardIds`,
    `characters[${index}].Rewards`,
  )

  const scenarioIds = normalizeRelationIds(
    characterData.scenarioIds,
    characterData.Scenarios,
    `characters[${index}].scenarioIds`,
    `characters[${index}].Scenarios`,
  )

  const dreamIds = normalizeRelationIds(
    characterData.dreamIds,
    characterData.Dreams,
    `characters[${index}].dreamIds`,
    `characters[${index}].Dreams`,
  )

  const artImageId = normalizeOptionalPositiveInt(
    characterData.artImageId,
    `characters[${index}].artImageId`,
  )

  return {
    User: {
      connect: {
        id: userId,
      },
    },

    name: characterData.name.trim(),
    slug,
    honorific: cleanShortText(characterData.honorific) ?? 'adventurer',
    title: cleanShortText(characterData.title),
    role: cleanShortText(characterData.role),
    class: cleanShortText(characterData.class),
    species: cleanShortText(characterData.species),
    gender: cleanShortText(characterData.gender),
    presentation: cleanShortText(characterData.presentation),
    genre: cleanShortText(characterData.genre),
    alignment: cleanShortText(characterData.alignment),
    personality: cleanText(characterData.personality),
    drive: cleanShortText(characterData.drive),
    backstory: cleanText(characterData.backstory),
    achievements: cleanShortText(characterData.achievements),
    quirks: cleanText(characterData.quirks),

    luck: normalizeRarity(characterData.luck),
    might: normalizeRarity(characterData.might),
    wits: normalizeRarity(characterData.wits),
    grace: normalizeRarity(characterData.grace),
    charm: normalizeRarity(characterData.charm),
    empathy: normalizeRarity(characterData.empathy),

    artPrompt: cleanText(characterData.artPrompt),
    imagePath: cleanShortText(characterData.imagePath),
    experience: normalizeExperience(characterData.experience),
    level: normalizeLevel(characterData.level),
    designer: cleanShortText(characterData.designer),
    isPublic: normalizeBoolean(characterData.isPublic, true),
    isMature: normalizeBoolean(characterData.isMature, false),
    isActive: normalizeBoolean(characterData.isActive, true),

    ArtImage: artImageId
      ? {
          connect: {
            id: artImageId,
          },
        }
      : undefined,

    Rewards: rewardIds.length
      ? {
          connect: rewardIds.map((id) => ({ id })),
        }
      : undefined,

    Scenarios: scenarioIds.length
      ? {
          connect: scenarioIds.map((id) => ({ id })),
        }
      : undefined,

    Dreams: dreamIds.length
      ? {
          connect: dreamIds.map((id) => ({ id })),
        }
      : undefined,
  }
}

async function resolveCharacterSlugs(
  characters: CharacterBatchCreateBody[],
  userId: number,
): Promise<(string | null)[]> {
  const existingCharacters = await prisma.character.findMany({
    where: { userId },
    select: { id: true, name: true, slug: true },
    orderBy: { id: 'asc' },
  })

  type ExistingCharacter = (typeof existingCharacters)[number]
  const existingKeys = new Map<string, ExistingCharacter>(
    existingCharacters.map((character) => [
      getCharacterNameKey(character.name),
      character,
    ] as const),
  )
  const batchKeys = new Map<string, number>()
  const reservedSlugs = new Set<string>()
  const slugs: (string | null)[] = []

  for (const [index, characterData] of characters.entries()) {
    if (!characterData.name || typeof characterData.name !== 'string') {
      throw createError({
        statusCode: 400,
        message: `characters[${index}].name is required and must be a string.`,
      })
    }

    const name = characterData.name.trim()
    const nameKey = getCharacterNameKey(name)

    if (!nameKey) {
      throw createError({
        statusCode: 400,
        message: `characters[${index}].name must contain at least one letter or number.`,
      })
    }

    const existingCharacter = existingKeys.get(nameKey)

    if (existingCharacter) {
      throw createError({
        statusCode: 409,
        message: `characters[${index}].name duplicates existing character #${existingCharacter.id}.`,
      })
    }

    const firstBatchIndex = batchKeys.get(nameKey)

    if (typeof firstBatchIndex !== 'undefined') {
      throw createError({
        statusCode: 400,
        message: `characters[${index}].name duplicates characters[${firstBatchIndex}].name.`,
      })
    }

    batchKeys.set(nameKey, index)

    const requestedSlug = normalizeSlugInput(characterData.slug)
    const slug = await getUniqueCharacterSlug(prisma, requestedSlug ?? name, {
      reservedSlugs,
    })

    if (slug) reservedSlugs.add(slug)
    slugs[index] = slug
  }

  return slugs
}

export default defineEventHandler(async (event) => {
  try {
    const { isValid, user } = await validateApiKey(event)

    if (!isValid || !user) {
      throw createError({
        statusCode: 401,
        message: 'Invalid or expired token.',
      })
    }

    const body = await readBody<BatchBody>(event)
    const characters = normalizeBatchBody(body)

    if (!characters.length) {
      throw createError({
        statusCode: 400,
        message: 'At least one character is required.',
      })
    }

    const slugs = await resolveCharacterSlugs(characters, user.id)

    const createInputs = characters.map((characterData, index) =>
      buildCharacterCreateInput(characterData, user.id, index, slugs[index] ?? null),
    )

    const data = await prisma.$transaction(
      async (tx) => {
        const createdCharacters: CreatedCharacter[] = []

        for (const fullData of createInputs) {
          const createdCharacter = await tx.character.create({
            data: fullData,
            include: characterInclude,
          })

          createdCharacters.push(createdCharacter)
        }

        return createdCharacters
      },
      {
        maxWait: transactionMaxWaitMs,
        timeout: transactionTimeoutMs,
      },
    )

    event.node.res.statusCode = 201

    return {
      success: true,
      data,
      message: `${data.length} character${
        data.length === 1 ? '' : 's'
      } created successfully.`,
    }
  } catch (error: unknown) {
    const { message, statusCode } = errorHandler(error)
    event.node.res.statusCode = statusCode || 500

    return {
      success: false,
      data: null,
      message: message || 'Failed to create characters.',
      statusCode: statusCode || 500,
    }
  }
})
