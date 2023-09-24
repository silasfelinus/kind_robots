// /server/api/galleries/art/index.ts
import { Art, Prisma } from '@prisma/client'
import prisma from '../utils/prisma'
import { errorHandler } from '../utils/error'

// Function to create a new Art entry
export async function createArt(art: Partial<Art>): Promise<Art> {
  try {
    // Validate required fields
    if (!art.path || !art.galleryId) {
      throw new Error('Path and galleryId must be provided')
    }

    // Create the new Art entry
    return await prisma.art.create({
      data: {
        path: art.path,
        galleryId: art.galleryId,
        clapCount: art.clapCount || 0,
        booCount: art.booCount || 0
      }
    })
  } catch (error: any) {
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

export type { Art }
