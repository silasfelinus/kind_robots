// /server/api/posts/index.post.ts
import { defineEventHandler, readBody } from 'h3'
import { errorHandler } from '../utils/error' // Import the error handler
import prisma from './../utils/prisma'
import type { Prisma, Post } from '@prisma/client'

export default defineEventHandler(async (event) => {
  try {
    const postData = await readBody(event)
    const result = await addPost(postData)
    return { success: true, ...result }
  } catch (error) {
    const { message, statusCode } = errorHandler(error)
    return {
      success: false,
      message: 'Failed to create a new post',
      error: message,
      statusCode: statusCode || 500,
    }
  }
})

export async function addPost(
  postData: Partial<Post>,
): Promise<{ post: Post | null; error: string | null }> {
  if (!postData.content || !postData.username) {
    return { post: null, error: 'Content and username are required.' }
  }

  try {
    const post = await prisma.post.create({
      data: postData as Prisma.PostCreateInput,
    })
    return { post, error: null }
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error'
    return { post: null, error: errorMessage }
  }
}
