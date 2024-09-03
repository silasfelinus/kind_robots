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
  galleryId?: number 
  path?: string
  prompt: string 
  promptId?: number
  userId?: number 
  username: string
  pitchId?: number 
  title?: string 
  description?: string
  pitch?: string
  isMature?: boolean 
  isPublic?: boolean 
  designer?: string
  flavorText?: string
  highlightImage?: string
  PitchType: PitchType

  playerName?: string
  galleryName?: string // to make gallery if no galleryId


  playerId?: number

}

type validatedData = {
  title?: string
  prompt: string
  description?: string
  flavorText?: string
  userId?: number
  promptId?: number
  pitch?: string
  pitchId?: number
  channelId?: number
  galleryId?: number
  designer?: string
  channelName?: string
  userName?: string
  playerName?: string
  pitchName?: string
  galleryName?: string
  isMature?: boolean
  isPublic?: boolean
  highlightImage?: string
}

async function validateAndLoadUserId(
  data: RequestData,
  validatedData: Partial<validatedData>,
): Promise<number> {
  console.log('🔍 Validating and loading User ID...')

  // If neither userName nor userId is provided, return 0
  if (!data.username && !data.userId) {
    console.warn('No userName or userId provided.')
    return 0
  }

  // If userName is provided, upsert the user using userName as a unique identifier
  if (data.username) {
    const user = await prisma.user.upsert({
      where: { username: data.username }, // Ensure 'username' is marked as unique in your Prisma schema
      update: {},
      create: {
        username: data.username,
        createdAt: new Date(), // Set the creation timestamp
        Role: 'USER', // Assuming 'USER' is a default role, replace with appropriate enum or value
      },
    })
    validatedData.userName = user.username
    return user.id
  }

  // If userId is provided but userName is not, simply return the userId
  if (data.userId) {
    return data.userId
  }

  // If we reach this point, something went wrong
  return 0
}

async function validateAndLoadPromptId(data: RequestData): Promise<number> {
  console.log('🔍 Validating and loading Prompt ID...')

  // Check if prompt is provided
  if (!data.prompt) {
    console.warn('No prompt provided.')
    throw new Error('Something went wrong')
  }

  // Check if an Prompt with the given prompt already exists
  const existingPrompt = await prisma.prompt.findFirst({
    where: { prompt: data.prompt },
  })

  if (existingPrompt) {
    return existingPrompt.id // Return the existing promptId
  } else {
    // Create a new Prompt using "prompt"
    const newPrompt = await prisma.prompt.create({
      data: {
        prompt: data.prompt,
        userId: data.userId ?? 0, // Default to 0 if not provided
        galleryId: data.galleryId ?? 0, // Default to 0 if not provided
        pitch: data.title,
        pitchId: data.pitchId ?? 0, // Default to 0 if not provided
        createdAt: new Date(), // Add a creation timestamp
        updatedAt: new Date(), // Add an updated timestamp
      },
    })
    return newPrompt.id // Return the new promptId
  }
}

async function validateAndLoadPitchId(data: RequestData): Promise<number> {
  console.log('🔍 Validating and loading pitch ID...')

  // If pitchId is provided, return it immediately
  if (data.pitchId) {
    return data.pitchId
  }

  try {
    if (!data.pitch && !data.pitchId) {
      console.warn('No pitch title or pitchId provided.')
      return 0
    }

    if (data.pitch) {
      const existingPitch = await prisma.pitch.findUnique({
        where: { pitch: data.pitch },
      })

      if (existingPitch) {
        return existingPitch.id
      }

      const newPitch = await prisma.pitch.create({
        data: {
          title: data.title || 'Untitled', // Provide a default title if none is provided
          pitch: data.pitch || 'No details provided.', // Provide a default pitch content
          userId: data.userId || 0, // Default to 0 if not provided
          playerId: data.playerId || null, // Default to 0 if not provided
          isPublic: data.isPublic || true, // Default to true if not provided
          isMature: data.isMature || false, // Default to false if not provided
          flavorText: data.flavorText || '', // Optional, empty string as default
          highlightImage: data.highlightImage || '', // Optional, empty string as default
          PitchType: data.PitchType || 'ARTPITCH', // Default to 'ARTPITCH' if not provided
        },
      })

      return newPitch.id
    }

    return data.pitchId ?? 0
  } catch (error) {
    console.error('Error validating and loading pitch ID:', error)
    return 0 // You can't return errorHandler here as it doesn't return a number
  }
}


async function validateAndLoadGalleryId(data: RequestData): Promise<number> {
  console.log('🔍 Validating and loading gallery ID...')

  if (data.galleryId === undefined) {
    const galleryName = data.galleryName ?? 'cafefred'

    // Try to find an existing Gallery by name
    const existingGallery = await prisma.gallery.findFirst({
      where: { name: galleryName },
    })

    if (existingGallery) {
      // If gallery exists, return its ID
      return existingGallery.id
    } else {
      // If gallery doesn't exist, create a new one with required fields
      const newGallery = await prisma.gallery.create({
        data: {
          name: galleryName,
          createdAt: new Date(), // Set to the current timestamp
          content: '', // Provide a default value for content, could be an empty string or placeholder
        },
      })
      return newGallery.id
    }
  }
  return data.galleryId ?? 21
}

function validateAndLoadDesignerName(data: RequestData): string {
  console.log('🔍 Validating and loading designer name...')

  return data.designer ?? data.username ?? generateSillyName() ?? 'Kind Guest'
}

export default defineEventHandler(async (event) => {
  try {
    console.log('🌟 Event triggered! Reading request body...')
    const requestData: RequestData = await readBody(event)
    console.log('📬 Request data received:', requestData)

    console.log('🔐 Initializing validated data object...')
    const validatedData: Partial<validatedData> = {}

    // Validate and load each field, updating the validatedData object
    validatedData.userId = await validateAndLoadUserId(requestData, validatedData)
    validatedData.promptId = await validateAndLoadPromptId(requestData)
    validatedData.pitchId = await validateAndLoadPitchId(requestData)
    validatedData.galleryId = await validateAndLoadGalleryId(requestData)
    validatedData.designer = validateAndLoadDesignerName(requestData)

    console.log('🎉 All validations passed! Generating image...')
    const response: GenerateImageResponse = await generateImage(requestData.prompt, validatedData.designer!)
    console.log('🖼 Image generated! Response:', response)

    if (!response || !response.images?.length) {
      throw new Error(`Image generation failed: ${response?.error || 'No images generated.'}`)
    }

    const base64Image = response.images[0]
    let imagePath = await saveImage(base64Image, 'cafefred')

    if (imagePath.startsWith('/public') || imagePath.startsWith('public')) {
      imagePath = imagePath.replace(/^\/?public/, '')
    }

    console.log('🎨 Creating new Art entry...')
    const newArt = await prisma.art.create({
      data: {
        path: imagePath,
        prompt: requestData.prompt,
        pitchId: validatedData.pitchId,
        userId: validatedData.userId,
        galleryId: validatedData.galleryId || 21,
        promptId: validatedData.promptId,
        pitch: requestData.pitch,
        isMature: requestData.isMature,
        isPublic: requestData.isPublic,
        channelId: validatedData.channelId,
        designer: validatedData.designer,
      },
    })

    return { success: true, newArt }
  } catch (error: unknown) {
    console.error('Art Generation Error:', error)
    return errorHandler({
      error,
      context: `Art Generation - Prompt: ${event.req.url}`,
    })
  }
})

export async function generateImage(
  prompt: string,
  user: string,
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
      throw new Error(`Fetch failed: ${response.status} ${response.statusText}`)
    }

    const responseData = await response.json()
    const generatedImageUrl = responseData.images // Assuming the images field contains the URL
    console.log('📷 Image generation complete!')
    return generatedImageUrl
  } catch (error: unknown) {
    throw errorHandler({ error, context: 'Image Generation with Cafe Fred' })
  }
}
