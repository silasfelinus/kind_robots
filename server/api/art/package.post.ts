// art/package.post.ts
import { defineEventHandler, readBody } from 'h3'
import { errorHandler } from '../utils/error'
import prisma from '../utils/prisma'

// Define types for better type safety
type PackageRequestData = {
  prompt?: string
  promptId?: number
  userId?: number
  pitchId?: number
  designer?: string
  isMature?: boolean
  isPublic?: boolean
  isOrphan?: boolean
  channelId?: number
  channelLabel?: string
  username?: string
  pitch?: string
  galleryName?: string
}

export default defineEventHandler(async (event) => {
  try {
    const requestData: PackageRequestData = await readBody(event)
    const { prompt, username, pitch, galleryName = 'defaultGallery' } = requestData

    // Validate all required fields
    if (!prompt || !username || !pitch) {
      throw new Error('Missing required fields')
    }

    // Create or find a Pitch
    const existingPitch = await prisma.pitch.findUnique({
      where: { name: pitch }
    })
    const pitchRecord =
      existingPitch ||
      (await prisma.pitch.create({
        data: { name: pitch }
      }))

    // Create an ArtPrompt
    const artPrompt = await prisma.artPrompt.create({
      data: {
        prompt,
        pitchId: pitchRecord.id
      }
    })

    // Create an Art
    const art = await prisma.art.create({
      data: {
        artPromptId: artPrompt.id,
        username,
        galleryName
      }
    })

    // Create a Channel (if needed)
    const channel = await prisma.channel.create({
      data: {
        label: pitch
      }
    })

    return {
      success: true,
      artPrompt,
      art,
      channel
    }
  } catch (error: any) {
    console.error('Package Art Error:', error)
    return errorHandler({
      error,
      context: `Package Art - Prompt: ${requestData.prompt}, User: ${requestData.username}`
    })
  }
})
