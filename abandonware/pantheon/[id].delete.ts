// /server/api/pantheon/[id].delete.ts
import { defineEventHandler } from 'h3'
import prisma from '../../server/api/utils/prisma'
import { errorHandler } from '../../server/api/utils/error'
import { validateApiKey } from '../../server/api/utils/validateKey'

export default defineEventHandler(async (event) => {
  const modelName = 'pantheon'
  try {
    const id = Number(event.context.params?.id)
    if (Number.isNaN(id)) {
      event.node.res.statusCode = 400
      return { success: false, message: 'Invalid id' }
    }

    const { isValid, user } = await validateApiKey(event)
    if (!isValid || !user?.id) {
      event.node.res.statusCode = 401
      return { success: false, message: 'Unauthorized' }
    }

    const current = await prisma.pantheon.findUnique({ where: { id } })
    if (!current) {
      event.node.res.statusCode = 404
      return { success: false, message: `${modelName} not found` }
    }

    const isOwner = user.id === current.userId
    const isEditor =
      Array.isArray(current.editorIds) &&
      (current.editorIds as number[]).includes(user.id)
    if (!(isOwner || isEditor)) {
      event.node.res.statusCode = 403
      return { success: false, message: 'Forbidden' }
    }

    await prisma.pantheon.delete({ where: { id } })

    event.node.res.statusCode = 200
    return { success: true, message: `${modelName} deleted` }
  } catch (error) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return {
      success: false,
      message: handled.message || 'Failed to delete pantheon',
    }
  }
})
