// /server/api/characters/batch.post.ts
import { createError, defineEventHandler, readBody } from 'h3'
import { errorHandler } from '../../utils/error'
import { validateApiKey } from '../../utils/validateKey'
import prisma from '../../utils/prisma'
import { normalizeSlugInput } from '../../../utils/slugify'
import {
  getCharacterNameKey,
  getUniqueCharacterSlug,
} from '../../utils/characterSlug'
import {
  assertCharacterMutationInput,
  buildCharacterCreateInput,
  CHARACTER_BATCH_LIMIT,
  characterBatchCreateFields,
  normalizeCharacterName,
  type CharacterMutationInput,
} from './mutation'
import {
  characterMutationSelect,
  type CharacterMutationResult,
} from './selects'

const transactionMaxWaitMs = 10_000
const transactionTimeoutMs = 30_000

type BatchBody =
  | CharacterMutationInput[]
  | {
      characters?: CharacterMutationInput[]
      data?: CharacterMutationInput[]
    }

function normalizeBatchBody(body: unknown): CharacterMutationInput[] {
  if (Array.isArray(body)) return body as CharacterMutationInput[]

  if (!body || typeof body !== 'object') {
    throw createError({
      statusCode: 400,
      message:
        'Request body must be an array, or an object with a characters array.',
    })
  }

  const record = body as Record<string, unknown>
  const unsupported = Object.keys(record).filter(
    (field) => field !== 'characters' && field !== 'data',
  )

  if (unsupported.length) {
    throw createError({
      statusCode: 400,
      message: `Unsupported Character batch fields: ${unsupported.join(', ')}.`,
    })
  }

  if (Array.isArray(record.characters) && Array.isArray(record.data)) {
    throw createError({
      statusCode: 400,
      message: 'Send either "characters" or "data", not both.',
    })
  }

  if (Array.isArray(record.characters)) {
    return record.characters as CharacterMutationInput[]
  }

  if (Array.isArray(record.data)) {
    return record.data as CharacterMutationInput[]
  }

  throw createError({
    statusCode: 400,
    message:
      'Request body must be an array, or an object with a characters array.',
  })
}

async function resolveCharacterSlugs(
  characters: CharacterMutationInput[],
  userId: number,
): Promise<(string | null)[]> {
  const existingCharacters = await prisma.character.findMany({
    where: { userId },
    select: { id: true, name: true, slug: true },
    orderBy: { id: 'asc' },
  })
  const existingKeys = new Map(
    existingCharacters.map((character) => [
      getCharacterNameKey(character.name),
      character,
    ] as const),
  )
  const batchKeys = new Map<string, number>()
  const reservedSlugs = new Set<string>()
  const slugs: (string | null)[] = []

  for (const [index, characterData] of characters.entries()) {
    assertCharacterMutationInput(characterData, {
      allowedFields: characterBatchCreateFields,
      context: `Character batch item ${index}`,
    })

    const name = normalizeCharacterName(characterData.name)
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

    if (firstBatchIndex !== undefined) {
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

    if (characters.length > CHARACTER_BATCH_LIMIT) {
      throw createError({
        statusCode: 400,
        message: `Character batch may contain at most ${CHARACTER_BATCH_LIMIT} entries.`,
      })
    }

    const slugs = await resolveCharacterSlugs(characters, user.id)
    const createInputs = await Promise.all(
      characters.map((characterData, index) =>
        buildCharacterCreateInput({
          rawInput: characterData,
          userId: user.id,
          slug: slugs[index] ?? null,
          batch: true,
        }),
      ),
    )

    const data = await prisma.$transaction(
      async (tx) => {
        const createdCharacters: CharacterMutationResult[] = []

        for (const createInput of createInputs) {
          createdCharacters.push(
            await tx.character.create({
              data: createInput,
              select: characterMutationSelect,
            }),
          )
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
      message: `${data.length} character${data.length === 1 ? '' : 's'} created successfully.`,
      statusCode: 201,
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    const statusCode = handled.statusCode || 500
    event.node.res.statusCode = statusCode

    return {
      success: false,
      data: null,
      message: handled.message || 'Failed to create characters.',
      statusCode,
    }
  }
})
