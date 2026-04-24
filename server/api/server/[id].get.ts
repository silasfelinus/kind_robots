// /server/api/server/[id].get.ts
import { defineEventHandler, createError } from 'h3'
import prisma from '@/server/utils/prisma'
import { errorHandler } from '@/server/utils/error'
import { validateApiKey } from '@/server/utils/validateKey'

export default defineEventHandler(async (event) => {
  let id: number | null = null

  try {
    id = Number(event.context.params?.id)
    if (isNaN(id) || id <= 0) {
      throw createError({
        statusCode: 400,
        message: 'Invalid Server ID. Must be a positive integer.',
      })
    }

    const { isValid, user } = await validateApiKey(event)

    const data = await prisma.server.findUnique({
      where: { id },
      select: {
        id: true,
        createdAt: true,
        updatedAt: true,
        title: true,
        label: true,
        description: true,
        serverType: true,
        category: true,
        baseUrl: true,
        endpointPath: true,
        healthPath: true,
        userId: true,
        isPublic: true,
        isOfficial: true,
        isDefault: true,
        isActive: true,
        isEditable: true,
        requiresApiKey: true,
        apiKeyName: true,
        supportsTxt2Img: true,
        supportsImg2Img: true,
        supportsChat: true,
        supportsComfyWorkflow: true,
        supportsCheckpointOverride: true,
        supportsSampler: true,
        supportsNegativePrompt: true,
        supportsSeed: true,
        supportsSteps: true,
        supportsVideo: true,
        apiLink: true,
        model: true,
        designer: true,
        version: true,
        notes: true,
        sortOrder: true,
        lastCheckedAt: true,
        lastStatus: true,
        apiKey: true,
      },
    })

    if (!data) {
      throw createError({
        statusCode: 404,
        message: `Server with ID ${id} not found.`,
      })
    }

    const canView =
      data.isPublic ||
      (isValid && user && (user.Role === 'ADMIN' || data.userId === user.id))

    if (!canView) {
      throw createError({
        statusCode: 403,
        message: 'You do not have permission to view this Server.',
      })
    }

    const safeData = {
      ...data,
      apiKey: data.apiKey ? 'CONFIGURED' : null,
    }

    event.node.res.statusCode = 200
    return {
      success: true,
      message: 'Server fetched successfully.',
      data: safeData,
      statusCode: 200,
    }
  } catch (error) {
    const handled = errorHandler(error)
    console.error('[server.id.get] Error:', handled)
    event.node.res.statusCode = handled.statusCode || 500
    return {
      success: false,
      message: handled.message || `Failed to fetch Server with ID ${id}.`,
      data: null,
      statusCode: event.node.res.statusCode,
    }
  }
})
