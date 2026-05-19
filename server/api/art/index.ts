// ~/server/api/art/index.ts
import { createError } from 'h3'
import prisma from '../../utils/prisma'
import { generateSillyName } from './../../../utils/useRandomName'
import type { PitchType } from '~/prisma/generated/prisma/client'

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
  PitchType?: PitchType | null
  isMature?: boolean
  isPublic?: boolean
  promptString: string
  negativePrompt?: string
  promptId?: number | null
  userId?: number | null
  username?: string | null
  pitchId?: number | null
  pitch?: string | null
  playerId?: number | null
  playerName?: string | null
  artCollectionId?: number | null
  artCollectionLabel?: string | null
  collectionLabel?: string | null
  collection?: string | null
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

export async function validateAndLoadPitchId(
  data: RequestData,
): Promise<number | null> {
  if (data.pitchId) {
    const existingPitch = await prisma.pitch.findUnique({
      where: { id: data.pitchId },
    })

    if (!existingPitch) {
      throw createError({
        statusCode: 400,
        message: `Invalid pitchId: ${data.pitchId}. Pitch does not exist.`,
      })
    }

    return data.pitchId
  }

  const pitchText = data.pitch?.trim()

  if (!pitchText) return null

  const existingPitch = await prisma.pitch.findFirst({
    where: { pitch: pitchText },
  })

  if (existingPitch) return existingPitch.id

  const newPitch = await prisma.pitch.create({
    data: {
      title: data.title || pitchText.slice(0, 80) || 'Untitled Pitch',
      pitch: pitchText,
      designer: data.designer,
      flavorText: data.flavorText || '',
      highlightImage: data.highlightImage || '',
      PitchType: data.PitchType || 'ARTPITCH',
      isMature: data.isMature || false,
      isPublic: data.isPublic ?? true,
      userId: data.userId || null,
    },
  })

  return newPitch.id
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

    if (existingPrompt) {
      if (data.pitchId) {
        await prisma.prompt.update({
          where: { id: existingPrompt.id },
          data: {
            Pitch: {
              connect: { id: data.pitchId },
            },
          },
        })
      }

      return existingPrompt.id
    }

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
