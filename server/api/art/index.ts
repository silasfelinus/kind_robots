// ~/server/api/art/index.ts
import { createError } from 'h3'
import prisma from '../../utils/prisma'
import { generateSillyName } from './../../../utils/useRandomName'

export type RequestData = {
  path?: string | null
  cfg?: number | null
  cfgHalf?: boolean
  checkpoint?: string
  sampler?: string | null
  seed?: number | undefined
  steps?: number | null
  designer?: string | null
  title?: string | null
  description?: string | null
  flavorText?: string | null
  highlightImage?: string | null
  isMature?: boolean
  isPublic?: boolean
  promptString: string
  negativePrompt?: string
  promptId?: number | null
  userId?: number | null
  username?: string | null
  pitch?: string | null
  playerId?: number | null
  playerName?: string | null
  dreamId?: number | null
  dreamIds?: number[] | null
  artCollectionId?: number | null
  artCollectionLabel?: string | null
  collectionLabel?: string | null
  collection?: string | null
}

function cleanPositiveId(value: unknown): number | null {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null
}

function cleanPositiveIds(values: unknown): number[] {
  if (!Array.isArray(values)) return []

  return [...new Set(values)]
    .map((value) => Number(value))
    .filter((value) => Number.isInteger(value) && value > 0)
}

export async function validateAndLoadUserId(
  data: RequestData,
  validatedData: Partial<RequestData>,
): Promise<number> {
  if (!data.username && !data.userId) return 10

  try {
    if (data.username) {
      const user = await prisma.user.upsert({
        where: { username: data.username },
        update: {},
        create: {
          username: data.username,
          Role: 'USER',
        },
      })

      validatedData.username = user.username
      return user.id
    }

    if (data.userId) return data.userId
  } catch (error) {
    console.error('Error loading user:', error)
    throw createError({
      statusCode: 400,
      message: 'User validation failed.',
    })
  }

  return 10
}

export async function validateAndLoadDreamIds(
  data: RequestData,
): Promise<number[]> {
  const ids = [
    ...cleanPositiveIds(data.dreamIds),
    ...(cleanPositiveId(data.dreamId) ? [cleanPositiveId(data.dreamId) as number] : []),
  ]

  const uniqueIds = [...new Set(ids)]

  if (!uniqueIds.length) return []

  const existingDreams = await prisma.dream.findMany({
    where: {
      id: {
        in: uniqueIds,
      },
    },
    select: {
      id: true,
    },
  })

  const existingIds = new Set(existingDreams.map((dream) => dream.id))
  const missingIds = uniqueIds.filter((id) => !existingIds.has(id))

  if (missingIds.length) {
    throw createError({
      statusCode: 400,
      message: `Invalid dreamId(s): ${missingIds.join(', ')}. Dream does not exist.`,
    })
  }

  return uniqueIds
}

export async function validateAndLoadPromptId(
  data: RequestData,
  validatedData: Partial<RequestData>,
): Promise<number> {
  const promptString = data.promptString?.trim()

  if (!promptString) {
    throw createError({
      statusCode: 400,
      message: 'Prompt validation failed.',
    })
  }

  try {
    const existingPrompt = await prisma.prompt.findFirst({
      where: { prompt: promptString },
    })

    if (existingPrompt) return existingPrompt.id

    const newPrompt = await prisma.prompt.create({
      data: {
        prompt: promptString,
        artPrompt: promptString,
        userId: validatedData.userId || data.userId || 10,
        isMature: data.isMature ?? false,
        isPublic: data.isPublic ?? true,
      },
    })

    return newPrompt.id
  } catch (error) {
    console.error('Error loading prompt:', error)
    throw createError({
      statusCode: 400,
      message: 'Prompt validation failed.',
    })
  }
}

export async function validateAndLoadArtCollectionId(
  data: RequestData,
): Promise<number | null> {
  if (data.artCollectionId) {
    const existingCollection = await prisma.artCollection.findUnique({
      where: { id: data.artCollectionId },
    })

    if (!existingCollection) {
      throw createError({
        statusCode: 400,
        message: `Invalid artCollectionId: ${data.artCollectionId}. ArtCollection does not exist.`,
      })
    }

    return data.artCollectionId
  }

  const label =
    data.artCollectionLabel?.trim() ||
    data.collectionLabel?.trim() ||
    data.collection?.trim()

  if (!label) return null

  const userId = data.userId || 10

  const existingCollection = await prisma.artCollection.findFirst({
    where: {
      label,
      userId,
    },
  })

  if (existingCollection) return existingCollection.id

  const newCollection = await prisma.artCollection.create({
    data: {
      label,
      userId,
      isMature: data.isMature ?? false,
      isPublic: data.isPublic ?? true,
      artPrompt: data.promptString || null,
    },
  })

  return newCollection.id
}

export function validateAndLoadDesignerName(data: RequestData): string {
  return data.designer ?? data.username ?? generateSillyName() ?? 'Kind Guest'
}
