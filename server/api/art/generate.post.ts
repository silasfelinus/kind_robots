import { defineEventHandler, readBody } from 'h3'
import { Art, ArtPrompt, Pitch, Channel, Gallery } from '@prisma/client'
import { errorHandler } from '../utils/error'
import prisma from '../utils/prisma'

type GenerateImageResponse = {
  images: string[]
  error?: string
}
type RequestData = {
  prompt: string // the art prompt, very important
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

async function validateAndLoadUserId(data: RequestData): Promise<number> {
  if (data.userId === undefined && data.userName) {
    // Create a new user with userName
    const newUser = await prisma.user.create({ data: { name: data.userName } })
    return newUser.id
  }
  return data.userId ?? 0
}

async function validateAndLoadPromptId(data: RequestData): Promise<number> {
  if (data.promptId === undefined) {
    // Create a new ArtPrompt using "prompt"
    const newPrompt = await prisma.artPrompt.create({ data: { prompt: data.prompt } })
    return newPrompt.id
  }
  return data.promptId
}

async function validateAndLoadPitchId(data: RequestData): Promise<number> {
  if (data.pitchId === undefined && data.pitchName) {
    // Create a new Pitch using pitchName
    const newPitch = await prisma.pitch.create({ data: { name: data.pitchName } })
    return newPitch.id
  }
  return data.pitchId ?? 0
}

async function validateAndLoadChannelId(data: RequestData): Promise<number> {
  if (data.channelId === undefined && data.channelName) {
    // Create a new Channel using channelName
    const newChannel = await prisma.channel.create({ data: { name: data.channelName } })
    return newChannel.id
  }
  return data.channelId ?? 1
}

async function validateAndLoadGalleryId(data: RequestData): Promise<number> {
  if (data.galleryId === undefined) {
    const galleryName = data.galleryName ?? 'cafefred'
    // Create a new Gallery using galleryName
    const newGallery = await prisma.gallery.create({ data: { name: galleryName } })
    return newGallery.id
  }
  return data.galleryId ?? 21
}

async function validateAndLoadDesignerName(data: RequestData): Promise<string> {
  return data.designerName ?? data.userName ?? 'RandomName' // Replace 'RandomName' with a function that generates a random name
}

export default defineEventHandler(async (event) => {
  try {
    const requestData: RequestData = await readBody(event)

    const userId = await validateAndLoadUserId(requestData)
    const promptId = await validateAndLoadPromptId(requestData)
    const pitchId = await validateAndLoadPitchId(requestData)
    const channelId = await validateAndLoadChannelId(requestData)
    const galleryId = await validateAndLoadGalleryId(requestData)
    const designerName = await validateAndLoadDesignerName(requestData)

    // Call your utility function to generate and save the image
    const result = await generateAndSaveImage(prompt, username, galleryName, pitch)

    // Check if result is not undefined
    if (result) {
      return { success: result.success, newArt: result.newArt } // Return the result
    } else {
      throw new Error('Image generation and saving failed')
    }
  } catch (error: any) {
    console.error('Art Generation Error:', error)
    return errorHandler({ error, context: `Art Generation - Prompt: ${prompt}, User: ${username}` })
  }
})

// Function to create a new Art entry
export async function createArt(art: Partial<Art>): Promise<Art> {
  try {
    console.log('ART:', art)
    // Validate required fields
    if (!art.path || !art.galleryId || !art.pitch) {
      console.error('Validation Error: Path, pitch, and galleryId must be provided')
      throw new Error('Path and galleryId must be provided')
    }

    // Find or create ArtPrompt
    let artPromptData: ArtPromptCreateInput = {
      userId: art.userId || 0,
      prompt: art.prompt || '',
      galleryId: art.galleryId || 21,
      pitch: art.pitch
    }

    const newArtPrompt = await createArtPrompt(artPromptData)

    // Create the new Art entry using Prisma
    const newArt = await prisma.art.create({
      data: {
        path: art.path,
        prompt: art.prompt,
        pitch: art.pitch,
        userId: art.userId || 0,
        galleryId: art.galleryId || 21,
        artPromptId: newArtPrompt.id // Associate with ArtPrompt
      }
    })

    console.log('Art Created:', newArt)
    return newArt
  } catch (error: any) {
    console.error('Error in createArt:', error)
    throw errorHandler(error)
  }
}

export async function generateImage(prompt: string, user: string): Promise<{ images: string[] }> {
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

    return generatedImageUrl
  } catch (error: any) {
    throw errorHandler({ error, context: 'Image Generation with Cafe Fred' })
  }
}

export async function generateAndSaveImage(
  prompt: string,
  user: string,
  galleryName: string,
  pitch: string,
  isPublic?: boolean,
  isNSFW?: boolean
) {
  // Generate image with modeller
  const response: GenerateImageResponse = await generateImage(prompt, user)

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
  let imagePath = await saveImage(base64Image, galleryName)

  // Remove '/public' or 'public' prefix from imagePath
  if (imagePath.startsWith('/public') || imagePath.startsWith('public')) {
    imagePath = imagePath.replace(/^\/?public/, '')
  }

  console.log('Sanitized image path:', imagePath)
  // Attempt to fetch the gallery, create if not exists
  let gallery = await fetchGalleryByName(galleryName)
  if (!gallery) {
    console.log(`Creating new gallery: ${galleryName}`) // Logging the gallery creation
    gallery = await createGallery({ name: galleryName })
  }
  const userId = await fetchIdByUsername(user)

  // Look for a tag with label "pitch" and title = art.prompt
  let pitchTag = await prisma.tag.findFirst({
    where: {
      label: 'pitch',
      title: pitch
    }
  })

  // If the tag doesn't exist, create it
  if (!pitch) {
    pitch = await createPitch({
      label: 'pitch',
      title: pitch,
      userId
    })
  }

  // Get the pitchId from the tag
  const pitchId = pitchTag.id

  // Check if gallery is null before proceeding
  if (gallery) {
    // Store the generated art and return success
    const newArt = await createArt({
      path: imagePath,
      prompt,
      pitch,
      galleryId: gallery.id, // Now safe to access .id
      userId
    })

    return { success: true, newArt }
  }
}
