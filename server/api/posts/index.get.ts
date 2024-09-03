// /server/api/posts/index.get.ts
import { defineEventHandler } from 'h3'
import type { Post } from '@prisma/client'
import prisma from '../utils/prisma'
import { errorHandler } from '../utils/error'

export default defineEventHandler(async () => {
  try {
    const posts = await prisma.post.findMany()
    return { success: true, posts }
  } catch (error: unknown) {
    return errorHandler(error)
  }
})

// Function to fetch all Posts
export async function fetchAllPosts(): Promise<Post[]> {
  return await prisma.post.findMany()
}
