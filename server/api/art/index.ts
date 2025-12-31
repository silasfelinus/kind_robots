// ~/server/api/art/index.ts
import prisma from '../../utils/prisma'
import { generateSillyName } from './../../../utils/useRandomName'
import type { PitchType } from '~/server/generated/prisma'

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
  PitchType: PitchType | null
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
  galleryId?: number | null
  galleryName?: string | null
}

export async function validateAndLoadUserId(
  data: RequestData,
  validatedData: Partial<RequestData>,
): Promise<number> {
  console.log('🔍 Validating and loading User ID...')
  if (!data.username && !data.userId) {
    console.warn('No userName or userId provided.')
    return 0
  }

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

    if (data.userId) {
      return data.userId
    }
  } catch (error) {
    console.error('Error loading user:', error)
    throw new Error('User validation failed.')
  }

  return 0
}

export async function validateAndLoadPromptId(
  data: RequestData,
  validatedData: Partial<RequestData>,
): Promise<number> {
  console.log('🔍 Validating and loading Prompt ID...')

  if (!data.promptString) {
    console.warn('No prompt provided.')
    throw new Error('Prompt validation failed.')
  }

  try {
    const existingPrompt = await prisma.prompt.findFirst({
      where: { prompt: data.promptString },
    })

    if (existingPrompt) {
      return existingPrompt.id
    } else {
      const newPrompt = await prisma.prompt.create({
        data: {
          prompt: data.promptString,
          userId: validatedData.userId || 10,
          galleryId: data.galleryId ?? 21,
          pitchId: data.pitchId ?? null,
        },
      })
      return newPrompt.id
    }
  } catch (error) {
    console.error('Error loading prompt:', error)
    throw new Error('Prompt validation failed.')
  }
}

export async function validateAndLoadPitchId(
  data: RequestData,
): Promise<number | null> {
  const start = Date.now()
  console.log(`[⏱️ ${start}] 🔍 Begin validateAndLoadPitchId()`)

  if (data.pitchId) {
    console.log(`[⏱️ ${Date.now()}] ⌛ Checking pitchId: ${data.pitchId}`)
    const existingPitch = await prisma.pitch.findUnique({
      where: { id: data.pitchId },
    })
    console.log(`[⏱️ ${Date.now()}] ✅ pitchId lookup complete`)

    if (!existingPitch) {
      console.warn(
        `[⛔ ${Date.now()}] ❌ Invalid pitchId: ${data.pitchId} does not exist`,
      )
      throw createError({
        statusCode: 400,
        message: `Invalid pitchId: ${data.pitchId}. Pitch does not exist.`,
      })
    }
    console.log(`[✅ ${Date.now()}] Returning pitchId: ${data.pitchId}`)
    return data.pitchId
  }

  if (data.pitch) {
    console.log(`[⏱️ ${Date.now()}] 🔍 Searching for pitch text match`)
    const existingPitch = await prisma.pitch.findFirst({
      where: { pitch: data.pitch },
    })

    if (existingPitch) {
      console.log(
        `[✅ ${Date.now()}] Reused existing pitch ID: ${existingPitch.id}`,
      )
      return existingPitch.id
    }

    console.log(`[🛠️ ${Date.now()}] Creating new pitch...`)
    const newPitch = await prisma.pitch.create({
      data: {
        title: data.title || 'Untitled',
        pitch: data.pitch,
        designer: data.designer,
        flavorText: data.flavorText || '',
        highlightImage: data.highlightImage || '',
        PitchType: data.PitchType || 'ARTPITCH',
        isMature: data.isMature || false,
        isPublic: data.isPublic ?? true,
        userId: data.userId || null,
      },
    })

    console.log(`[✅ ${Date.now()}] New pitch created with ID: ${newPitch.id}`)
    return newPitch.id
  }

  console.log(`[⚠️ ${Date.now()}] No pitch or pitchId provided.`)
  return null
}

export async function validateAndLoadGalleryId(
  data: RequestData,
): Promise<number> {
  console.log('🔍 Validating and loading gallery ID...')

  try {
    if (data.galleryId === undefined) {
      const galleryName = data.galleryName ?? 'cafefred'

      const existingGallery = await prisma.gallery.findFirst({
        where: { name: galleryName },
      })

      if (existingGallery) {
        return existingGallery.id
      } else {
        const newGallery = await prisma.gallery.create({
          data: {
            name: galleryName,
            content: '',
            userId: data.userId || null,
            isMature: data.isMature || false,
            isPublic: data.isPublic || true,
          },
        })
        return newGallery.id
      }
    }

    return data.galleryId ?? 21
  } catch (error) {
    console.error('Error loading gallery:', error)
    throw new Error('Gallery validation failed.')
  }
}

export function validateAndLoadDesignerName(data: RequestData): string {
  console.log('🔍 Validating and loading designer name...')
  return data.designer ?? data.username ?? generateSillyName() ?? 'Kind Guest'
}
