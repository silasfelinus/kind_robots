import { createError, defineEventHandler, getRouterParam } from 'h3'
import prisma from '~/server/utils/prisma'
import { errorHandler } from '~/server/utils/error'
import { requireApiUser } from '~/server/utils/authGuard'
import {
  requireVisibleFusion,
  requireFusionEditor,
  versionJobs,
  versionProjectSlug,
  visibleVersionArt,
} from '~/server/utils/hybridizerVersions'

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireApiUser(event)
    const id = getRouterParam(event, 'id') ?? ''
    versionProjectSlug(id)
    const jobId = Number(getRouterParam(event, 'jobId'))
    if (!Number.isSafeInteger(jobId) || jobId <= 0)
      throw createError({ statusCode: 400, message: 'Invalid revision.' })
    const fusion = await prisma.hybridizerFusion.findUnique({ where: { id } })
    requireVisibleFusion(fusion, auth.user.id)
    requireFusionEditor(fusion, auth.user.id, auth.isAdmin)

    const jobs = await versionJobs(fusion)
    const chosen = jobs.find((job) => job.id === jobId)
    if (!chosen || chosen.status !== 'DONE')
      throw createError({ statusCode: 409, message: 'Only delivered versions can become primary.' })
    const image = await visibleVersionArt(chosen.artImageId, fusion, auth.user.id)
    if (!image)
      throw createError({ statusCode: 409, message: 'This version has no accessible delivered illustration.' })
    await prisma.hybridizerFusion.update({
      where: { id },
      data: { artJobId: jobId, artImageId: image.id, status: 'READY' },
    })
    return { success: true, data: { jobId, artImageId: image.id, imagePath: image.imagePath } }
  } catch (error) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode ?? 500
    return { success: false, message: handled.message, statusCode: event.node.res.statusCode }
  }
})
