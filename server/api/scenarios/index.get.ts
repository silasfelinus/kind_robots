// /server/api/scenarios/index.get.ts
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

export default defineEventHandler(async () => {
  try {
    const data = await prisma.scenario.findMany({
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
      orderBy: { id: 'asc' },
    })

    return {
      success: true,
      message: 'All scenarios fetched successfully.',
      data,
      statusCode: 200,
    }
  } catch (error: unknown) {
    const { success, message, statusCode } = errorHandler(error)
    return { success, message, statusCode }
  }
})
