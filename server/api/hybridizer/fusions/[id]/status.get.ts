import { createError, defineEventHandler, getRouterParam } from 'h3'
import prisma from '~/server/utils/prisma'
import { errorHandler } from '~/server/utils/error'
import { getOptionalApiUser } from '~/server/utils/authGuard'
import {
  hybridizerDeliverableUrl,
  hybridizerQueueState,
} from '~/server/utils/hybridizerArt'

export default defineEventHandler(async (event) => {
  try {
    const auth = await getOptionalApiUser(event)
    const id = getRouterParam(event, 'id') ?? ''
    if (!/^[a-f0-9]{64}$/.test(id))
      throw createError({
        statusCode: 400,
        message: 'Invalid fusion identifier.',
      })
    const fusion = await prisma.hybridizerFusion.findUnique({ where: { id } })
    if (!fusion || (!fusion.isPublic && fusion.creatorUserId !== auth?.user.id))
      throw createError({ statusCode: 404, message: 'Fusion not available.' })

    const job = fusion.artJobId
      ? await prisma.artJob.findUnique({ where: { id: fusion.artJobId } })
      : null
    const image =
      job?.status === 'DONE' && job.artImageId
        ? await prisma.artImage.findUnique({
            where: { id: job.artImageId },
            select: {
              id: true,
              imagePath: true,
              isPublic: true,
              isMature: true,
              isActive: true,
              userId: true,
            },
          })
        : null
    const accessible =
      image &&
      image.isActive !== false &&
      image.isMature !== true &&
      (fusion.isPublic
        ? image.isPublic === true
        : image.userId === fusion.creatorUserId ||
          image.userId === auth?.user.id)
    const imagePath = accessible
      ? hybridizerDeliverableUrl(image?.imagePath)
      : null
    const status = hybridizerQueueState(job?.status ?? null, imagePath)
    if (
      fusion.status !== status ||
      (status === 'READY' && fusion.artImageId !== image?.id)
    ) {
      await prisma.hybridizerFusion.update({
        where: { id },
        data: {
          status,
          ...(status === 'READY' && image ? { artImageId: image.id } : {}),
        },
      })
    }
    return {
      success: true,
      data: {
        key: 'fusion:' + id,
        title: fusion.title,
        artJobId: fusion.artJobId,
        status,
        imagePath,
        artImageId: status === 'READY' ? image?.id : null,
        canRetry:
          job?.status === 'FAILED' &&
          (job.userId === auth?.user.id || auth?.isAdmin === true),
      },
    }
  } catch (error) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode ?? 500
    return {
      success: false,
      message: handled.message,
      statusCode: event.node.res.statusCode,
    }
  }
})
