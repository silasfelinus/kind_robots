// /server/api/prompts/index.post.ts
import { createError, defineEventHandler, readBody } from 'h3'
import prisma from '../../utils/prisma'
import { errorHandler } from '../../utils/error'
import { validateApiKey } from '../../utils/validateKey'
import { assertOnlyFields } from '../../utils/chatApi'
import { awardKarma } from '../../utils/karma'
import type { Prisma, Prompt } from '~/prisma/generated/prisma/client'
import { promptResourceSelect } from './selects'

type PromptCreateBody = Partial<Omit<Prompt, 'userId'>> &
  Record<string, unknown> & {
    CreationSource?: string
  }

// Every persisted Prompt column plus the identity/system/relation keys a
// round-tripped Prompt object can echo, plus the `CreationSource` alias.
// Anything outside this set is rejected (400) instead of silently dropped
// (audit F-4).
const promptCreateFields = new Set<string>([
  // persisted / read on create
  'prompt',
  'artPrompt',
  'creationSource',
  'CreationSource',
  'isMature',
  'isPublic',
  'isActive',
  'botId',
  'artImageId',
  // identity/system + relation keys tolerated on a round-tripped row
  'id',
  'createdAt',
  'updatedAt',
  'userId',
  'serverId',
  'imagePath',
  'artStatus',
  'batchId',
  'batchIndex',
  'queuePosition',
  'startedAt',
  'completedAt',
  'errorMessage',
  'notifiedAt',
  'isBounty',
  'bountyStatus',
  'claimerId',
  'Chats',
  'ArtImage',
  'Bot',
  'Claimer',
  'Server',
  'User',
  'Reactions',
])

function getPositiveIntegerOrUndefined(value: unknown): number | undefined {
  const numericValue = Number(value)
  return Number.isInteger(numericValue) && numericValue > 0
    ? numericValue
    : undefined
}

function assertOwnershipMatchesAuthentication(
  body: Record<string, unknown>,
  authenticatedUserId: number,
) {
  if (!Object.prototype.hasOwnProperty.call(body, 'userId')) return

  const requestedUserId = Number(body.userId)

  if (
    !Number.isInteger(requestedUserId) ||
    requestedUserId !== authenticatedUserId
  ) {
    throw createError({
      statusCode: 400,
      message: 'Unsupported Prompt ownership assignment. Ownership is server-owned.',
    })
  }
}

async function assertRelatedRecordsExist(options: {
  botId?: number
  artImageId?: number
}) {
  const { botId, artImageId } = options

  if (botId) {
    const bot = await prisma.bot.findUnique({
      where: { id: botId },
      select: { id: true },
    })

    if (!bot) {
      throw createError({
        statusCode: 404,
        message: `Bot ID not found: ${botId}.`,
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

export default defineEventHandler(async (event) => {
  try {
    const { isValid, user } = await validateApiKey(event)

    if (!isValid || !user) {
      throw createError({
        statusCode: 401,
        message: 'Invalid or expired token.',
      })
    }

    const promptData = await readBody<PromptCreateBody>(event)

    if (!promptData || typeof promptData !== 'object' || Array.isArray(promptData)) {
      throw createError({
        statusCode: 400,
        message: 'Prompt payload is required.',
      })
    }

    if (!promptData.prompt || typeof promptData.prompt !== 'string') {
      throw createError({
        statusCode: 400,
        message: 'The "prompt" field is required and must be a string.',
      })
    }

    assertOnlyFields(promptData, promptCreateFields, 'Prompt')

    const authenticatedUserId = user.id
    assertOwnershipMatchesAuthentication(promptData, authenticatedUserId)

    const botId = getPositiveIntegerOrUndefined(promptData.botId)
    const artImageId = getPositiveIntegerOrUndefined(promptData.artImageId)

    await assertRelatedRecordsExist({
      botId,
      artImageId,
    })

    const resolvedSource = (promptData.creationSource ??
      promptData.CreationSource ??
      'UNKNOWN') as string

    const createData: Prisma.PromptCreateInput = {
      prompt: promptData.prompt.trim(),
      artPrompt:
        typeof promptData.artPrompt === 'string'
          ? promptData.artPrompt.trim()
          : undefined,
      creationSource: resolvedSource as any,
      isMature: promptData.isMature ?? false,
      isPublic: promptData.isPublic ?? false,
      isActive: promptData.isActive ?? true,
      User: {
        connect: { id: authenticatedUserId },
      },
      Bot: botId
        ? {
            connect: { id: botId },
          }
        : undefined,
      ArtImage: artImageId
        ? {
            connect: { id: artImageId },
          }
        : undefined,
    }

    const data = await prisma.prompt.create({
      data: createData,
      select: promptResourceSelect,
    })

    if (data.isPublic) {
      void awardKarma({
        userId: authenticatedUserId,
        reason: 'CONTENT_CREATED_PUBLIC',
        refId: String(data.id),
      }).catch(() => {})
    }

    event.node.res.statusCode = 201

    return {
      success: true,
      data,
      message: 'Prompt created successfully.',
      statusCode: 201,
    }
  } catch (error: unknown) {
    const { message, statusCode } = errorHandler(error)
    event.node.res.statusCode = statusCode || 500

    return {
      success: false,
      data: null,
      message: message || 'Failed to create prompt.',
      error: message,
      statusCode: event.node.res.statusCode,
    }
  }
})
