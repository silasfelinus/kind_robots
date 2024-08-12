// /server/api/tags/index.post.ts
import { defineEventHandler, readBody } from 'h3'
import { errorHandler } from '../utils/error'
import prisma from '../utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    const tagsData = await readBody(event)

    if (!Array.isArray(tagsData)) {
      return { success: false, message: 'Invalid JSON body. Expected an array of tags or strings.' }
    }

    // Transform to Title Case and validate
    const transformedTags = tagsData.map((tag) => {
      if (typeof tag === 'string') {
        return {
          label: 'Default', // Default label
          title: tag.replace(/\w\S*/g, txt => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()),
        }
      }
      return {
        label: tag.label.charAt(0).toUpperCase() + tag.label.slice(1).toLowerCase(),
        title: tag.title.replace(/\w\S*/g, (txt: string) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()),
      }
    })

    // Create tags in a batch and skip duplicates
    const result = await prisma.tag.createMany({
      data: transformedTags,
      skipDuplicates: true,
    })

    return { success: true, count: result.count }
  }
  catch (error: unknown) {
    return errorHandler(error)
  }
})
