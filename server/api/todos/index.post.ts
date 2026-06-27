// /server/api/todos/index.post.ts
import { defineEventHandler, readBody, createError, H3Error } from 'h3'
import prisma from '@/server/utils/prisma'
import { errorHandler } from '@/server/utils/error'
import { requireApiUser } from '@/server/utils/authGuard'
import type { Todo } from '@/stores/todoStore'

type TodoCreateBody = {
  title: string
  description?: string | null
  priority?: 'LOW' | 'NORMAL' | 'HIGH'
  dueDate?: string | null
  icon?: string | null
  imagePath?: string | null
}

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireApiUser(event)
    const userId = auth.user.id

    const body = await readBody<TodoCreateBody>(event)

    const title = body?.title?.trim()
    if (!title) {
      throw createError({ statusCode: 400, message: 'title is required' })
    }

    const priority = ['LOW', 'NORMAL', 'HIGH'].includes(body.priority ?? '')
      ? body.priority!
      : 'NORMAL'

    await prisma.$executeRaw`
      INSERT INTO \`Todo\` (title, description, status, priority, dueDate, icon, imagePath, userId, createdAt, updatedAt)
      VALUES (
        ${title},
        ${body.description ?? null},
        'OPEN',
        ${priority},
        ${body.dueDate ?? null},
        ${body.icon ?? null},
        ${body.imagePath ?? null},
        ${userId},
        NOW(3),
        NOW(3)
      )
    `

    const [todo] = await prisma.$queryRaw<Todo[]>`
      SELECT * FROM \`Todo\` WHERE id = LAST_INSERT_ID()
    `

    event.node.res.statusCode = 201
    return { success: true, message: 'Todo created.', data: todo }
  } catch (error) {
    if (error instanceof H3Error) throw error
    return errorHandler(error)
  }
})
