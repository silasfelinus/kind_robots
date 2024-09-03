// /server/api/resources/index.get.ts
import { defineEventHandler } from 'h3'
import prisma from '../utils/prisma'
import { errorHandler } from '../utils/error'
import type { Resource } from '@prisma/client'

export default defineEventHandler(async () => {
  try {
    const resources = await prisma.resource.findMany()
    return { success: true, resources }
  } catch (error: unknown) {
    return errorHandler(error)
  }
})

// Function to fetch all Resources
export async function fetchAllResources(): Promise<Resource[]> {
  return await prisma.resource.findMany()
}
