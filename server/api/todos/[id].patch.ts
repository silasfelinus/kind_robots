// /server/api/todos/[id].patch.ts
import { defineEventHandler, readBody, createError, getRouterParam } from 'h3'
import prisma from '@/server/utils/prisma'
import { errorHandler } from '@/server/utils/error'
import { requireApiUser } from '@/server/utils/authGuard'
import { assertOnlyFields } from '@/server/utils/chatApi'
import { todoMutationFields } from './mutation'
import type { Todo } from '@/stores/todoStore'

type TodoPatchBody = {
  title?: string
  description?: string | null
  status?: 'OPEN' | 'DONE' | 'ARCHIVED'
  priority?: 'LOW' | 'NORMAL' | 'HIGH'
  category?: 'AGENT' | 'KAIZEN' | 'HONEYDO' | 'DESIRED_FEATURE'
  dueDate?: string | null
  icon?: string | null
  imagePath?: string | null
  order?: number | null
}

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireApiUser(event)
    const userId = auth.user.id

    const rawId = getRouterParam(event, 'id')
    const id = parseInt(rawId ?? '', 10)
    if (!id || id <= 0) {
      throw createError({ statusCode: 400, message: 'Invalid todo id' })
    }

    const [current] = await prisma.$queryRaw<Todo[]>`
      SELECT * FROM \`Todo\` WHERE id = ${id} AND userId = ${userId}
    `
    if (!current) {
      throw createError({ statusCode: 404, message: 'Todo not found' })
    }

    const body = await readBody<TodoPatchBody>(event)
    if (!body || typeof body !== 'object' || Array.isArray(body) || !Object.keys(body).length) {
      throw createError({ statusCode: 400, message: 'No fields to update' })
    }

    assertOnlyFields(body as Record<string, unknown>, todoMutationFields, 'Todo')

    const title = body.title !== undefined ? (body.title.trim() || current.title) : current.title
    const description = 'description' in body ? (body.description ?? null) : current.description
    const status = ['OPEN', 'DONE', 'ARCHIVED'].includes(body.status ?? '')
      ? body.status!
      : current.status
    const priority = ['LOW', 'NORMAL', 'HIGH'].includes(body.priority ?? '')
      ? body.priority!
      : current.priority
    const category = ['AGENT', 'KAIZEN', 'HONEYDO', 'DESIRED_FEATURE'].includes(body.category ?? '')
      ? body.category!
      : (current.category ?? 'AGENT')
    const dueDate = 'dueDate' in body ? (body.dueDate ?? null) : current.dueDate
    const icon = 'icon' in body ? (body.icon ?? null) : current.icon
    const imagePath = 'imagePath' in body ? (body.imagePath ?? null) : current.imagePath
    const order = 'order' in body ? (body.order ?? null) : (current as Todo & { order?: number | null }).order ?? null

    await prisma.$executeRaw`
      UPDATE \`Todo\` SET
        title       = ${title},
        description = ${description},
        status      = ${status},
        priority    = ${priority},
        category    = ${category},
        dueDate     = ${dueDate},
        icon        = ${icon},
        imagePath   = ${imagePath},
        \`order\`   = ${order},
        updatedAt   = NOW(3)
      WHERE id = ${id} AND userId = ${userId}
    `

    const [updated] = await prisma.$queryRaw<Todo[]>`
      SELECT * FROM \`Todo\` WHERE id = ${id} AND userId = ${userId}
    `

    event.node.res.statusCode = 200
    return {
      success: true,
      message: 'Todo updated.',
      data: updated,
      statusCode: 200,
    }
  } catch (error) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500

    return {
      success: false,
      message: handled.message || 'Failed to update Todo.',
      data: null,
      statusCode: event.node.res.statusCode,
    }
  }
})
