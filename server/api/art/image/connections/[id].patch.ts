// /server/api/art/image/connections/[id].patch.ts
import { defineEventHandler, createError, readBody, type H3Event } from 'h3'
import type { ArtImage, Prisma } from '~/prisma/generated/prisma/client'
import prisma from '../../../../utils/prisma'
import { errorHandler } from '../../../../utils/error'
import { validateApiKey } from '../../../../utils/validateKey'

type ValidatedUser = {
  id?: number | null
  Role?: string | null
  role?: string | null
  isAdmin?: boolean | null
}

type PatchUser = {
  id: number
  isAdmin: boolean
}

type ArtImageConnectionBody = {
  artId?: number | null
  botId?: number | null
  componentId?: number | null
  milestoneId?: number | null
  pitchId?: number | null
  promptId?: number | null
  resourceId?: number | null
  rewardId?: number | null
  chatId?: number | null
  characterId?: number | null
  butterflyId?: number | null
  galleryId?: number | null
  userId?: number | null
  serverId?: number | null
  checkpointResourceId?: number | null

  dreamIds?: number[]
  scenarioIds?: number[]
  reactionIds?: number[]
  tagIds?: number[]
  butterflyIds?: number[]
  artCollectionIds?: number[]

  disconnectDreamIds?: number[]
  disconnectScenarioIds?: number[]
  disconnectReactionIds?: number[]
  disconnectTagIds?: number[]
  disconnectButterflyIds?: number[]
  disconnectArtCollectionIds?: number[]

  tagOwnerId?: number | null

  clearDirectLinks?: boolean
  clearDreams?: boolean
  clearScenarios?: boolean
  clearReactions?: boolean
  clearTags?: boolean
  clearButterflies?: boolean
  clearArtCollections?: boolean
  clearTagOwner?: boolean
}

function isAdminUser(user: ValidatedUser | null | undefined): boolean {
  if (!user) return false

  const role = String(user.Role || user.role || '').toLowerCase()

  return Boolean(user.isAdmin || role === 'admin' || role === 'system')
}

async function requirePatchUser(event: H3Event): Promise<PatchUser> {
  const auth = await validateApiKey(event)
  const user = auth.user as ValidatedUser | null | undefined

  if (!auth.isValid || typeof user?.id !== 'number') {
    throw createError({
      statusCode: 401,
      message: 'Valid authorization token required.',
    })
  }

  return {
    id: Number(user.id),
    isAdmin: isAdminUser(user),
  }
}

function cleanId(value: unknown): number | null {
  const parsed = Number(value)

  return Number.isInteger(parsed) && parsed > 0 ? parsed : null
}

function cleanIds(values: unknown): number[] {
  if (!Array.isArray(values)) return []

  return [...new Set(values)]
    .map((value) => Number(value))
    .filter((value) => Number.isInteger(value) && value > 0)
}

function connectMany(ids: number[]) {
  return ids.length ? ids.map((id) => ({ id })) : undefined
}

function disconnectMany(ids: number[]) {
  return ids.length ? ids.map((id) => ({ id })) : undefined
}

function setDirectLink(
  data: Prisma.ArtImageUpdateInput,
  key:
    | 'Art'
    | 'Bot'
    | 'Component'
    | 'Milestone'
    | 'Pitch'
    | 'Prompt'
    | 'Resource'
    | 'Reward'
    | 'Chat'
    | 'Character'
    | 'Gallery'
    | 'User'
    | 'Server'
    | 'CheckpointResource',
  id: unknown,
): void {
  if (id === undefined) return

  const clean = cleanId(id)

  data[key] = clean
    ? {
        connect: {
          id: clean,
        },
      }
    : {
        disconnect: true,
      }
}

function addListConnection(
  data: Prisma.ArtImageUpdateInput,
  key:
    | 'Dreams'
    | 'Scenarios'
    | 'Reactions'
    | 'Tags'
    | 'Butterflies'
    | 'ArtCollections',
  connectIds: number[],
  disconnectIds: number[],
  clear = false,
): void {
  if (!connectIds.length && !disconnectIds.length && !clear) return

  data[key] = {
    ...(clear ? { set: [] } : {}),
    ...(connectIds.length ? { connect: connectMany(connectIds) } : {}),
    ...(disconnectIds.length
      ? { disconnect: disconnectMany(disconnectIds) }
      : {}),
  } as never
}

export default defineEventHandler(async (event) => {
  const id = Number(event.context.params?.id)

  try {
    if (!Number.isInteger(id) || id <= 0) {
      throw createError({
        statusCode: 400,
        message: 'Invalid ArtImage ID. It must be a positive integer.',
      })
    }

    const user = await requirePatchUser(event)

    const existing = await prisma.artImage.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
      },
    })

    if (!existing) {
      throw createError({
        statusCode: 404,
        message: `ArtImage #${id} not found.`,
      })
    }

    if (!user.isAdmin && existing.userId !== user.id) {
      throw createError({
        statusCode: 403,
        message: 'You are not allowed to update this art image.',
      })
    }

    const body = await readBody<ArtImageConnectionBody>(event)

    if (!body || typeof body !== 'object') {
      throw createError({
        statusCode: 400,
        message: 'No connection data provided.',
      })
    }

    const data: Prisma.ArtImageUpdateInput = {}

    if (body.clearDirectLinks) {
      data.Art = { disconnect: true }
      data.Bot = { disconnect: true }
      data.Component = { disconnect: true }
      data.Milestone = { disconnect: true }
      data.Pitch = { disconnect: true }
      data.Prompt = { disconnect: true }
      data.Resource = { disconnect: true }
      data.Reward = { disconnect: true }
      data.Chat = { disconnect: true }
      data.Character = { disconnect: true }
      data.Server = { disconnect: true }
      data.CheckpointResource = { disconnect: true }
    }

    setDirectLink(data, 'Art', body.artId)
    setDirectLink(data, 'Bot', body.botId)
    setDirectLink(data, 'Component', body.componentId)
    setDirectLink(data, 'Milestone', body.milestoneId)
    setDirectLink(data, 'Pitch', body.pitchId)
    setDirectLink(data, 'Prompt', body.promptId)
    setDirectLink(data, 'Resource', body.resourceId)
    setDirectLink(data, 'Reward', body.rewardId)
    setDirectLink(data, 'Chat', body.chatId)
    setDirectLink(data, 'Character', body.characterId)
    setDirectLink(data, 'Gallery', body.galleryId)
    setDirectLink(data, 'User', body.userId)
    setDirectLink(data, 'Server', body.serverId)
    setDirectLink(data, 'CheckpointResource', body.checkpointResourceId)

    addListConnection(
      data,
      'Butterflies',
      cleanIds([
        ...(body.butterflyId ? [body.butterflyId] : []),
        ...cleanIds(body.butterflyIds),
      ]),
      cleanIds(body.disconnectButterflyIds),
      Boolean(body.clearButterflies),
    )

    addListConnection(
      data,
      'Dreams',
      cleanIds(body.dreamIds),
      cleanIds(body.disconnectDreamIds),
      Boolean(body.clearDreams),
    )

    addListConnection(
      data,
      'Scenarios',
      cleanIds(body.scenarioIds),
      cleanIds(body.disconnectScenarioIds),
      Boolean(body.clearScenarios),
    )

    addListConnection(
      data,
      'Reactions',
      cleanIds(body.reactionIds),
      cleanIds(body.disconnectReactionIds),
      Boolean(body.clearReactions),
    )

    addListConnection(
      data,
      'Tags',
      cleanIds(body.tagIds),
      cleanIds(body.disconnectTagIds),
      Boolean(body.clearTags),
    )

    addListConnection(
      data,
      'Butterflies',
      cleanIds([
        ...(body.butterflyId ? [body.butterflyId] : []),
        ...cleanIds(body.butterflyIds),
      ]),
      cleanIds(body.disconnectButterflyIds),
      Boolean(body.clearButterflies),
    )

    addListConnection(
      data,
      'ArtCollections',
      cleanIds(body.artCollectionIds),
      cleanIds(body.disconnectArtCollectionIds),
      Boolean(body.clearArtCollections),
    )

    if (body.clearTagOwner) {
      data.TagOwner = {
        disconnect: true,
      }
    }

    if (body.tagOwnerId !== undefined) {
      const tagOwnerId = cleanId(body.tagOwnerId)

      data.TagOwner = tagOwnerId
        ? {
            connect: {
              id: tagOwnerId,
            },
          }
        : {
            disconnect: true,
          }
    }

    if (Object.keys(data).length === 0) {
      throw createError({
        statusCode: 400,
        message: 'No valid ArtImage connections provided.',
      })
    }

    const updated: ArtImage = await prisma.artImage.update({
      where: { id },
      data,
    })

    event.node.res.statusCode = 200

    return {
      success: true,
      message: `ArtImage #${id} connections updated.`,
      data: updated,
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)

    event.node.res.statusCode = handled.statusCode || 500

    return {
      success: false,
      message: handled.message || `Failed to update ArtImage #${id}.`,
      data: null,
    }
  }
})
