// /server/api/posts/[id].patch.ts
import { defineEventHandler, readBody } from 'h3'
import type { Post } from '@prisma/client'
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

    const postData: Partial<Post> = await readBody(event)
    const updatedPost = await prisma.post.update({
      where: { id },
      data: postData,
    })

    return { success: true, post: updatedPost }
  } catch (error: unknown) {
    return errorHandler(error)
  }
})

// Function to update an existing Post by ID
export async function updatePost(
  id: number,
  updatedPost: Partial<Post>,
): Promise<Post | null> {
  try {
    return await prisma.post.update({
      where: { id },
      data: updatedPost,
    })
  } catch (error: unknown) {
    throw errorHandler(error)
  }
}
