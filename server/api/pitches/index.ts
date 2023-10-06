import { Pitch, Prisma } from '@prisma/client'
import prisma from '../utils/prisma'
import { errorHandler } from '../utils/error'
import { useRandomName } from '../../../utils/useRandomName'

// Function to create a new Pitch
export async function createPitch(
  pitch: Omit<Partial<Pitch>, 'title' | 'pitch' | 'designer'> & {
    userId: number
    title: string
    pitch: string
  }
): Promise<Pitch> {
  try {
    // Validate required fields
    if (!pitch.title || !pitch.pitch || !pitch.userId) {
      throw new Error('Title and pitch content must be provided')
    }

    // Generate a random designer name
    const { value: designerName } = useRandomName()

    // Create the new Pitch
    return await prisma.pitch.create({
      data: {
        ...pitch,
        designer: designerName // Set the designer name
      }
    })
  } catch (error: any) {
    throw errorHandler(error)
  }
}

// Function to update an existing Pitch by ID
export async function updatePitch(id: number, updatedPitch: Partial<Pitch>): Promise<Pitch | null> {
  try {
    return await prisma.pitch.update({
      where: { id },
      data: updatedPitch
    })
  } catch (error: any) {
    throw errorHandler(error)
  }
}

// Function to delete a Pitch by ID
export async function deletePitch(id: number): Promise<boolean> {
  try {
    const pitchExists = await prisma.pitch.findUnique({ where: { id } })

    if (!pitchExists) {
      throw new Error('Pitch not found')
    }

    await prisma.pitch.delete({ where: { id } })
    return true
  } catch (error: any) {
    throw errorHandler(error)
  }
}

// Function to fetch all Pitches
export async function fetchAllPitches(): Promise<Pitch[]> {
  return await prisma.pitch.findMany()
}

// Function to create Pitches in batch
export async function createPitchesBatch(
  pitchesData: Partial<Pitch>[]
): Promise<{ count: number; pitches: Pitch[]; errors: string[] }> {
  const errors: string[] = []

  // Validate and filter the pitches
  const data: Prisma.PitchCreateManyInput[] = pitchesData
    .filter((pitchData) => {
      if (!pitchData.title || !pitchData.pitch) {
        errors.push(`Pitch with title ${pitchData.title} is incomplete.`)
        return false
      }
      return true
    })
    .map((pitchData) => pitchData as Prisma.PitchCreateManyInput)

  // Create the pitches in a batch
  const result = await prisma.pitch.createMany({
    data,
    skipDuplicates: true // Skip duplicate records based on constraints
  })

  // Fetch the newly created pitches
  const pitches = await prisma.pitch.findMany()

  return { count: result.count, pitches, errors }
}

export async function fetchPitchById(
  id: number
): Promise<{ success: boolean; pitch?: Pitch; message?: string; statusCode?: number }> {
  try {
    // Validate the ID
    if (!id || isNaN(id)) {
      return { success: false, message: 'Invalid ID', statusCode: 400 }
    }

    // Fetch the pitch by ID along with its related Art, ArtPrompt, and Channel
    const pitch = await prisma.pitch.findUnique({
      where: { id },
      include: {
        Art: true,
        Channel: true
      }
    })

    // Check if the pitch exists
    if (!pitch) {
      return { success: false, message: 'Pitch not found', statusCode: 404 }
    }
    return { success: true, pitch }
  } catch (error: any) {
    const handledError = errorHandler(error)
    return {
      success: false,
      message: handledError.message,
      statusCode: handledError.statusCode || 500
    }
  }
}

export type { Pitch }
