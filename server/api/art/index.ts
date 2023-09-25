// /server/api/galleries/art/index.ts
import { Art, Prisma } from '@prisma/client'
import axios from 'axios'
import prisma from '../utils/prisma'
import { errorHandler } from '../utils/error'

// Function to create a new Art entry
export async function createArt(art: Partial<Art>): Promise<Art> {
  try {
    // Validate required fields
    if (!art.path || !art.galleryId) {
      console.error('Validation Error: Path and galleryId must be provided')
      throw new Error('Path and galleryId must be provided')
    }

    // Create the new Art entry using Prisma
    const newArt = await prisma.art.create({
      data: {
        path: art.path,
        prompt: art.prompt,
        user: art.user,
        galleryId: art.galleryId
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
  return await prisma.art.findMany()
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

export type { Art }
