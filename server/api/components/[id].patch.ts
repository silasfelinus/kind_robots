// /server/api/components/[id].patch.ts
import { createError, defineEventHandler, getRouterParam, readBody } from 'h3'
import prisma from '../../utils/prisma'
import { errorHandler } from '../../utils/error'
import { requireAdminApiUser } from '../../utils/authGuard'
import type { Prisma } from '~/prisma/generated/prisma/client'
import {
  isComponentStatus,
  type ComponentStatus,
} from '@/utils/wonderlab/componentStatus'

type ComponentPatchBody = {
  componentName?: unknown
  folderName?: unknown
  status?: unknown
  statusReason?: unknown
  title?: unknown
  description?: unknown
  notes?: unknown
  category?: unknown
  previewMode?: unknown
  artImageId?: unknown
}

const allowedPatchFields = new Set([
  'componentName',
  'folderName',
  'status',
  'statusReason',
  'title',
  'description',
  'notes',
  'category',
  'previewMode',
  'artImageId',
])

function requiredText(value: unknown, field: string, maxLength: number): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw createError({
      statusCode: 400,
      message: `"${field}" must be a non-empty string.`,
    })
  }

  const text = value.trim()

  if (text.length > maxLength) {
    throw createError({
      statusCode: 400,
      message: `"${field}" must be ${maxLength} characters or fewer.`,
    })
  }

  return text
}

function nullableText(
  value: unknown,
  field: string,
  maxLength?: number,
): string | null {
  if (value === null) return null

  if (typeof value !== 'string') {
    throw createError({
      statusCode: 400,
      message: `"${field}" must be a string or null.`,
    })
  }

  const text = value.trim()

  if (maxLength && text.length > maxLength) {
    throw createError({
      statusCode: 400,
      message: `"${field}" must be ${maxLength} characters or fewer.`,
    })
  }

  return text.length ? text : null
}

function componentNameValue(value: unknown): string {
  const name = requiredText(value, 'componentName', 255)

  if (!/^[a-zA-Z0-9\s-]+$/.test(name)) {
    throw createError({
      statusCode: 400,
      message:
        '"componentName" may contain only alphanumeric characters, spaces, or hyphens.',
    })
  }

  return name
}

function optionalStatus(value: unknown): ComponentStatus | undefined {
  if (value === undefined) return undefined

  if (!isComponentStatus(value)) {
    throw createError({
      statusCode: 400,
      message: 'Invalid canonical Component status.',
    })
  }

  return value
}

function optionalArtImageId(value: unknown): number | null | undefined {
  if (value === undefined) return undefined
  if (value === null) return null

  const id = Number(value)

  if (!Number.isInteger(id) || id <= 0) {
    throw createError({
      statusCode: 400,
      message: '"artImageId" must be a positive integer or null.',
    })
  }

  return id
}

async function assertArtImageExists(artImageId?: number | null) {
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

function parsePatchBody(body: unknown): ComponentPatchBody {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw createError({
      statusCode: 400,
      message: 'Component update payload is required.',
    })
  }

  const record = body as Record<string, unknown>
  const invalidFields = Object.keys(record).filter(
    (field) => !allowedPatchFields.has(field),
  )

  if (invalidFields.length) {
    throw createError({
      statusCode: 400,
      message: `Unsupported Component update fields: ${invalidFields.join(', ')}.`,
    })
  }

  if (!Object.keys(record).length) {
    throw createError({
      statusCode: 400,
      message: 'No Component update fields were provided.',
    })
  }

  return record as ComponentPatchBody
}

export default defineEventHandler(async (event) => {
  const componentId = Number(getRouterParam(event, 'id'))

  try {
    await requireAdminApiUser(event)

    if (!Number.isInteger(componentId) || componentId <= 0) {
      throw createError({
        statusCode: 400,
        message: 'Invalid or missing component ID.',
      })
    }

    const existingComponent = await prisma.component.findUnique({
      where: { id: componentId },
      select: { id: true },
    })

    if (!existingComponent) {
      throw createError({
        statusCode: 404,
        message: `Component with ID ${componentId} not found.`,
      })
    }

    const body = parsePatchBody(await readBody<unknown>(event))
    const canonicalStatus = optionalStatus(body.status)
    const artImageId = optionalArtImageId(body.artImageId)

    await assertArtImageExists(artImageId)

    const updateData: Prisma.ComponentUpdateInput = {
      componentName:
        body.componentName === undefined
          ? undefined
          : componentNameValue(body.componentName),
      folderName:
        body.folderName === undefined
          ? undefined
          : requiredText(body.folderName, 'folderName', 255),
      status: canonicalStatus,
      statusReason:
        body.statusReason === undefined
          ? undefined
          : nullableText(body.statusReason, 'statusReason'),
      title:
        body.title === undefined
          ? undefined
          : requiredText(body.title, 'title', 100),
      description:
        body.description === undefined
          ? undefined
          : nullableText(body.description, 'description'),
      notes:
        body.notes === undefined ? undefined : nullableText(body.notes, 'notes'),
      category:
        body.category === undefined
          ? undefined
          : nullableText(body.category, 'category', 255),
      previewMode:
        body.previewMode === undefined
          ? undefined
          : nullableText(body.previewMode, 'previewMode', 64),
      ArtImage:
        artImageId === null
          ? { disconnect: true }
          : artImageId
            ? { connect: { id: artImageId } }
            : undefined,
    }

    const data = await prisma.component.update({
      where: { id: componentId },
      data: updateData,
    })

    event.node.res.statusCode = 200

    return {
      success: true,
      message: 'Component updated successfully.',
      data,
      statusCode: 200,
    }
  } catch (error) {
    const handled = errorHandler(error)
    const statusCode = handled.statusCode || 500

    event.node.res.statusCode = statusCode

    return {
      success: false,
      message:
        handled.message ||
        `Failed to update component with ID ${componentId}.`,
      data: null,
      statusCode,
    }
  }
})
