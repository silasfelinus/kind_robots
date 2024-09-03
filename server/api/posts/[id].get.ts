// /server/api/posts/[id].get.ts
import { defineEventHandler } from 'h3'
import prisma from '../utils/prisma'
import { errorHandler } from '../utils/error'

export default defineEventHandler(async (event) => {
  try {
    const id = Number(event.context.params?.id)

    if (isNaN(id)) {
      return { success: false, message: 'Invalid ID', statusCode: 400 }
    }

    const post = await prisma.post.findUnique({
      where: { id },
    })

    if (!post) {
      return { success: false, message: 'Post not found', statusCode: 404 }
    }

    return { success: true, post }
  } catch (error: unknown) {
    return errorHandler(error)
  }
})
