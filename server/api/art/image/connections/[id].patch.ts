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
  userId?: number | null
  serverId?: number | null
  checkpointResourceId?: number | null

  dreamIds?: number[]
  scenarioIds?: number[]
  reactionIds?: number[]
  butterflyIds?: number[]
  artCollectionIds?: number[]
  botIds?: number[]
  componentIds?: number[]
  milestoneIds?: number[]
  pitchIds?: number[]
  promptIds?: number[]
  resourceIds?: number[]
  rewardIds?: number[]
  chatIds?: number[]
  characterIds?: number[]

  disconnectDreamIds?: number[]
  disconnectScenarioIds?: number[]
  disconnectReactionIds?: number[]
  disconnectButterflyIds?: number[]
  disconnectArtCollectionIds?: number[]
  disconnectBotIds?: number[]
  disconnectComponentIds?: number[]
  disconnectMilestoneIds?: number[]
  disconnectPitchIds?: number[]
  disconnectPromptIds?: number[]
  disconnectResourceIds?: number[]
  disconnectRewardIds?: number[]
  disconnectChatIds?: number[]
  disconnectCharacterIds?: number[]

  clearDirectLinks?: boolean
  clearDreams?: boolean
  clearScenarios?: boolean
  clearReactions?: boolean
  clearButterflies?: boolean
  clearArtCollections?: boolean
  clearBots?: boolean
  clearComponents?: boolean
  clearMilestones?: boolean
  clearPitches?: boolean
  clearPrompts?: boolean
  clearResources?: boolean
  clearRewards?: boolean
  clearChats?: boolean
  clearCharacters?: boolean
}

type ListConnectionKey =
  | 'Bots'
  | 'Chats'
  | 'Characters'
  | 'Components'
  | 'Milestones'
  | 'Scenarios'
  | 'Dreams'
  | 'Reactions'
  | 'Pitches'
  | 'Prompts'
  | 'Rewards'
  | 'Resources'
  | 'ArtCollections'

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

function mergeIds(...groups: unknown[]): number[] {
  return [...new Set(groups.flatMap((group) => cleanIds(group)))]
}

function connectMany(ids: number[]) {
  return ids.length ? ids.map((id) => ({ id })) : undefined
}

function disconnectMany(ids: number[]) {
  return ids.length ? ids.map((id) => ({ id })) : undefined
}

function addListConnection(
  data: Prisma.ArtImageUpdateInput,
  key: ListConnectionKey,
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

function setOptionalSingleRelation(
  data: Prisma.ArtImageUpdateInput,
  key: 'User' | 'Server' | 'CheckpointResource',
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
      data.User = { disconnect: true }
      data.Server = { disconnect: true }
      data.CheckpointResource = { disconnect: true }
    }

    setOptionalSingleRelation(data, 'User', body.userId)
    setOptionalSingleRelation(data, 'Server', body.serverId)
    setOptionalSingleRelation(
      data,
      'CheckpointResource',
      body.checkpointResourceId,
    )

    addListConnection(
      data,
      'Bots',
      mergeIds(body.botIds, body.botId ? [body.botId] : []),
      cleanIds(body.disconnectBotIds),
      Boolean(body.clearBots),
    )

    addListConnection(
      data,
      'Components',
      mergeIds(body.componentIds, body.componentId ? [body.componentId] : []),
      cleanIds(body.disconnectComponentIds),
      Boolean(body.clearComponents),
    )

    addListConnection(
      data,
      'Milestones',
      mergeIds(body.milestoneIds, body.milestoneId ? [body.milestoneId] : []),
      cleanIds(body.disconnectMilestoneIds),
      Boolean(body.clearMilestones),
    )

    addListConnection(
      data,
      'Pitches',
      mergeIds(body.pitchIds, body.pitchId ? [body.pitchId] : []),
      cleanIds(body.disconnectPitchIds),
      Boolean(body.clearPitches),
    )

    addListConnection(
      data,
      'Prompts',
      mergeIds(body.promptIds, body.promptId ? [body.promptId] : []),
      cleanIds(body.disconnectPromptIds),
      Boolean(body.clearPrompts),
    )

    addListConnection(
      data,
      'Resources',
      mergeIds(body.resourceIds, body.resourceId ? [body.resourceId] : []),
      cleanIds(body.disconnectResourceIds),
      Boolean(body.clearResources),
    )

    addListConnection(
      data,
      'Rewards',
      mergeIds(body.rewardIds, body.rewardId ? [body.rewardId] : []),
      cleanIds(body.disconnectRewardIds),
      Boolean(body.clearRewards),
    )

    addListConnection(
      data,
      'Chats',
      mergeIds(body.chatIds, body.chatId ? [body.chatId] : []),
      cleanIds(body.disconnectChatIds),
      Boolean(body.clearChats),
    )

    addListConnection(
      data,
      'Characters',
      mergeIds(body.characterIds, body.characterId ? [body.characterId] : []),
      cleanIds(body.disconnectCharacterIds),
      Boolean(body.clearCharacters),
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
      'ArtCollections',
      cleanIds(body.artCollectionIds),
      cleanIds(body.disconnectArtCollectionIds),
      Boolean(body.clearArtCollections),
    )

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
