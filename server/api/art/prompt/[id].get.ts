// server/api/art/prompt/[id].get.ts
import { defineEventHandler } from 'h3'
import prisma from '../../utils/prisma'
import { errorHandler } from '../../utils/error'

export default defineEventHandler(async (event) => {
  const promptId = Number(event.context.params?.promptId)

  try {
    // Validate promptId
    if (!promptId || isNaN(promptId)) {
      event.node.res.statusCode = 400
      throw new Error('Invalid or missing prompt ID.')
    }

    // Fetch all art entries related to the specific promptId
    const artByPromptId = await prisma.art.findMany({
      where: { promptId },
      include: {
        ArtImage: true, // Include related images if needed
      },
    })

    if (!artByPromptId || artByPromptId.length === 0) {
      event.node.res.statusCode = 404
      throw new Error(`No art found for prompt ID ${promptId}.`)
    }

    // Return the art entries wrapped in a data object
    return { success: true, data: { artByPromptId } }
  } catch (error: unknown) {
    return errorHandler(error)
  }
})
