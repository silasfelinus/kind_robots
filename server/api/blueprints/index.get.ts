// /server/api/blueprints/index.get.ts
import { defineEventHandler } from 'h3'
import prisma from '../utils/prisma'
import { errorHandler } from '../utils/error'
import type { Prisma } from '@prisma/client'

type BlueprintWithRelations = Prisma.BlueprintGetPayload<{
  include: { coverArt: true; tags: true }
}>

type BlueprintsResponse = {
  success: boolean
  message?: string
  data: BlueprintWithRelations[]
  statusCode?: number
}

export default defineEventHandler(async (): Promise<BlueprintsResponse> => {
  let response: BlueprintsResponse

  try {
    const data = await prisma.blueprint.findMany({
      orderBy: { updatedAt: 'desc' },
      include: { coverArt: true, tags: true },
    })

    response = {
      success: true,
      data,
      message: 'Blueprints fetched successfully.',
      statusCode: 200,
    }
  } catch (error) {
    const handled = errorHandler(error)
    response = {
      success: false,
      data: [],
      message: handled.message || 'Failed to fetch blueprints.',
      statusCode: handled.statusCode || 500,
    }
  }

  return response
})
