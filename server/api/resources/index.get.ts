// /server/api/resources/index.get.ts
import { defineEventHandler } from 'h3'
import prisma from '../utils/prisma'
import { errorHandler } from '../utils/error'
import type { Resource } from '@prisma/client'

export default defineEventHandler(async () => {
  try {
    // Fetch all resources from the database
    const resources = await prisma.resource.findMany()

    return {
      success: true,
      message: 'Resources fetched successfully.',
      data: { resources },
      statusCode: 200,
    }
  } catch (error: unknown) {
    // Handle error using the centralized error handler
    const { success, message, statusCode } = errorHandler(error)
    return {
      success,
      message: message || 'Failed to fetch resources.',
      data: null,
      statusCode: statusCode || 500,
    }
  }
})

// Function to fetch all Resources, to be used elsewhere if needed
export async function fetchAllResources(): Promise<Resource[]> {
  return await prisma.resource.findMany()
}
