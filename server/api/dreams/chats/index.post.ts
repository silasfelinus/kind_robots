// /server/api/dreams/chats/index.post.ts
import { defineEventHandler, createError, readBody } from 'h3'
import prisma from '@/server/utils/prisma'
import { errorHandler } from '@/server/utils/error'
import { validateApiKey } from '@/server/utils/validateKey'
import type { ChatType, Prisma } from '~/prisma/generated/prisma/client'

type DreamChatCreateBody = {
  dreamId?: number | null
  type?: ChatType
  sender?: string
  recipient?: string | null
  content?: string
  title?: string | null
  isPublic?: boolean
  isFavorite?: boolean
  previousEntryId?: number | null
  originId?: number | null
  botId?: number | null
  recipientId?: number | null
  artImageId?: number | null
  promptId?: number | null
  botName?: string | null
  channel?: string | null
  botResponse?: string | null
  characterId?: number | null
  isRead?: boolean
  isMature?: boolean
  serverId?: number | null
  serverName?: string | null
  updateDream?: boolean
  currentVibe?: string
  currentPrompt?: string | null
  artId?: number | null
  addArtToCollection?: boolean
}

function normalizeNullableId(value: unknown): number | null | undefined {
  if (value === null) return null
  if (value === undefined || value === '') return undefined

  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed <= 0) return undefined

  return parsed
}

function requirePositiveId(value: unknown, label: string): number {
  const parsed = Number(value)

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw createError({
      statusCode: 400,
      message: `Invalid ${label}. It must be a positive integer.`,
    })
  }

  return parsed
}

export default defineEventHandler(async (event) => {
  let dreamId = 0

  try {
    const { isValid, user } = await validateApiKey(event)

    if (!isValid || !user) {
      throw createError({
        statusCode: 401,
        message: 'Invalid or expired token.',
      })
    }

    const body = await readBody<DreamChatCreateBody>(event)
    dreamId = requirePositiveId(body.dreamId, 'Dream ID')

    const dream = await prisma.dream.findUnique({
      where: { id: dreamId },
    })

    if (!dream) {
      throw createError({
        statusCode: 404,
        message: `Dream with ID ${dreamId} not found.`,
      })
    }

    if (!dream.isPublic && dream.userId !== user.id && user.Role !== 'ADMIN') {
      throw createError({
        statusCode: 403,
        message: 'You are not authorized to post to this dream.',
      })
    }

    const content = body.content?.trim()
    if (!content) {
      throw createError({
        statusCode: 400,
        message: 'The "content" field is required.',
      })
    }

    const userRecord = await prisma.user.findUnique({
      where: { id: user.id },
      select: { username: true },
    })

    const sender =
      body.sender?.trim() || userRecord?.username || `User ${user.id}`

    const chatInput: Prisma.ChatUncheckedCreateInput = {
      type: body.type ?? 'Dream',
      sender,
      recipient: body.recipient ?? null,
      content,
      title: body.title ?? null,
      isPublic: body.isPublic ?? dream.isPublic,
      isFavorite: body.isFavorite ?? false,
      previousEntryId: normalizeNullableId(body.previousEntryId),
      originId: normalizeNullableId(body.originId),
      userId: user.id,
      botId: normalizeNullableId(body.botId),
      recipientId: normalizeNullableId(body.recipientId),
      artImageId: normalizeNullableId(body.artImageId),
      promptId: normalizeNullableId(body.promptId),
      botName: body.botName ?? null,
      channel: body.channel ?? `dream-${dreamId}`,
      botResponse: body.botResponse ?? null,
      characterId: normalizeNullableId(body.characterId),
      isRead: body.isRead ?? false,
      isMature: body.isMature ?? dream.isMature,
      dreamId,
      serverId: normalizeNullableId(body.serverId),
      serverName: body.serverName ?? null,
    }

    const data = await prisma.chat.create({
      data: chatInput,
      include: {
        User: {
          select: {
            id: true,
            username: true,
            avatarImage: true,
          },
        },
        Prompt: true,
        ArtImage: {
          select: {
            id: true,
            fileName: true,
            fileType: true,
            createdAt: true,
            updatedAt: true,
            userId: true,
            artId: true,
            galleryId: true,
          },
        },
        Reactions: true,
      },
    })

    const artId = normalizeNullableId(body.artId)
    const artImageId = normalizeNullableId(body.artImageId)

    if (body.updateDream) {
      await prisma.dream.update({
        where: { id: dreamId },
        data: {
          ...(body.currentVibe !== undefined
            ? { currentVibe: body.currentVibe }
            : {}),
          ...(body.currentPrompt !== undefined
            ? { currentPrompt: body.currentPrompt }
            : {}),
          ...(artId !== undefined ? { artId } : {}),
          ...(artImageId !== undefined ? { artImageId } : {}),
        },
      })
    }

    if (body.addArtToCollection && dream.artCollectionId && artId) {
      await prisma.artCollection.update({
        where: { id: dream.artCollectionId },
        data: {
          art: {
            connect: { id: artId },
          },
        },
      })
    }

    event.node.res.statusCode = 201
    return {
      success: true,
      message: 'Dream chat created successfully.',
      data,
      statusCode: 201,
    }
  } catch (error) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500

    return {
      success: false,
      message: handled.message || `Failed to create chat for Dream ${dreamId}.`,
      data: null,
      statusCode: event.node.res.statusCode,
    }
  }
})
