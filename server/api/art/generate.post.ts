import { defineEventHandler, readBody } from 'h3'
import { errorHandler } from '../utils/error'
import prisma from '../utils/prisma'
import { generateSillyName } from './../../../utils/useRandomName'
import { saveImage } from './../../../server/api/utils/saveImage'
import type { PitchType } from '@prisma/client'

console.log(
  "🚀 Starting up the art generation engine! Let's create something amazing!",
)

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
  channelId?: number | null
  channelName?: string | null
}

export default defineEventHandler(async (event) => {
  let imageId: number | null = null
  let newArt: Art | null = null

  try {
    console.log('🌟 Event triggered! Reading request body...')
    const requestData: RequestData = await readBody(event)

    // Debugging: Print out request data to verify pitchName
    console.log('📬 Request data received:', requestData)

    if (!requestData.promptString) {
      throw new Error('Missing prompt in request data.')
    }

    // Validate user, prompt, and pitch
    const validatedData: Partial<RequestData> = {}

    validatedData.userId = await validateAndLoadUserId(
      requestData,
      validatedData,
    )
    if (!validatedData.userId) {
      throw new Error('User validation failed.')
    }

    validatedData.promptId = await validateAndLoadPromptId(
      requestData,
      validatedData,
    )
    if (!validatedData.promptId) {
      throw new Error('Prompt validation failed.')
    }

    validatedData.pitchId = await validateAndLoadPitchId(requestData)
    if (!validatedData.pitchId) {
      throw new Error('Pitch validation failed.')
    }

    validatedData.galleryId = await validateAndLoadGalleryId(requestData)
    validatedData.designer = validateAndLoadDesignerName(requestData)

    // Calculate the final cfg value programmatically
    const cfgValue = calculateCfg(
      requestData.cfg ?? 3,
      requestData.cfgHalf ?? false,
    )

    console.log('🎉 All validations passed! Generating image...')
    console.log('Sending steps:', requestData.steps)

    // Generate Image Using Modeler
    const response: GenerateImageResponse = await generateImage(
      requestData.promptString,
      validatedData.designer || 'kindguest',
      cfgValue || 3,
      requestData.seed || -1,
      requestData.steps || 20,
    )

    if (!response || !response.images?.length) {
      throw new Error(
        `Image generation failed: ${response?.error || 'No images generated.'}`,
      )
    }

    console.log('🖼 Image generated! Response:', response)

    // Save Generated Image to the database
    const base64Image = response.images[0]
    const savedImage = await saveImage(
      base64Image,
      requestData.galleryName || 'cafefred',
      validatedData.userId,
      validatedData.galleryId,
    )

    imageId = savedImage.id // Save the imageId for later use
    if (!imageId) {
      throw new Error('Failed to save generated image.')
    }

    console.log('📁 Image saved successfully with imageId:', imageId)

    // Create Art Entry in Database and link the imageId
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
        hasArtImage: true,
        artImageId: imageId,
      },
    })

    console.log('🎉 Art entry created successfully:', newArt)

    // Link the artId back to the artImage
    const updatedArtImage = await prisma.artImage.update({
      where: { id: imageId },
      data: { artId: newArt.id },
    })

    console.log(
      `🔗 Successfully linked artId ${newArt.id} to artImage ${updatedArtImage.id}`,
    )

    // Return success response
    return {
      success: true,
      message: 'Art and image saved successfully!',
      art: newArt,
      artId: newArt.id,
      imageId: imageId,
      artImage: updatedArtImage || null,
    }
  } catch (error) {
    console.error('Art Generation Error:', error)
    return errorHandler({
      error,
      context: `Art Generation - Prompt: ${event.req.url}`,
    })
  } finally {
    // This block executes regardless of success or failure
    console.log('🎬 Art generation process completed.')
    if (imageId) {
      console.log(`Image ID ${imageId} has been processed.`)
    }
    if (newArt) {
      console.log(`Art ID ${newArt.id} has been created.`)
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
          userId: validatedData.userId || 10, // Use validated userId
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

async function validateAndLoadPitchId(data: RequestData): Promise<number> {
  console.log('🔍 Validating and loading pitch ID...')

  // If pitchId is provided, use it
  if (data.pitchId) {
    console.log(`✅ Pitch ID provided: ${data.pitchId}`)
    return data.pitchId
  }

  // If pitchName is provided, try to find it or create a new one
  if (data.pitch) {
    try {
      // Check if the pitch already exists by name
      const existingPitch = await prisma.pitch.findUnique({
        where: { pitch: data.pitch },
      })

      if (existingPitch) {
        console.log(`✅ Existing pitch found: ${existingPitch.id}`)
        return existingPitch.id
      }

      // If no existing pitch is found, create a new one
      console.log('🔨 Creating a new pitch...')
      const newPitch = await prisma.pitch.create({
        data: {
          title: data.title || 'Untitled', // Fallback to 'Untitled' if no title is provided
          pitch: data.pitch, // Use provided pitchName
          designer: data.designer,
          flavorText: data.flavorText || '',
          highlightImage: data.highlightImage || '',
          PitchType: data.PitchType || 'ARTPITCH',
          isMature: data.isMature || false,
          isPublic: data.isPublic || true,
          userId: data.userId || null,
          channelId: data.channelId || null,
        },
      })

      console.log(`✅ New pitch created: ${newPitch.id}`)
      return newPitch.id
    } catch (error) {
      console.error('Error loading or creating pitch:', error)
      throw new Error('Pitch validation failed.')
    }
  }

  // If neither pitchId nor pitchName is provided, return 0
  console.warn('No pitchId or pitchName provided.')
  return 0
}

async function validateAndLoadGalleryId(data: RequestData): Promise<number> {
  console.log('🔍 Validating and loading gallery ID...')

  try {
    if (data.galleryId === undefined) {
      const galleryName = data.galleryName ?? 'cafefred'

      const existingGallery = await prisma.gallery.findUnique({
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
    headers: {
      'Content-Type': 'application/json',
    },
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
  console.log('🚀 Image generation payload:', requestBody)

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
    console.log('📷 Image generation complete:', responseData)

    return { images: responseData.images }
  } catch (error) {
    console.error('Error during image generation:', error)
    throw new Error('Image generation failed.')
  }
}

function calculateCfg(cfg: number, cfgHalf: boolean): number {
  return cfgHalf ? cfg + 0.5 : cfg
}
