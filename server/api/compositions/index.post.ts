// /server/api/compositions/index.post.ts
import { defineEventHandler, readBody, createError } from 'h3'
import prisma from '../../utils/prisma'
import { errorHandler } from '../../utils/error'
import { validateApiKey } from '../../utils/validateKey'
import type { Composition, Prisma } from '~/prisma/generated/prisma/client'

type CompositionCreateBody = Partial<Composition>

function asNullableString(value: unknown): string | null {
  if (typeof value !== 'string') return null

  const trimmed = value.trim()
  return trimmed ? trimmed : null
}

function asStringOrDefault(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback
}

function asOptionalPositiveInt(value: unknown): number | undefined {
  const parsed = Number(value)

  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined
}

async function assertRelatedRecordsExist(options: {
  characterId?: number
  dreamId?: number
  scenarioId?: number
  pitchId?: number
  rewardId?: number
  artImageId?: number
}) {
  const { characterId, dreamId, scenarioId, pitchId, rewardId, artImageId } =
    options

  if (characterId) {
    const character = await prisma.character.findUnique({
      where: { id: characterId },
      select: { id: true },
    })

    if (!character) {
      throw createError({
        statusCode: 404,
        message: `Character ID not found: ${characterId}.`,
      })
    }
  }

  if (dreamId) {
    const dream = await prisma.dream.findUnique({
      where: { id: dreamId },
      select: { id: true },
    })

    if (!dream) {
      throw createError({
        statusCode: 404,
        message: `Dream ID not found: ${dreamId}.`,
      })
    }
  }

  if (scenarioId) {
    const scenario = await prisma.scenario.findUnique({
      where: { id: scenarioId },
      select: { id: true },
    })

    if (!scenario) {
      throw createError({
        statusCode: 404,
        message: `Scenario ID not found: ${scenarioId}.`,
      })
    }
  }

  if (pitchId) {
    const pitch = await prisma.pitch.findUnique({
      where: { id: pitchId },
      select: { id: true },
    })

    if (!pitch) {
      throw createError({
        statusCode: 404,
        message: `Pitch ID not found: ${pitchId}.`,
      })
    }
  }

  if (rewardId) {
    const reward = await prisma.reward.findUnique({
      where: { id: rewardId },
      select: { id: true },
    })

    if (!reward) {
      throw createError({
        statusCode: 404,
        message: `Reward ID not found: ${rewardId}.`,
      })
    }
  }

  if (artImageId) {
    const artImage = await prisma.artImage.findUnique({
      where: { id: artImageId },
      select: { id: true },
    })

    if (!artImage) {
      throw createError({
        statusCode: 404,
        message: `ArtImage ID not found: ${artImageId}.`,
      })
    }
  }
}

async function normalizeComposition(
  entry: CompositionCreateBody,
  userId: number,
): Promise<Prisma.CompositionCreateInput> {
  const title = asStringOrDefault(entry.title, '')

  if (!title) {
    throw createError({
      statusCode: 400,
      message: 'The "title" field is required.',
    })
  }

  const characterId = asOptionalPositiveInt(entry.characterId)
  const dreamId = asOptionalPositiveInt(entry.dreamId)
  const scenarioId = asOptionalPositiveInt(entry.scenarioId)
  const pitchId = asOptionalPositiveInt(entry.pitchId)
  const rewardId = asOptionalPositiveInt(entry.rewardId)
  const artImageId = asOptionalPositiveInt(entry.artImageId)

  await assertRelatedRecordsExist({
    characterId,
    dreamId,
    scenarioId,
    pitchId,
    rewardId,
    artImageId,
  })

  return {
    title,
    description: asNullableString(entry.description),
    label: asNullableString(entry.label),
    mode: asStringOrDefault(entry.mode, 'both'),
    isPublic: entry.isPublic ?? true,
    isMature: entry.isMature ?? false,
    isActive: entry.isActive ?? true,
    designer: asStringOrDefault(entry.designer, ''),
    characterBlurb: asNullableString(entry.characterBlurb),
    dreamBlurb: asNullableString(entry.dreamBlurb),
    scenarioBlurb: asNullableString(entry.scenarioBlurb),
    pitchBlurb: asNullableString(entry.pitchBlurb),
    rewardBlurb: asNullableString(entry.rewardBlurb),
    narrativeText: asNullableString(entry.narrativeText),
    artPrompt: asNullableString(entry.artPrompt),
    User: {
      connect: { id: userId },
    },
    Character: characterId
      ? {
          connect: { id: characterId },
        }
      : undefined,
    Dream: dreamId
      ? {
          connect: { id: dreamId },
        }
      : undefined,
    Scenario: scenarioId
      ? {
          connect: { id: scenarioId },
        }
      : undefined,
    Pitch: pitchId
      ? {
          connect: { id: pitchId },
        }
      : undefined,
    Reward: rewardId
      ? {
          connect: { id: rewardId },
        }
      : undefined,
    ArtImage: artImageId
      ? {
          connect: { id: artImageId },
        }
      : undefined,
  }
}

export default defineEventHandler(async (event) => {
  try {
    const { isValid, user, kind } = await validateApiKey(event)

    if (!isValid || !user) {
      throw createError({
        statusCode: 401,
        message: 'Invalid or expired token.',
      })
    }

    const body = await readBody<
      CompositionCreateBody | CompositionCreateBody[]
    >(event)

    const requestedUserId = !Array.isArray(body)
      ? asOptionalPositiveInt(body.userId)
      : undefined

    const isAdmin = user.Role === 'ADMIN' || user.id === 1
    const isServerKey = kind === 'server'

    const userId =
      (isAdmin || isServerKey) && requestedUserId ? requestedUserId : user.id

    if (Array.isArray(body)) {
      const created: Composition[] = []
      const skipped: string[] = []

      for (const entry of body) {
        try {
          const data = await normalizeComposition(entry, userId)

          const result = await prisma.composition.create({
            data,
            include: {
              Character: true,
              Dream: true,
              Scenario: true,
              Pitch: true,
              Reward: true,
              ArtImage: {
                select: {
                  id: true,
                  imagePath: true,
                  fileName: true,
                },
              },
            },
          })

          created.push(result)
        } catch (error: any) {
          if (error?.code === 'P2002') {
            skipped.push(entry.title || '(untitled)')
          } else {
            throw error
          }
        }
      }

      event.node.res.statusCode = 201

      return {
        success: true,
        message: `${created.length} compositions created, ${skipped.length} skipped.`,
        data: created,
        skipped,
        count: created.length,
        statusCode: 201,
      }
    }

    const data = await normalizeComposition(body, userId)

    const composition = await prisma.composition.create({
      data,
      include: {
        Character: true,
        Dream: true,
        Scenario: true,
        Pitch: true,
        Reward: true,
        ArtImage: {
          select: {
            id: true,
            imagePath: true,
            fileName: true,
          },
        },
      },
    })

    event.node.res.statusCode = 201

    return {
      success: true,
      message: 'Composition created successfully.',
      data: composition,
      statusCode: 201,
    }
  } catch (error) {
    const { message, statusCode } = errorHandler(error)

    event.node.res.statusCode = statusCode || 500

    return {
      success: false,
      message: message || 'Failed to create Composition.',
      data: null,
      statusCode: event.node.res.statusCode,
    }
  }
})
