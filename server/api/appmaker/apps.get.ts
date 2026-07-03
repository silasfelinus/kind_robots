// GET /api/appmaker/apps — the AppMaker inventory (appmaker/t-004).
// scaffolded: slugs with a workspace folder at apps/<slug>/ in the conductor repo.
// pending:    open scaffold-request todos whose folder hasn't landed yet.
import { defineEventHandler, H3Error } from 'h3'
import prisma from '@/server/utils/prisma'
import { errorHandler } from '@/server/utils/error'
import { conductorList } from '~/server/utils/conductor-github'

const SCAFFOLD_TITLE_RE = /^Scaffold new app '([a-z0-9-]+)'/

export default defineEventHandler(async () => {
  try {
    const entries = await conductorList('apps')
    const scaffolded = (entries ?? [])
      .filter((entry) => entry.type === 'dir')
      .map((entry) => entry.name)
      .sort()

    const openScaffoldTodos = await prisma.todo.findMany({
      where: {
        status: 'OPEN',
        category: 'AGENT',
        title: { startsWith: "Scaffold new app '" },
      },
      select: { title: true, dreamId: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    })

    const pending = openScaffoldTodos
      .map((todo) => {
        const slug = SCAFFOLD_TITLE_RE.exec(todo.title)?.[1]
        return slug
          ? { slug, dreamId: todo.dreamId, requestedAt: todo.createdAt }
          : null
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .filter((item) => !scaffolded.includes(item.slug))

    return { success: true, data: { scaffolded, pending } }
  } catch (error) {
    if (error instanceof H3Error) throw error
    return errorHandler(error)
  }
})
