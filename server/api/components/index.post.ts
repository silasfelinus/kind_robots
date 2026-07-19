// /server/api/components/index.post.ts
import { createError, defineEventHandler, readBody } from 'h3'
import prisma from '../../utils/prisma'
import { errorHandler } from '../../utils/error'
import { requireAdminApiUser } from '../../utils/authGuard'
import type { Component, Prisma } from '~/prisma/generated/prisma/client'
import {
  isComponentStatus,
  type ComponentStatus,
} from '@/utils/wonderlab/componentStatus'

type ComponentCreateBody = Partial<Component>

const retiredStatusFields = [
  'isWorking',
  'underConstruction',
  'isBroken',
] as const

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

function requestedStatus(value: unknown): ComponentStatus | null {
  if (value === undefined || value === null) return null

  if (!isComponentStatus(value)) {
    throw createError({
      statusCode: 400,
      message: 'Invalid canonical Component status.',
    })
  }

  return value
}

function rejectRetiredStatusFields(body: unknown): void {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return

  const record = body as Record<string, unknown>
  const retiredFields = retiredStatusFields.filter((field) =>
    Object.prototype.hasOwnProperty.call(record, field),
  )

  if (retiredFields.length) {
    throw createError({
      statusCode: 400,
      message: `Legacy Component status fields are no longer supported: ${retiredFields.join(', ')}. Use "status" instead.`,
    })
  }
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
    rejectRetiredStatusFields(componentData)

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

    const canonicalStatus = requestedStatus(componentData.status)
    const createStatus: ComponentStatus = canonicalStatus ?? 'UNREVIEWED'

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
      status: canonicalStatus ?? undefined,
    }

    const createData: Prisma.ComponentCreateInput = {
      ...commonData,
      componentName,
      createdAt: new Date(),
      status: createStatus,
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
