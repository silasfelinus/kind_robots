// /server/api/pantheon/[id].get.ts
import { defineEventHandler } from 'h3'
import prisma from './../utils/prisma'
import { errorHandler } from './../utils/error'
import { validateApiKey } from './../utils/validateKey'

export default defineEventHandler(async (event) => {
  const modelName = 'pantheon'
  try {
    const id = Number(event.context.params?.id)
    if (Number.isNaN(id)) {
      event.node.res.statusCode = 400
      return { success: false, message: 'Invalid id' }
    }

    const { isValid, user } = await validateApiKey(event)
    const record = await prisma.pantheon.findUnique({ where: { id } })
    if (!record) {
      event.node.res.statusCode = 404
      return { success: false, message: `${modelName} not found` }
    }

    const isOwner = user?.id === record.userId
    const isEditor =
      Array.isArray(record.editorIds) && user?.id
        ? (record.editorIds as number[]).includes(user.id)
        : false

    if (!record.isPublic && !(isValid && (isOwner || isEditor))) {
      event.node.res.statusCode = 403
      return { success: false, message: 'Forbidden' }
    }

    event.node.res.statusCode = 200
    return { success: true, data: record }
  } catch (error) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return {
      success: false,
      message: handled.message || 'Failed to fetch pantheon',
    }
  }
})
