// /server/api/resources/index.post.ts
import { defineEventHandler, readBody } from 'h3'
import { errorHandler } from '../utils/error'
import prisma from '../utils/prisma'
import type { Prisma, Resource } from '@prisma/client'

export default defineEventHandler(async (event) => {
  try {
    const resourceData = await readBody(event)
    const result = await addResource(resourceData)
    return { success: true, ...result }
  } catch (error) {
    const { message, statusCode } = errorHandler(error)
    return {
      success: false,
      message: 'Failed to create a new resource',
      error: message,
      statusCode: statusCode || 500,
    }
  }
})

export async function addResource(
  resourceData: Partial<Resource>,
): Promise<{ resource: Resource | null; error: string | null }> {
  if (!resourceData.name) {
    return { resource: null, error: 'Resource name is required.' }
  }

  try {
    const resource = await prisma.resource.create({
      data: resourceData as Prisma.ResourceCreateInput,
    })
    return { resource, error: null }
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error'
    return { resource: null, error: errorMessage }
  }
}
