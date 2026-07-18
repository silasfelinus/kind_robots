// /server/api/components/name/[name].patch.ts
import { createError, defineEventHandler, readBody } from 'h3'
import prisma from '../../../utils/prisma'
import { errorHandler } from '../../../utils/error'
import { requireAdminApiUser } from '../../../utils/authGuard'
import type { Component, Prisma } from '~/prisma/generated/prisma/client'
import {
  hasLegacyStatusUpdate,
  resolveLegacyStatusUpdate,
} from '@/utils/wonderlab/componentStatus'

export default defineEventHandler(async (event) => {
  let response
  const componentName = event.context.params?.name
  let requestBody: Partial<Component> | null = null

  try {
    await requireAdminApiUser(event)

    if (!componentName || !/^[a-zA-Z0-9\s-]+$/.test(componentName)) {
      throw createError({
        statusCode: 400,
        message: 'Invalid or missing component name.',
      })
    }

    requestBody = await readBody<Partial<Component>>(event)

    if (!requestBody || Object.keys(requestBody).length === 0) {
      throw createError({
        statusCode: 400,
        message: 'No valid component data provided.',
      })
    }

    if (requestBody.title && requestBody.title.length > 100) {
      throw createError({
        statusCode: 400,
        message: 'Invalid title: Must not exceed 100 characters.',
      })
    }

    const allowedFields = [
      'folderName',
      'createdAt',
      'updatedAt',
      'isWorking',
      'underConstruction',
      'isBroken',
      'title',
      'notes',
      'artImageId',
    ]
    const invalidFields = Object.keys(requestBody).filter(
      (field) => !allowedFields.includes(field),
    )

    if (invalidFields.length > 0) {
      throw createError({
        statusCode: 400,
        message: `Invalid fields provided: ${invalidFields.join(', ')}.`,
      })
    }

    const existingComponent = await prisma.component.findUnique({
      where: { componentName },
    })

    if (!existingComponent) {
      throw createError({
        statusCode: 404,
        message: `Component with name "${componentName}" not found.`,
      })
    }

    const normalizedStatus = hasLegacyStatusUpdate(requestBody)
      ? resolveLegacyStatusUpdate(existingComponent, requestBody)
      : null

    const {
      isWorking: _isWorking,
      underConstruction: _underConstruction,
      isBroken: _isBroken,
      ...nonStatusData
    } = requestBody

    const updateData: Prisma.ComponentUpdateInput = {
      ...nonStatusData,
      isWorking: normalizedStatus?.isWorking,
      underConstruction: normalizedStatus?.underConstruction,
      isBroken: normalizedStatus?.isBroken,
    }

    const data = await prisma.component.update({
      where: { componentName },
      data: updateData,
    })

    response = {
      success: true,
      data,
      statusCode: 200,
    }
    event.node.res.statusCode = 200
  } catch (error: unknown) {
    const handledError = errorHandler(error)
    console.error(`Failed to update component with name "${componentName}":`, {
      error: handledError,
      requestBody,
    })

    event.node.res.statusCode = handledError.statusCode || 500
    response = {
      success: false,
      message:
        handledError.message ||
        `Failed to update component with name ${componentName}.`,
      statusCode: event.node.res.statusCode,
    }
  }

  return response
})
