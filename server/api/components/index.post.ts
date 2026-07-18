// /server/api/components/index.post.ts
import { createError, defineEventHandler, readBody } from 'h3'
import prisma from '../../utils/prisma'
import { errorHandler } from '../../utils/error'
import { requireAdminApiUser } from '../../utils/authGuard'
import type { Component, Prisma } from '~/prisma/generated/prisma/client'
import {
  hasLegacyStatusUpdate,
  legacyFieldsForComponentStatus,
  resolveLegacyStatusUpdate,
} from '@/utils/wonderlab/componentStatus'

type ComponentCreateBody = Partial<Component>

function getStringOrDefault(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback
}

function getStringOrNull(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function getPositiveIntegerOrUndefined(value: unknown): number | undefined {
  const parsed = Number(value)

  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined
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
  try {
    await requireAdminApiUser(event)

    const componentData = await readBody<ComponentCreateBody>(event)

    const componentName = getStringOrDefault(componentData.componentName, '')
    const folderName = getStringOrDefault(
      componentData.folderName,
      componentName,
    )

    if (!componentName) {
      throw createError({
        statusCode: 400,
        message: 'The "componentName" field is required.',
      })
    }

    if (!folderName) {
      throw createError({
        statusCode: 400,
        message: 'The "folderName" field is required.',
      })
    }

    const artImageId = getPositiveIntegerOrUndefined(componentData.artImageId)
    await assertArtImageExists(artImageId)

    const existingComponent = await prisma.component.findUnique({
      where: { componentName },
      select: {
        isWorking: true,
        underConstruction: true,
        isBroken: true,
      },
    })

    const statusWasProvided = hasLegacyStatusUpdate(componentData)
    const createStatus = statusWasProvided
      ? resolveLegacyStatusUpdate(
          legacyFieldsForComponentStatus('UNREVIEWED'),
          componentData,
        )
      : legacyFieldsForComponentStatus('UNREVIEWED')
    const updateStatus =
      statusWasProvided && existingComponent
        ? resolveLegacyStatusUpdate(existingComponent, componentData)
        : statusWasProvided
          ? createStatus
          : null

    const commonData = {
      folderName,
      title: getStringOrDefault(componentData.title, componentName),
      notes: getStringOrNull(componentData.notes),
      updatedAt: new Date(),
      ArtImage: artImageId
        ? {
            connect: { id: artImageId },
          }
        : undefined,
    }

    const updateData: Prisma.ComponentUpdateInput = {
      ...commonData,
      isWorking: updateStatus?.isWorking,
      underConstruction: updateStatus?.underConstruction,
      isBroken: updateStatus?.isBroken,
    }

    const createData: Prisma.ComponentCreateInput = {
      ...commonData,
      componentName,
      createdAt: new Date(),
      isWorking: createStatus.isWorking,
      underConstruction: createStatus.underConstruction,
      isBroken: createStatus.isBroken,
    }

    const data = await prisma.component.upsert({
      where: {
        componentName,
      },
      update: updateData,
      create: createData,
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

    event.node.res.statusCode = 201

    return {
      success: true,
      message: 'Component created or updated successfully.',
      data,
      statusCode: 201,
    }
  } catch (error) {
    const handledError = errorHandler(error)

    event.node.res.statusCode = handledError.statusCode || 500

    return {
      success: false,
      message: handledError.message || 'Failed to create or update component.',
      data: null,
      statusCode: event.node.res.statusCode,
    }
  }
})
