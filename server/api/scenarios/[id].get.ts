// /server/api/scenarios/[id].get.ts
import { defineEventHandler } from 'h3'
import prisma from '../../utils/prisma'
import { errorHandler } from '../../utils/error'

const dreamSelect = {
  id: true,
  title: true,
  slug: true,
  dreamType: true,
  imagePath: true,
  highlightImage: true,
  icon: true,
}

const characterSelect = {
  id: true,
  name: true,
  honorific: true,
  title: true,
  role: true,
  class: true,
  species: true,
  gender: true,
  alignment: true,
  genre: true,
  backstory: true,
  drive: true,
  quirks: true,
  personality: true,
  presentation: true,
  artPrompt: true,
  imagePath: true,
  designer: true,
  isPublic: true,
  isMature: true,
  isActive: true,
  charm: true,
  empathy: true,
  grace: true,
  luck: true,
  might: true,
  wits: true,
  artImageId: true,
}

export default defineEventHandler(async (event) => {
  try {
    const id = Number(event.context.params?.id)

    if (!Number.isInteger(id) || id <= 0) {
      event.node.res.statusCode = 400

      return {
        success: false,
        message: 'Invalid scenario ID. It must be a positive integer.',
        statusCode: 400,
      }
    }

    const data = await prisma.scenario.findUnique({
      where: { id },
      include: {
        Dreams: {
          select: dreamSelect,
          orderBy: { title: 'asc' },
        },
        Characters: {
          select: characterSelect,
          orderBy: { name: 'asc' },
        },
        _count: {
          select: {
            Dreams: true,
            Characters: true,
          },
        },
      },
    })

    if (!data) {
      event.node.res.statusCode = 404

      return {
        success: false,
        message: 'Scenario not found.',
        statusCode: 404,
      }
    }

    event.node.res.statusCode = 200

    return {
      success: true,
      message: 'Scenario details fetched successfully.',
      data,
      statusCode: 200,
    }
  } catch (error: unknown) {
    const { success, message, statusCode } = errorHandler(error)
    const safeStatusCode = statusCode ?? 500

    event.node.res.statusCode = safeStatusCode

    return {
      success,
      message,
      statusCode: safeStatusCode,
    }
  }
})
