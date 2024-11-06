// /server/api/pitches/index.post.ts
import {
  defineEventHandler,
  readBody,
  createError,
  setResponseStatus,
} from 'h3'
import { errorHandler } from '../utils/error'
import prisma from '../utils/prisma'
import { Prisma, type Pitch } from '@prisma/client'

interface PitchResponse {
  success: boolean
  message: string
  data?: Pitch | Pitch[]
  errors?: string[]
  statusCode?: number
}

export default defineEventHandler(async (event): Promise<PitchResponse> => {
  let response: PitchResponse
  try {
    // Validate authorization token
    const authorizationHeader = event.node.req.headers['authorization']
    if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
      throw createError({
        statusCode: 401,
        message:
          'Authorization token is required in the format "Bearer <token>".',
      })
    }

    const token = authorizationHeader.split(' ')[1]
    const user = await prisma.user.findFirst({
      where: { apiKey: token },
      select: { id: true },
    })

    if (!user) {
      throw createError({
        statusCode: 401,
        message: 'Invalid or expired token.',
      })
    }

    const authenticatedUserId = user.id

    // Read and validate the pitch data from the request body
    const pitchData = await readBody(event)

    // Handle single or multiple pitches
    const result = Array.isArray(pitchData)
      ? await addPitches(pitchData, authenticatedUserId)
      : await addPitch(pitchData, authenticatedUserId)

    if (result.error) {
      throw createError({
        statusCode: 400,
        message: result.error,
      })
    }

    // Successful creation response with conditional data
    response = {
      success: true,
      message: Array.isArray(pitchData)
        ? 'All pitches created successfully.'
        : 'Pitch created successfully.',
      data: 'pitches' in result ? result.pitches : result.pitch, // Access based on type check
      statusCode: 201,
    }
    setResponseStatus(event, 201)
  } catch (error) {
    const { message, statusCode } = errorHandler(error)
    setResponseStatus(event, statusCode || 500)
    response = {
      success: false,
      message:
        message.includes('token') || message.includes('required')
          ? message
          : 'Failed to create a new pitch.',
      errors: [message], // Changed error to errors for consistency with type
      statusCode: statusCode || 500,
    }
  }

  return response
})

// Function to add a single pitch with validation
export async function addPitch(
  pitchData: Partial<Pitch>,
  userId: number,
): Promise<{ pitch: Pitch | undefined; error: string | null }> {
  if (!pitchData.pitch) {
    return { pitch: undefined, error: 'Pitch content is required.' }
  }

  try {
    const pitch = await prisma.pitch.create({
      data: { ...pitchData, userId } as Prisma.PitchCreateInput,
    })
    return { pitch, error: null }
  } catch (error) {
    const errorMessage =
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
        ? 'A pitch with the same content already exists.'
        : error instanceof Error
          ? error.message
          : 'An unknown error occurred while creating the pitch.'

    return { pitch: undefined, error: errorMessage }
  }
}

// Function to handle adding multiple pitches
export async function addPitches(
  pitchesData: Partial<Pitch>[],
  userId: number,
): Promise<{ pitches: Pitch[] | undefined; error: string | null }> {
  const createdPitches: Pitch[] = []
  const errors: string[] = []

  for (const pitchData of pitchesData) {
    if (!pitchData.pitch) {
      errors.push('Pitch content is required.')
      continue
    }

    try {
      const pitch = await prisma.pitch.create({
        data: { ...pitchData, userId } as Prisma.PitchCreateInput,
      })
      createdPitches.push(pitch)
    } catch (error) {
      const errorMessage =
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
          ? 'Duplicate pitch content found.'
          : error instanceof Error
            ? error.message
            : 'An unknown error occurred while creating a pitch.'
      errors.push(errorMessage)
    }
  }

  return {
    pitches: createdPitches.length > 0 ? createdPitches : undefined,
    error: errors.length > 0 ? errors.join('; ') : null,
  }
}
