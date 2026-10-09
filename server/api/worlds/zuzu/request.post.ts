import { createError, defineEventHandler, readBody } from 'h3'
import prisma from '~/server/utils/prisma'
import { requireAdminApiUser } from '~/server/utils/authGuard'
import {
  getArtImageAccessContext,
  buildArtImageWhere,
} from '~/server/utils/artImageAccess'
import { loadZuzuArtLedger } from '~/server/utils/zuzuWorldLedger'
import { isZuzuProjectSlug } from '~/utils/zuzuWorld'
import { errorHandler } from '~/server/utils/error'

type RequestInput = {
  artImageId?: unknown
  projectSlug?: unknown
  direction?: unknown
}

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireAdminApiUser(event)
    const access = await getArtImageAccessContext(event)
    if (!access.isAdmin) {
      throw createError({ statusCode: 403, message: 'Admin access required.' })
    }
    const body = await readBody<RequestInput>(event)
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      throw createError({ statusCode: 400, message: 'Invalid request.' })
    }
    const id = body.artImageId
    const projectSlug = body.projectSlug
    const direction =
      typeof body.direction === 'string' ? body.direction.trim() : ''
    if (
      typeof id !== 'number' ||
      !Number.isSafeInteger(id) ||
      id <= 0 ||
      typeof projectSlug !== 'string' ||
      !isZuzuProjectSlug(projectSlug) ||
      !direction ||
      direction.length > 4000
    ) {
      throw createError({
        statusCode: 400,
        message:
          'Provide a valid art ID, Zuzu production and instructions (up to 4000 characters).',
      })
    }
    const ledger = await loadZuzuArtLedger()
    if (!ledger.items.has(id)) {
      throw createError({
        statusCode: 404,
        message: 'This asset is not in the Zuzu registry.',
      })
    }
    const [art, project] = await Promise.all([
      prisma.artImage.findFirst({
        where: {
          AND: [
            buildArtImageWhere(access),
            { id },
            ...(access.showMature
              ? []
              : [
                  {
                    OR: [{ isMature: false }, { isMature: null }],
                  },
                ]),
          ],
        },
        select: { id: true },
      }),
      prisma.project.findFirst({
        where: { conductorSlug: projectSlug, isActive: true },
        select: { id: true },
      }),
    ])
    if (!art) {
      throw createError({
        statusCode: 403,
        message: 'Source artwork is not accessible.',
      })
    }
    const todo = await prisma.todo.create({
      data: {
        title: `Zuzu World: revise art #${id}`,
        description: [
          `Private Zuzu world visual change request.`,
          `Source ArtImage: #${id}`,
          `Target production: ${projectSlug}`,
          `Conductor ledger: ${ledger.items.get(id)?.source ?? 'unverified'}`,
          '',
          direction,
          '',
          'Preserve the original. Verify locked cast and VIDEO-GUARDRAILS. Use existing ArtJobs for any derived images and present new candidates for review before changing production links. Do not publish.',
        ].join('\n'),
        category: 'AGENT',
        status: 'OPEN',
        priority: 'NORMAL',
        userId: auth.user.id,
        projectId: project?.id ?? null,
      },
      select: { id: true, title: true, projectId: true },
    })
    return {
      success: true,
      data: todo,
      message: `Private agent Todo #${todo.id} saved for review. No render was queued.`,
      statusCode: 201,
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return {
      success: false,
      message: handled.message || 'Unable to create private art request.',
      statusCode: handled.statusCode || 500,
    }
  }
})
