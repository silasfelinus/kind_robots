// /server/api/todos/index.get.ts
import { defineEventHandler, getQuery } from 'h3'
import prisma from '@/server/utils/prisma'
import { errorHandler } from '@/server/utils/error'
import { requireApiUser } from '@/server/utils/authGuard'
import type { Todo } from '@/stores/todoStore'

const PRIORITY_ORDER: Record<string, number> = { HIGH: 0, NORMAL: 1, LOW: 2 }

function sortTodos(todos: Todo[]): Todo[] {
  return todos.sort((a, b) => {
    const pd = (PRIORITY_ORDER[a.priority] ?? 1) - (PRIORITY_ORDER[b.priority] ?? 1)
    if (pd !== 0) return pd
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })
}

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireApiUser(event)
    const userId = auth.user.id
    const { status, includeArchived } = getQuery(event)

    let todos: Todo[]

    if (typeof status === 'string' && ['OPEN', 'DONE', 'ARCHIVED'].includes(status)) {
      todos = await prisma.$queryRaw<Todo[]>`
        SELECT * FROM \`Todo\` WHERE userId = ${userId} AND status = ${status}
      `
    } else if (includeArchived) {
      todos = await prisma.$queryRaw<Todo[]>`
        SELECT * FROM \`Todo\` WHERE userId = ${userId}
      `
    } else {
      todos = await prisma.$queryRaw<Todo[]>`
        SELECT * FROM \`Todo\` WHERE userId = ${userId} AND status != 'ARCHIVED'
      `
    }

    return { success: true, data: sortTodos(todos) }
  } catch (error) {
    return errorHandler(error)
  }
})
