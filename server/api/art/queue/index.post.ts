// /server/api/art/queue/index.post.ts
//
// Enqueue a durable art generation job. Producers (conductor scripts, UI)
// POST here instead of holding a live generation request open; the home
// relay agent claims jobs outward via /api/art/queue/claim and completes
// them via /api/art/queue/[id]/complete. See ArtJob in schema.prisma.
import { createError, defineEventHandler, readBody } from 'h3'
import prisma from '../../../utils/prisma'
import { errorHandler } from '../../../utils/error'
import { requireMachineUser } from '../../../utils/authGuard'

const ENGINES = new Set(['A1111', 'COMFY'])
const SLUG_PATTERN = /^[a-z0-9][a-z0-9_-]*$/

type QueueRequestBody = {
  engine?: string | null
  payload?: Record<string, unknown> | null
  priority?: number | null
  projectSlug?: string | null
}

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireMachineUser(event)
    const body = (await readBody(event)) as QueueRequestBody | null

    const engine = String(body?.engine || 'A1111').toUpperCase()

    if (!ENGINES.has(engine)) {
      throw createError({
        statusCode: 400,
        message: `Unsupported engine "${engine}". Use one of: ${[...ENGINES].join(', ')}.`,
      })
    }

    const payload = body?.payload

    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      throw createError({
        statusCode: 400,
        message:
          'Missing required field "payload" (object with the generation request, e.g. promptString/width/height for A1111 or a workflow for COMFY).',
      })
    }

    const projectSlug = body?.projectSlug?.trim().toLowerCase() || null

    if (projectSlug && !SLUG_PATTERN.test(projectSlug)) {
      throw createError({ statusCode: 400, message: 'Invalid projectSlug.' })
    }

    const priority = Number.isInteger(body?.priority) ? Number(body?.priority) : 0

    const job = await prisma.artJob.create({
      data: {
        engine: engine as 'A1111' | 'COMFY',
        payload: payload as object,
        priority,
        projectSlug,
        userId: auth.user.id,
      },
    })

    event.node.res.statusCode = 201

    return {
      success: true,
      message: 'Art job queued.',
      data: { job },
      statusCode: 201,
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    const statusCode = handled.statusCode || 500

    event.node.res.statusCode = statusCode

    return {
      success: false,
      message: handled.message || 'Failed to queue art job.',
      statusCode,
    }
  }
})
