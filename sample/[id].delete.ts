// @ts-nocheck
/* eslint-disable */
// test-ignore

// server/api/samples/[id].delete.ts
//
// TEMPLATE: single-record delete for a fictional `Sample` model.
// To copy for a new model: swap `sample` for your prisma model accessor,
// rename "Sample" in the messages, and keep the ownership + admin-bypass
// check exactly as written.
import { defineEventHandler, createError } from 'h3'
import prisma from '../../utils/prisma'
import { errorHandler } from '../../utils/error'
import { validateApiKey } from '../../utils/validateKey'

export default defineEventHandler(async (event) => {
  let id: number | null = null

  try {
    id = Number(event.context.params?.id)

    if (!Number.isInteger(id) || id <= 0) {
      throw createError({
        statusCode: 400,
        message: 'Invalid sample ID. It must be a positive integer.',
      })
    }

    const { isValid, user } = await validateApiKey(event)

    if (!isValid || !user) {
      throw createError({
        statusCode: 401,
        message: 'Invalid or expired token.',
      })
    }

    // Fetch just the owner column for the permission check.
    const existingSample = await prisma.sample.findUnique({
      where: { id },
      select: { userId: true },
    })

    if (!existingSample) {
      throw createError({
        statusCode: 404,
        message: `Sample with ID ${id} does not exist.`,
      })
    }

    // Ownership check with admin bypass (Role ADMIN or the id-1 system user).
    const isAdmin = user.Role === 'ADMIN' || user.id === 1

    if (existingSample.userId !== user.id && !isAdmin) {
      throw createError({
        statusCode: 403,
        message: 'You are not authorized to delete this sample.',
      })
    }

    await prisma.sample.delete({ where: { id } })

    event.node.res.statusCode = 200

    return {
      success: true,
      message: `Sample with ID ${id} successfully deleted.`,
      statusCode: 200,
    }
  } catch (error: unknown) {
    const handledError = errorHandler(error)
    event.node.res.statusCode = handledError.statusCode || 500

    return {
      success: false,
      message: handledError.message || `Failed to delete sample with ID ${id}.`,
      statusCode: event.node.res.statusCode,
    }
  }
})
