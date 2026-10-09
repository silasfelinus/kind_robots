import { createError, defineEventHandler, readBody } from 'h3'
import prisma from '~/server/utils/prisma'
import { requireAdminApiUser } from '~/server/utils/authGuard'
import {
  buildArtImageWhere,
  getArtImageAccessContext,
} from '~/server/utils/artImageAccess'
import { loadZuzuArtLedger } from '~/server/utils/zuzuWorldLedger'
import { errorHandler } from '~/server/utils/error'
import { isZuzuProjectSlug } from '~/utils/zuzuWorld'

type AssignmentBody = {
  artImageIds?: unknown
  projectIds?: unknown
  action?: unknown
}

function ids(value: unknown, max: number, label: string): number[] {
  if (!Array.isArray(value) || !value.length || value.length > max) {
    throw createError({ statusCode: 400, message: `Select 1–${max} ${label}.` })
  }
  const unique = [...new Set(value)]
  if (
    unique.length !== value.length ||
    !unique.every(
      (id) => typeof id === 'number' && Number.isSafeInteger(id) && id > 0,
    )
  ) {
    throw createError({ statusCode: 400, message: `Invalid ${label} IDs.` })
  }
  return unique
}

export default defineEventHandler(async (event) => {
  try {
    await requireAdminApiUser(event)
    const access = await getArtImageAccessContext(event)
    if (!access.isAdmin) {
      throw createError({ statusCode: 403, message: 'Admin access required.' })
    }
    const body = await readBody<AssignmentBody>(event)
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      throw createError({ statusCode: 400, message: 'Invalid assignment.' })
    }
    const artImageIds = ids(body.artImageIds, 48, 'art images')
    const projectIds = ids(body.projectIds, 8, 'projects')
    const action = body.action
    if (action !== 'link' && action !== 'unlink') {
      throw createError({ statusCode: 400, message: 'Use link or unlink.' })
    }

    const ledger = await loadZuzuArtLedger()
    if (artImageIds.some((id) => !ledger.items.has(id))) {
      throw createError({
        statusCode: 400,
        message: 'Unknown Zuzu source artwork.',
      })
    }

    const [images, projects] = await Promise.all([
      prisma.artImage.findMany({
        where: {
          AND: [
            buildArtImageWhere(access),
            { id: { in: artImageIds } },
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
      prisma.project.findMany({
        where: { id: { in: projectIds }, isActive: true },
        select: { id: true, conductorSlug: true },
      }),
    ])
    if (images.length !== artImageIds.length) {
      throw createError({
        statusCode: 403,
        message: 'One or more images are not accessible.',
      })
    }
    if (
      projects.length !== projectIds.length ||
      !projects.every(
        (project) =>
          project.conductorSlug && isZuzuProjectSlug(project.conductorSlug),
      )
    ) {
      throw createError({
        statusCode: 400,
        message: 'Invalid Zuzu production selection.',
      })
    }

    const data = artImageIds.flatMap((artImageId) =>
      projectIds.map((projectId) => ({ artImageId, projectId })),
    )
    const result =
      action === 'link'
        ? await prisma.projectArtImage.createMany({
            data,
            skipDuplicates: true,
          })
        : await prisma.projectArtImage.deleteMany({
            where: {
              OR: data.map(({ projectId, artImageId }) => ({
                projectId,
                artImageId,
              })),
            },
          })

    return {
      success: true,
      data: { changed: result.count, references: data.length, action },
      message:
        action === 'link'
          ? `Linked ${result.count} new project references. Originals were not copied.`
          : `Unlinked ${result.count} references. Original art was preserved.`,
      statusCode: 200,
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return {
      success: false,
      message: handled.message || 'Unable to update project art links.',
      statusCode: handled.statusCode || 500,
    }
  }
})
