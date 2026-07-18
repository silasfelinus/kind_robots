// /server/api/characters/index.post.ts
import { createError, defineEventHandler, readBody } from 'h3'
import { errorHandler } from '../../utils/error'
import { requireApiUser } from '@/server/utils/authGuard'
import prisma from '../../utils/prisma'
import { normalizeSlugInput } from '../../../utils/slugify'
import {
  findCharacterNameDuplicate,
  getCharacterNameKey,
  getUniqueCharacterSlug,
} from '../../utils/characterSlug'
import type {
  Character,
  Prisma,
  Rarity,
} from '~/prisma/generated/prisma/client'
import { characterMutationSelect } from './selects'

type CharacterCreateBody = Partial<Character> & {
  rewardIds?: number[]
  scenarioIds?: number[]
  dreamIds?: number[]
}

const fallbackRarity: Rarity = 'COMMON'

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
  if (typeof value === 'undefined') return []

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

function cleanText(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function cleanShortText(value: unknown): string | null {
  const text = cleanText(value)
  return text ? text.slice(0, 764) : null
}

export default defineEventHandler(async (event) => {
  try {
    const { user } = await requireApiUser(event)
    const characterData = await readBody<CharacterCreateBody>(event)

    if (!characterData.name || typeof characterData.name !== 'string') {
      throw createError({
        statusCode: 400,
        message: 'The "name" field is required and must be a string.',
      })
    }

    const name = characterData.name.trim()

    if (!getCharacterNameKey(name)) {
      throw createError({
        statusCode: 400,
        message: 'Character name must contain at least one letter or number.',
      })
    }

    const duplicate = await findCharacterNameDuplicate(prisma, user.id, name)

    if (duplicate) {
      throw createError({
        statusCode: 409,
        message: `Character "${name}" already exists as #${duplicate.id}.`,
      })
    }

    const requestedSlug = normalizeSlugInput(characterData.slug)
    const slug = await getUniqueCharacterSlug(prisma, requestedSlug ?? name)
    const rewardIds = normalizeIdArray(characterData.rewardIds, 'rewardIds')
    const scenarioIds = normalizeIdArray(
      characterData.scenarioIds,
      'scenarioIds',
    )
    const dreamIds = normalizeIdArray(characterData.dreamIds, 'dreamIds')

    const fullData: Prisma.CharacterCreateInput = {
      User: {
        connect: {
          id: user.id,
        },
      },
      name,
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
      sampleResponse: cleanText(characterData.sampleResponse),
      voice: cleanText(characterData.voice),
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
      experience: Number.isInteger(characterData.experience)
        ? Number(characterData.experience)
        : 0,
      level:
        Number.isInteger(characterData.level) && Number(characterData.level) > 0
          ? Number(characterData.level)
          : 1,
      designer: cleanShortText(characterData.designer),
      isPublic: characterData.isPublic ?? true,
      isMature: characterData.isMature ?? false,
      isActive: characterData.isActive ?? true,
      ArtImage: characterData.artImageId
        ? {
            connect: {
              id: characterData.artImageId,
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

    const data = await prisma.character.create({
      data: fullData,
      select: characterMutationSelect,
    })

    event.node.res.statusCode = 201

    return {
      success: true,
      data,
      message: 'Character created successfully.',
      statusCode: 201,
    }
  } catch (error: unknown) {
    const { message, statusCode } = errorHandler(error)
    event.node.res.statusCode = statusCode || 500

    return {
      success: false,
      data: null,
      message: message || 'Failed to create character.',
      statusCode: event.node.res.statusCode,
    }
  }
})
