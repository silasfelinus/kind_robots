// server/api/art/image/index.post.ts

import { defineEventHandler, readBody, createError } from 'h3'
import prisma from '../utils/prisma'
import { errorHandler } from '../utils/error'
import { generateSillyName } from './../../../utils/useRandomName'
import { saveImage } from './../../../server/api/utils/saveImage'
import type { Art, PitchType } from '@prisma/client'

type GenerateImageResponse = {
  images: string[]
  error?: string
}

type RequestData = {
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

export default defineEventHandler(async (event) => {
  let imageId: number | null = null
  let newArt: Art | null = null

  try {
    const requestData: RequestData = await readBody(event)

    // Validate required fields
    if (!requestData.promptString) {
      throw createError({
        statusCode: 400,
        message: 'Missing required field: "promptString".',
      })
    }

    // Authorization check
    const authorizationHeader = event.node.req.headers['authorization']
    if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
      throw createError({
        statusCode: 401,
        message: 'Authorization token required in the format "Bearer <token>".',
      })
    }

    const token = authorizationHeader.split(' ')[1]
    const user = await prisma.user.findFirst({
      where: { apiKey: token },
      select: { id: true, karma: true },
    })

    if (!user) {
      throw createError({
        statusCode: 401,
        message: 'Invalid or expired authorization token.',
      })
    }

    if (user.id !== requestData.userId) {
      throw createError({
        statusCode: 403,
        message:
          'User ID in the request does not match the authenticated user.',
      })
    }

    if (user.karma <= 0) {
      throw createError({
        statusCode: 403,
        message: 'Insufficient karma to generate an image.',
      })
    }

    // Validate and load additional required data
    const validatedData: Partial<RequestData> = {}
    validatedData.userId = await validateAndLoadUserId(
      requestData,
      validatedData,
    )
    validatedData.promptId = await validateAndLoadPromptId(
      requestData,
      validatedData,
    )
    validatedData.pitchId = await validateAndLoadPitchId(requestData)
    validatedData.galleryId = await validateAndLoadGalleryId(requestData)
    validatedData.designer = validateAndLoadDesignerName(requestData)

    const cfgValue = calculateCfg(
      requestData.cfg ?? 3,
      requestData.cfgHalf ?? false,
    )

    // Generate the image
    const response: GenerateImageResponse = await generateImage(
      requestData.promptString,
      validatedData.designer || 'kindguest',
      cfgValue || 3,
      requestData.seed || -1,
      requestData.steps || 20,
    )

    if (!response.images?.length) {
      throw createError({
        statusCode: 500,
        message: `Image generation failed: ${response.error || 'No images generated.'}`,
      })
    }

    // Save the generated image
    const base64Image = response.images[0]
    const savedImage = await saveImage(
      base64Image,
      requestData.galleryName || 'cafefred',
      validatedData.userId,
      validatedData.galleryId,
    )

    imageId = savedImage.id
    if (!imageId) {
      throw createError({
        statusCode: 500,
        message: 'Failed to save generated image.',
      })
    }

    // Create a new art entry linked to the image
    newArt = await prisma.art.create({
      data: {
        path: savedImage.fileName,
        cfg: requestData.cfg,
        cfgHalf: requestData.cfgHalf,
        checkpoint: requestData.checkpoint,
        sampler: requestData.sampler,
        seed: requestData.seed,
        steps: requestData.steps,
        designer: validatedData.designer,
        promptString: requestData.promptString,
        isPublic: requestData.isPublic,
        isMature: requestData.isMature,
        userId: validatedData.userId,
        promptId: validatedData.promptId,
        pitchId: validatedData.pitchId,
        galleryId: validatedData.galleryId,
        artImageId: imageId,
      },
    })

    await prisma.artImage.update({
      where: { id: imageId },
      data: { artId: newArt.id },
    })
    await prisma.user.update({
      where: { id: user.id },
      data: { karma: user.karma - 1 },
    })

    event.node.res.statusCode = 201
    return {
      success: true,
      message: 'Art and image saved successfully!',
      data: {
        newArt,
        imageId,
      },
    }
  } catch (error) {
    const handledError = errorHandler(error)
    event.node.res.statusCode = handledError.statusCode || 500
    return {
      success: false,
      message: handledError.message || 'Failed to create new art.',
    }
  }
})

async function validateAndLoadUserId(
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

async function validateAndLoadPromptId(
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

async function validateAndLoadPitchId(
  data: RequestData,
): Promise<number | null> {
  console.log('🔍 Validating and loading pitch ID...')

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

  if (data.pitch) {
    const existingPitch = await prisma.pitch.findFirst({
      where: { pitch: data.pitch },
    })
    if (existingPitch) {
      console.log(`✅ Existing pitch found: ${existingPitch.id}`)
      return existingPitch.id
    } else {
      const newPitch = await prisma.pitch.create({
        data: {
          title: data.title || 'Untitled',
          pitch: data.pitch,
          designer: data.designer,
          flavorText: data.flavorText || '',
          highlightImage: data.highlightImage || '',
          PitchType: data.PitchType || 'ARTPITCH',
          isMature: data.isMature || false,
          isPublic: data.isPublic || true,
          userId: data.userId || null,
        },
      })
      console.log(`✅ New pitch created: ${newPitch.id}`)
      return newPitch.id
    }
  }

  return null
}

async function validateAndLoadGalleryId(data: RequestData): Promise<number> {
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

function validateAndLoadDesignerName(data: RequestData): string {
  console.log('🔍 Validating and loading designer name...')
  return data.designer ?? data.username ?? generateSillyName() ?? 'Kind Guest'
}

export async function generateImage(
  prompt: string,
  user: string,
  cfgValue: number,
  seed?: number,
  steps?: number,
): Promise<{ images: string[] }> {
  console.log('📸 Starting image generation...')
  const config = {
    headers: { 'Content-Type': 'application/json' },
  }

  const requestBody = {
    prompt,
    n: 1,
    size: '256x256',
    response_format: 'url',
    user,
    cfg_scale: cfgValue,
    seed: seed || -1,
    steps: steps || 20,
  }

  try {
    const response = await fetch(
      'https://lola.acrocatranch.com/sdapi/v1/txt2img',
      {
        method: 'POST',
        headers: config.headers,
        body: JSON.stringify(requestBody),
      },
    )

    if (!response.ok) {
      console.error(`Image generation failed: ${response.statusText}`)
      throw new Error(
        `Image generation failed: ${response.status} ${response.statusText}`,
      )
    }

    const responseData = await response.json()
    return { images: responseData.images }
  } catch (error) {
    console.error('Error during image generation:', error)
    throw new Error('Image generation failed.')
  }
}

function calculateCfg(cfg: number, cfgHalf: boolean): number {
  return cfgHalf ? cfg + 0.5 : cfg
}
