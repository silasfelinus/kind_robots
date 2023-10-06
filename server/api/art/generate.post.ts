import { defineEventHandler, readBody } from 'h3'
import { Art, ArtPrompt, Pitch, Channel, Gallery } from '@prisma/client'
import { errorHandler } from '../utils/error'
import prisma from '../utils/prisma'
import { createUser } from '../users'
import { generateSillyName } from '@/utils/useRandomName'
import { saveImage } from '@/server/api/utils/saveImage'

console.log("🚀 Starting up the art generation engine! Let's create something amazing!")

type GenerateImageResponse = {
  images: string[]
  error?: string
}
type RequestData = {
  title?: string // if we need to make a pitch
  prompt: string // the art prompt, very important
  description?: string
  flavorText?: string
  userId?: number // 0 if username is not given.
  promptId?: number // may have already been made, otherwise, we make one using "prompt"
  pitchId?: number // if doesn't exist, make if given "pitchName"
  channelId?: number // make if not existing using channelLabel
  galleryId?: number // if not given, make with galleryName (or use 21)
  designerName?: string // same as username if not given, or generate a random name
  channelName?: string // to make channel if channel is not given
  userName?: string // to make a user if userId is not given
  pitchName?: string // to make pitch if pitchId is not given
  galleryName?: string // to make gallery if no galleryId
  isMature?: boolean // for entry in multiple models
  isPublic?: boolean // for entry in multiple models
  isOrphan?: boolean // for entry in Art
}

type validatedData = {
  title: string
  prompt: string
  description: string
  flavorText: string
  userId: number
  promptId: number
  pitchId: number
  channelId: number
  galleryId: number
  designerName: string
  channelName: string
  userName: string
  pitchName: string
  galleryName: string
  isMature: boolean
  isPublic: boolean
  isOrphan: boolean
}

console.log('🎨 Types are all set! Moving on to validation functions.')

// Update your validation functions to also accept the validatedData object
async function validateAndLoadUserId(
  data: RequestData,
  validatedData: Partial<validatedData>
): Promise<number> {
  console.log('🔍 Validating and loading User ID...')

  if (data.userId === undefined && data.userName) {
    // Create a new user with userName
    const newUser = await createUser({ username: data.userName })
    validatedData.userName = data.userName // Update the userName in validatedData
    return newUser.user?.id || 0
  }
  return data.userId ?? 0
}

async function validateAndLoadPromptId(
  data: RequestData,
  validatedData: Partial<validatedData>
): Promise<number> {
  console.log('🔍 Validating and loading Prompt ID...')

  if (data.promptId === undefined) {
    // Create a new ArtPrompt using "prompt"
    const newPrompt = await prisma.artPrompt.create({ data: { prompt: data.prompt } })
    return newPrompt.id
  }
  return data.promptId
}

async function validateAndLoadPitchId(
  data: RequestData,
  validatedData: Partial<validatedData>
): Promise<number> {
  console.log('🔍 Validating and loading pitch ID...')

  // Check if a Pitch with the given pitchName (title) already exists
  const existingPitch = await prisma.pitch.findUnique({
    where: { title: data.pitchName }
  })

  if (existingPitch) {
    return existingPitch.id // Return the existing pitchId
  } else if (data.pitchName && data.designerName && data.title) {
    // Create a new Pitch using pitchName
    const newPitch = await prisma.pitch.create({
      data: {
        title: data.title,
        pitch: data.pitchName,
        designer: data.designerName,
        channelId: data.channelId,
        userId: data.userId,
        isOrphan: data.isOrphan,
        isPublic: data.isPublic,
        creatorId: data.userId,
        isNSFW: data.isMature
      }
    })
    return newPitch.id // Return the new pitchId
  }

  return data.pitchId ?? 0 // Return the provided pitchId or 0 if none is provided
}

async function validateAndLoadChannelId(
  data: RequestData,
  validatedData: Partial<validatedData>
): Promise<number> {
  console.log('🔍 Validating and loading channel ID...')

  if (data.channelId === undefined && data.channelName) {
    // Create a new Channel using channelName
    const newChannel = await prisma.channel.create({
      data: {
        label: data.channelName,
        title: data.title,
        pitchId: data.pitchId,
        description: data.description
      }
    })
    return newChannel.id
  }
  return data.channelId ?? 1
}

async function validateAndLoadGalleryId(
  data: RequestData,
  validatedData: Partial<validatedData>
): Promise<number> {
  console.log('🔍 Validating and loading gallery ID...')

  if (data.galleryId === undefined) {
    const galleryName = data.galleryName ?? 'cafefred'

    // Try to find an existing Gallery by name
    const existingGallery = await prisma.gallery.findFirst({
      where: { name: galleryName }
    })

    if (existingGallery) {
      // If gallery exists, return its ID
      return existingGallery.id
    } else {
      // If gallery doesn't exist, create a new one
      const newGallery = await prisma.gallery.create({ data: { name: galleryName } })
      return newGallery.id
    }
  }
  return data.galleryId ?? 21
}

async function validateAndLoadDesignerName(
  data: RequestData,
  validatedData: Partial<validatedData>
): Promise<string> {
  console.log('🔍 Validating and loading designer name...')

  return data.designerName ?? data.userName ?? (generateSillyName() || 'Kind Guest')
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
    validatedData.promptId = await validateAndLoadPromptId(requestData, validatedData)
    validatedData.pitchId = await validateAndLoadPitchId(requestData, validatedData)
    validatedData.channelId = await validateAndLoadChannelId(requestData, validatedData)
    validatedData.galleryId = await validateAndLoadGalleryId(requestData, validatedData)
    validatedData.designerName = await validateAndLoadDesignerName(requestData, validatedData)

    console.log('🎉 All validations passed! Generating image...')
    const response: GenerateImageResponse = await generateImage(
      requestData.prompt,
      validatedData.designerName!
    )
    console.log('🖼 Image generated! Response:', response)

    // Declare base64Image variable here
    let base64Image: string

    // Validate the image generation response
    if (Array.isArray(response)) {
      if (!response.length) {
        throw new Error('No images were generated. Please validate the prompt and user.')
      }
      base64Image = response[0] // Directly assign the first element if response is an array
    } else {
      if (!response.images || !response.images.length) {
        if (response.error) {
          throw new Error(`Image generation failed due to: ${response.error}`)
        }
        throw new Error('No images were generated. Please validate the prompt and user.')
      }
      base64Image = response.images[0] // Use the first image from the images array if response is an object
    }
    // Save the image and get its path
    let imagePath = await saveImage(base64Image, 'cafefred')

    // Remove '/public' or 'public' prefix from imagePath
    if (imagePath.startsWith('/public') || imagePath.startsWith('public')) {
      imagePath = imagePath.replace(/^\/?public/, '')
    }

    console.log('🎨 Creating new Art entry...')

    // Create the new Art entry using Prisma
    const newArt = await prisma.art.create({
      data: {
        path: imagePath,
        prompt: validatedData.prompt,
        pitchId: validatedData.pitchId,
        userId: validatedData.userId,
        galleryId: validatedData.galleryId || 21,
        artPromptId: validatedData.promptId,
        pitch: requestData.pitch,
        isNsfw: requestData.isMature,
        isOrphan: requestData.isOrphan,
        isPublic: requestData.isPublic,
        channelId: validatedData.channelId
      }
    })

    return { success: true, newArt } // Return the result
  } catch (error: any) {
    console.error('Art Generation Error:', error)
    return errorHandler({
      error,
      context: `Art Generation - Prompt`
    })
  }
})

console.log('👏 All set! Ready for testing!')

export async function generateImage(prompt: string, user: string): Promise<{ images: string[] }> {
  console.log('📸 Starting image generation...')
  const config = {
    headers: {
      'Content-Type': 'application/json'
    }
  }

  const requestBody = {
    prompt,
    n: 1,
    size: '512x512',
    response_format: 'url',
    user
  }

  try {
    const response = await fetch('https://cafefred.purrsalon.com/sdapi/v1/txt2img', {
      method: 'POST',
      headers: config.headers,
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      throw new Error(`Fetch failed: ${response.status} ${response.statusText}`)
    }

    const responseData = await response.json()
    const generatedImageUrl = responseData.images // Assuming the images field contains the URL
    console.log('📷 Image generation complete!')
    return generatedImageUrl
  } catch (error: any) {
    throw errorHandler({ error, context: 'Image Generation with Cafe Fred' })
  }
}
