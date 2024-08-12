import { defineEventHandler } from 'h3'
import type { Art } from '@prisma/client'
import { errorHandler } from '../utils/error'
import prisma from '../utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    const id = Number(event.context.params?.id)
    const art = await fetchArtById(id)
    return { success: true, art }
  }
  catch (error: unknown) {
    return errorHandler(error)
  }
})

// Function to fetch a single Art entry by ID
export async function fetchArtById(id: number): Promise<Art | null> {
  return await prisma.art.findUnique({
    where: { id },
  })
}

// Function to fetch Art entries by Gallery ID
export async function fetchArtByGalleryId(galleryId: number): Promise<Art[]> {
  return await prisma.art.findMany({
    where: { galleryId },
  })
}
