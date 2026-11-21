import { defineEventHandler } from 'h3'
import prisma from '~/server/utils/prisma'
import { errorHandler } from '~/server/utils/error'
import { requireApiUser } from '~/server/utils/authGuard'
import { HYBRIDIZER_UPLOAD_ACTIVE_LIMIT } from '~/utils/hybridizer/uploadRules'
import { serializeHybridizerUpload } from '~/server/utils/hybridizerUploadDto'

// Only the signed-in owner's own active uploads. There is no listing of
// anyone else's uploads anywhere.
export default defineEventHandler(async (event) => {
  try {
    const { user } = await requireApiUser(event)
    const uploads = await prisma.hybridizerUpload.findMany({
      where: { ownerUserId: user.id, isActive: true },
      orderBy: { createdAt: 'desc' },
      take: HYBRIDIZER_UPLOAD_ACTIVE_LIMIT,
    })
    return { success: true, data: uploads.map(serializeHybridizerUpload) }
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
