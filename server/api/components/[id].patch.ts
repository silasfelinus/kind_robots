// /server/api/components/[id].patch.ts
import { defineEventHandler, createError, getRouterParam, readBody } from 'h3'
import prisma from '../../utils/prisma'
import { errorHandler } from '../../utils/error'
import type { Component, Prisma } from '~/prisma/generated/prisma/client'

type ComponentPatchBody = Partial<Component>

function getStringOrUndefined(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined
}

function getStringOrNullOrUndefined(value: unknown): string | null | undefined {
  if (value === null) return null
  return typeof value === 'string' ? value : undefined
}

function getBooleanOrUndefined(value: unknown): boolean | undefined {
  return typeof value === 'boolean' ? value : undefined
}

function getPositiveIntegerOrUndefined(value: unknown): number | undefined {
  const parsed = Number(value)

  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined
}

function hasUpdateData(data: Record<string, unknown>): boolean {
  return Object.values(data).some((value) => value !== undefined)
}

async function assertArtImageExists(artImageId?: number) {
  if (!artImageId) return

  const artImage = await prisma.artImage.findUnique({
    where: { id: artImageId },
    select: { id: true },
  })

  if (!artImage) {
    throw createError({
      statusCode: 404,
      message: `ArtImage ID not found: ${artImageId}.`,
    })
  }
}

export default defineEventHandler(async (event) => {
  const componentId = Number(getRouterParam(event, 'id'))

  try {
    if (!Number.isInteger(componentId) || componentId <= 0) {
      throw createError({
        statusCode: 400,
        message: 'Invalid or missing component ID.',
      })
    }

    const body = await readBody<ComponentPatchBody>(event)

    if (!body || Object.keys(body).length === 0) {
      throw createError({
        statusCode: 400,
        message: 'No valid component data provided.',
      })
    }

    if (body.componentName && !/^[a-zA-Z0-9\s-]+$/.test(body.componentName)) {
      throw createError({
        statusCode: 400,
        message:
          'Invalid componentName: Must contain only alphanumeric characters, spaces, or hyphens.',
      })
    }

    if (body.title && body.title.length > 100) {
      throw createError({
        statusCode: 400,
        message: 'Invalid title: Must not exceed 100 characters.',
      })
    }

    const existingComponent = await prisma.component.findUnique({
      where: { id: componentId },
      select: {
        id: true,
      },
    })

    if (!existingComponent) {
      throw createError({
        statusCode: 404,
        message: `Component with ID ${componentId} not found.`,
      })
    }

    const artImageId = getPositiveIntegerOrUndefined(body.artImageId)

    await assertArtImageExists(artImageId)

    const updateData: Prisma.ComponentUpdateInput = {
      componentName: getStringOrUndefined(body.componentName),
      folderName: getStringOrUndefined(body.folderName),
      isWorking: getBooleanOrUndefined(body.isWorking),
      underConstruction: getBooleanOrUndefined(body.underConstruction),
      isBroken: getBooleanOrUndefined(body.isBroken),
      title: getStringOrUndefined(body.title),
      notes: getStringOrNullOrUndefined(body.notes),
      ArtImage:
        body.artImageId === null
          ? {
              disconnect: true,
            }
          : artImageId
            ? {
                connect: { id: artImageId },
              }
            : undefined,
    }

    if (!hasUpdateData(updateData as Record<string, unknown>)) {
      throw createError({
        statusCode: 400,
        message: 'No valid component fields provided.',
      })
    }

    const data = await prisma.component.update({
      where: { id: componentId },
      data: updateData,
      include: {
        ArtImage: {
          select: {
            id: true,
            imagePath: true,
            fileName: true,
          },
        },
      },
    })

    event.node.res.statusCode = 200

    return {
      success: true,
      message: 'Component updated successfully.',
      data,
      statusCode: 200,
    }
  } catch (error) {
    const handledError = errorHandler(error)

    event.node.res.statusCode = handledError.statusCode || 500

    return {
      success: false,
      message:
        handledError.message ||
        `Failed to update component with ID ${componentId}.`,
      data: null,
      statusCode: event.node.res.statusCode,
    }
  }
})
