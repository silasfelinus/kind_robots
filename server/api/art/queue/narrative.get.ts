// /server/api/art/queue/narrative.get.ts
import { createError, defineEventHandler, getQuery } from 'h3'
import prisma from '../../../utils/prisma'
import { errorHandler } from '../../../utils/error'
import { requireMachineUser } from '../../../utils/authGuard'

const SLUG_PATTERN = /^[a-z0-9][a-z0-9_-]*$/
const ALLOWED_PRODUCTS = new Set(['storybook', 'taskmaster', 'davinci'])
const ALLOWED_MOMENTS = new Set([
  'opening',
  'chapter',
  'location',
  'character-introduction',
  'pivotal-event',
  'finale',
])

function queryText(value: unknown): string {
  return Array.isArray(value) ? String(value[0] || '').trim() : String(value || '').trim()
}

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const product = queryText(query.product)
    const sessionId = queryText(query.sessionId)
    const beatId = queryText(query.beatId)
    const moment = queryText(query.moment)
    const dedupeKey = queryText(query.dedupeKey)
    const projectSlug = queryText(query.projectSlug).toLowerCase() || null

    if (!ALLOWED_PRODUCTS.has(product)) {
      throw createError({ statusCode: 400, message: 'Invalid narrative product.' })
    }
    if (!sessionId || sessionId.length > 160 || !beatId || beatId.length > 160) {
      throw createError({
        statusCode: 400,
        message: 'Invalid narrative session or beat identity.',
      })
    }
    if (!ALLOWED_MOMENTS.has(moment)) {
      throw createError({ statusCode: 400, message: 'Invalid narrative art moment.' })
    }
    if (projectSlug && !SLUG_PATTERN.test(projectSlug)) {
      throw createError({ statusCode: 400, message: 'Invalid projectSlug.' })
    }

    const expectedKey = [product, sessionId, beatId, moment].join(':')
    if (dedupeKey !== expectedKey || dedupeKey.length > 400) {
      throw createError({
        statusCode: 400,
        message: 'Invalid narrative art dedupe key.',
      })
    }

    const { user } = await requireMachineUser(event)
    const job = await prisma.artJob.findFirst({
      where: {
        userId: user.id,
        projectSlug,
        status: { notIn: ['FAILED', 'CANCELLED'] },
        payload: { contains: `"dedupeKey":"${dedupeKey}"` },
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        status: true,
        artImageId: true,
        error: true,
      },
    })

    return {
      success: true,
      message: job
        ? 'Existing narrative art job found.'
        : 'No existing narrative art job found.',
      statusCode: 200,
      data: { job },
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return {
      success: false,
      message: handled.message || 'Failed to recover narrative art job.',
      statusCode: event.node.res.statusCode,
      data: { job: null },
    }
  }
})
