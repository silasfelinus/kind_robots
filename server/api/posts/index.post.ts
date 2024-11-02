// /server/api/posts/index.post.ts
import { defineEventHandler, readBody } from 'h3'
import { errorHandler } from '../utils/error'
import prisma from './../utils/prisma'
import type { Prisma, Post } from '@prisma/client'

export default defineEventHandler(async (event) => {
  try {
    const postData = await readBody(event)
    const result = await addPost(postData)

    // If addPost returns an error, return it in the response
    if (result.error) {
      return {
        success: false,
        message: result.error,
        statusCode: 400, // Indicating a client error due to incomplete or malformed data
      }
    }

    return { success: true, post: result.post }
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
  try {
    // Verify the postData is a Partial<Post> without enforcing specific fields
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
