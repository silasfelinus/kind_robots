// @ts-nocheck
/* eslint-disable */
// test-ignore

// server/api/samples/[id].get.ts
//
// TEMPLATE: single-record fetch for a fictional `Sample` model.
// To copy for a new model: swap `sample` for your prisma model accessor and
// rename "Sample" in the messages. Add `include` if callers need relations.
import { defineEventHandler } from 'h3'
import prisma from '../../utils/prisma'
import { errorHandler } from '../../utils/error'

export default defineEventHandler(async (event) => {
  try {
    const id = Number(event.context.params?.id)

    if (!Number.isInteger(id) || id <= 0) {
      event.node.res.statusCode = 400

      return {
        success: false,
        message: 'Invalid sample ID. It must be a positive integer.',
        statusCode: 400,
      }
    }

    const data = await prisma.sample.findUnique({
      where: { id },
      // Add relations your consumers need, e.g.:
      // include: { ArtImage: true, User: { select: { id: true, username: true } } },
    })

    if (!data) {
      event.node.res.statusCode = 404

      return {
        success: false,
        message: 'Sample not found.',
        statusCode: 404,
      }
    }

    event.node.res.statusCode = 200

    return {
      success: true,
      message: 'Sample details fetched successfully.',
      data,
      statusCode: 200,
    }
  } catch (error: unknown) {
    const { success, message, statusCode } = errorHandler(error)
    const safeStatusCode = statusCode ?? 500

    event.node.res.statusCode = safeStatusCode

    return {
      success,
      message,
      statusCode: safeStatusCode,
    }
  }
})
