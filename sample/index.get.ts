// @ts-nocheck
/* eslint-disable */
// test-ignore

// server/api/samples/index.get.ts
//
// TEMPLATE: list endpoint for a fictional `Sample` model.
// To copy for a new model:
//   1. Replace `sample` with your prisma client accessor (prisma.yourModel).
//   2. Rename "Sample"/"samples" in messages and the path comment above.
//   3. If your model has no isPublic/userId columns, drop the visibility
//      filter and just findMany({ orderBy: ... }).
import { defineEventHandler } from 'h3'
import prisma from '../../utils/prisma'
import { errorHandler } from '../../utils/error'
import { validateApiKey } from '../../utils/validateKey'

export default defineEventHandler(async (event) => {
  try {
    // Auth is OPTIONAL here: anonymous callers get public rows only,
    // authenticated callers also see their own private rows.
    const { isValid, user } = await validateApiKey(event)

    const where =
      isValid && user
        ? { OR: [{ isPublic: true }, { userId: user.id }] }
        : { isPublic: true }

    const data = await prisma.sample.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      // Add `include`/`select` here if callers need relations (see
      // server/api/scenarios/index.get.ts for a select-map example).
    })

    event.node.res.statusCode = 200

    return {
      success: true,
      message: 'Samples fetched successfully.',
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
