// /server/api/components/index.post.ts
import { defineEventHandler, readBody, createError } from 'h3'
import prisma from '../../utils/prisma'
import { errorHandler } from '../../utils/error'
import type { Component, Prisma } from '~/prisma/generated/prisma/client'

type ComponentCreateBody = Partial<Component>

function getStringOrDefault(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback
}

function getStringOrNull(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function getBooleanOrDefault(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback
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

    const baseData = {
      folderName,
      isWorking: getBooleanOrDefault(componentData.isWorking, true),
      underConstruction: getBooleanOrDefault(
        componentData.underConstruction,
        false,
      ),
      isBroken: getBooleanOrDefault(componentData.isBroken, false),
      title: getStringOrDefault(componentData.title, componentName),
      notes: getStringOrNull(componentData.notes),
      updatedAt: new Date(),
      ArtImage: artImageId
        ? {
            connect: { id: artImageId },
          }
        : undefined,
    } satisfies Omit<Prisma.ComponentUpdateInput, 'componentName'>

    const data = await prisma.component.upsert({
      where: {
        componentName,
      },
      update: baseData,
      create: {
        ...baseData,
        componentName,
        createdAt: new Date(),
      },
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
