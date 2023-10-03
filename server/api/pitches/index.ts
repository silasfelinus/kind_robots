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
      return false
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

// Function to fetch a single Pitch by ID
export async function fetchPitchById(id: number): Promise<Pitch | null> {
  return await prisma.pitch.findUnique({
    where: { id }
  })
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

export type { Pitch }
