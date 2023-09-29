// /server/api/art/index.ts
import { Art } from '@prisma/client'
import prisma from '../utils/prisma'
import { errorHandler } from '../utils/error'
import { saveImage } from '../utils/saveImage'
import { fetchGalleryByName, createGallery } from '../galleries'
import { createArtPrompt, ArtPromptCreateInput } from './prompts'

// Function to create a new Art entry
export async function createArt(art: Partial<Art>): Promise<Art> {
  try {
    console.log('ART:', art)
    // Validate required fields
    if (!art.path || !art.galleryId) {
      console.error('Validation Error: Path and galleryId must be provided')
      throw new Error('Path and galleryId must be provided')
    }

    // Find or create ArtPrompt
    let artPromptData: ArtPromptCreateInput = {
      userId: art.userId || 0,
      prompt: art.prompt || '',
      galleryId: art.galleryId || 21
    }

    const newArtPrompt = await createArtPrompt(artPromptData)

    // Create the new Art entry using Prisma
    const newArt = await prisma.art.create({
      data: {
        path: art.path,
        prompt: art.prompt,
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

// Function to update an existing Art entry by ID
export async function updateArt(id: number, updatedArt: Partial<Art>): Promise<Art | null> {
  try {
    return await prisma.art.update({
      where: { id },
      data: updatedArt
    })
  } catch (error: any) {
    throw errorHandler(error)
  }
}

// Function to delete an Art entry by ID
export async function deleteArt(id: number): Promise<boolean> {
  try {
    const artExists = await prisma.art.findUnique({ where: { id } })

    if (!artExists) {
      return false
    }

    await prisma.art.delete({ where: { id } })
    return true
  } catch (error: any) {
    throw errorHandler(error)
  }
}

// Function to fetch all Art entries
export async function fetchAllArt(): Promise<Art[]> {
  return await prisma.art.findMany({
    include: {
      ArtReaction: {
        include: {
          Tags: true
        }
      }
    }
  })
}

// Function to fetch a single Art entry by ID
export async function fetchArtById(id: number): Promise<Art | null> {
  return await prisma.art.findUnique({
    where: { id }
  })
}

// Function to fetch Art entries by Gallery ID
export async function fetchArtByGalleryId(galleryId: number): Promise<Art[]> {
  return await prisma.art.findMany({
    where: { galleryId }
  })
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

type GenerateImageResponse = {
  images: string[]
  error?: string
}

export async function generateAndSaveImage(prompt: string, user: string, galleryName: string) {
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
  const imagePath = await saveImage(base64Image, galleryName)

  // Attempt to fetch the gallery, create if not exists
  let gallery = await fetchGalleryByName(galleryName)
  if (!gallery) {
    console.log(`Creating new gallery: ${galleryName}`) // Logging the gallery creation
    gallery = await createGallery({ name: galleryName })
  }
  console.log('imagepath', imagePath)

  // Check if gallery is null before proceeding
  if (gallery) {
    // Store the generated art and return success
    const newArt = await createArt({
      path: imagePath,
      prompt,
      galleryId: gallery.id // Now safe to access .id
    })

    return { success: true, newArt }
  }
}

export type { Art }
