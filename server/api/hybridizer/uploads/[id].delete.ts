import { createError, defineEventHandler, getRouterParam } from 'h3'
import prisma from '~/server/utils/prisma'
import { errorHandler } from '~/server/utils/error'
import { requireApiUser } from '~/server/utils/authGuard'

// Owner removes an uploaded ingredient: it can no longer start new fusions and
// its image is deactivated so it stops being served. Earlier private fusions
// keep their own rendered artwork.
export default defineEventHandler(async (event) => {
  try {
    const { user } = await requireApiUser(event)
    const id = getRouterParam(event, 'id') ?? ''
    if (!/^[a-f0-9]{24}$/.test(id))
      throw createError({ statusCode: 400, message: 'Invalid upload.' })
    const upload = await prisma.hybridizerUpload.findUnique({ where: { id } })
    if (!upload || upload.ownerUserId !== user.id || !upload.isActive)
      throw createError({ statusCode: 404, message: 'Upload not found.' })
    await prisma.$transaction([
      prisma.hybridizerUpload.update({
        where: { id },
        data: { isActive: false },
      }),
      prisma.artImage.updateMany({
        where: { id: upload.artImageId, userId: user.id },
        data: { isActive: false },
      }),
    ])
    return { success: true, data: { key: 'upload:' + id, removed: true } }
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
