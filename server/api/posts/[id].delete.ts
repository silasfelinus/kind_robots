// /server/api/posts/[id].delete.ts
import { defineEventHandler } from 'h3'
import { errorHandler } from '../utils/error'
import prisma from '../utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    const id = Number(event.context.params?.id)
    if (!id) throw new Error('Invalid post ID.')

    const existingPost = await prisma.post.findUnique({ where: { id } })
    if (!existingPost) {
      return { success: false, message: 'Post not found.' }
    }

    await prisma.post.delete({ where: { id } })
    return { success: true, message: 'Post successfully deleted.' }
  } catch (error: unknown) {
    return errorHandler(error)
  }
})

// Function to delete a Post by ID
export async function deletePost(id: number): Promise<boolean> {
  try {
    const postExists = await prisma.post.findUnique({ where: { id } })

    if (!postExists) {
      throw new Error('Post not found')
    }

    await prisma.post.delete({ where: { id } })
    return true
  } catch (error: unknown) {
    throw errorHandler(error)
  }
}
