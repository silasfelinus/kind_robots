// @ts-nocheck
/* eslint-disable */
// test-ignore

// /server/api/icons/[id].patch.ts
import { defineEventHandler, createError, readBody } from 'h3'
import prisma from './../utils/prisma'
import { errorHandler } from './../utils/error'
import { validateApiKey } from './../utils/validateKey'
import type { Prisma } from '~/server/generated/prisma'

export default defineEventHandler(async (event) => {
  let id
  let response

  try {
    id = Number(event.context.params?.id)
    if (isNaN(id) || id <= 0) {
      throw createError({
        statusCode: 400,
        message: 'Invalid SmartIcon ID. It must be a positive integer.',
      })
    }

    const { isValid, user } = await validateApiKey(event)
    if (!isValid || !user) {
      throw createError({
        statusCode: 401,
        message: 'Invalid or expired token.',
      })
    }

    const userId = user.id

    const existingIcon = await prisma.smartIcon.findUnique({
      where: { id },
    })
    if (!existingIcon) {
      throw createError({
        statusCode: 404,
        message: 'SmartIcon not found.',
      })
    }

    if (existingIcon.userId !== userId && user.Role !== 'ADMIN') {
      throw createError({
        statusCode: 403,
        message: 'You do not have permission to update this SmartIcon.',
      })
    }

    const iconData: Prisma.SmartIconUpdateInput = await readBody(event)
    if (!iconData || Object.keys(iconData).length === 0) {
      throw createError({
        statusCode: 400,
        message: 'No data provided for update.',
      })
    }

    const data = await prisma.smartIcon.update({
      where: { id },
      data: iconData,
    })

    response = {
      success: true,
      message: 'SmartIcon updated successfully.',
      data,
      statusCode: 200,
    }
    event.node.res.statusCode = 200
  } catch (error: unknown) {
    const handledError = errorHandler(error)
    event.node.res.statusCode = handledError.statusCode || 500
    response = {
      success: false,
      message:
        handledError.message || `Failed to update SmartIcon with ID ${id}.`,
      statusCode: event.node.res.statusCode,
    }
  }

  return response
})
