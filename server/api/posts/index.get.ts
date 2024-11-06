// /server/api/posts/index.get.ts
import { defineEventHandler } from 'h3'
import type { Post } from '@prisma/client'
import prisma from '../utils/prisma'
import { errorHandler } from '../utils/error'

export default defineEventHandler(async () => {
  try {
    // Fetch all posts from the database
    const posts = await prisma.post.findMany()

    // Return a successful response with the posts
    return { success: true, posts, message: 'Posts retrieved successfully.' }
  } catch (error: unknown) {
    console.error('Error fetching posts:', error) // Debugging line
    return errorHandler(error)
  }
})

// Function to fetch all Posts
export async function fetchAllPosts(): Promise<Post[]> {
  try {
    return await prisma.post.findMany()
  } catch (error: unknown) {
    console.error('Error in fetchAllPosts:', error) // Debugging line
    throw error
  }
}
