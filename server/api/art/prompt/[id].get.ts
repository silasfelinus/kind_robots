// server/api/art/prompt/[id].get.ts
import { defineEventHandler } from 'h3'
import prisma from '../../utils/prisma'
import { errorHandler } from '../../utils/error'

export default defineEventHandler(async (event) => {
  const promptId = Number(event.context.params?.promptId)

  try {
    // Validate promptId
    if (!promptId || isNaN(promptId)) {
      return {
        success: false,
        message: 'Invalid or missing prompt ID.',
        statusCode: 400,
      }
    }

    // Fetch all art entries related to the specific promptId
    const artByPromptId = await prisma.art.findMany({
      where: { promptId },
      include: {
        ArtImage: true, // Include related images if needed
      },
    })

    if (!artByPromptId || artByPromptId.length === 0) {
      return {
        success: false,
        message: `No art found for prompt ID ${promptId}.`,
        statusCode: 404,
      }
    }

    return { success: true, artByPromptId }
  } catch (error: unknown) {
    return errorHandler(error)
  }
})
