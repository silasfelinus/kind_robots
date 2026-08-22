// GET /api/appmaker/apps — the AppMaker inventory (appmaker/t-004).
// scaffolded: slugs with a workspace folder at apps/<slug>/ in the conductor repo.
// pending:    open scaffold-request Todos whose folder hasn't landed yet.
import { defineEventHandler, H3Error } from 'h3'
import prisma from '@/server/utils/prisma'
import { errorHandler } from '@/server/utils/error'
import { conductorList } from '~/server/utils/conductor-github'

// Two self-serve flows file a scaffold Todo: scaffold-request.post.ts (the
// monorepo apps/<slug>/ flow, "Scaffold new app '<slug>' ...") and
// github/create-app.post.ts (the external-repo GitHub-integration flow,
// appmaker/t-009, "Scaffold external app '<slug>' via AppMaker GitHub
// integration"). This route only ever recognized the first pattern — the
// `startsWith` filter below excluded every external-repo Todo before it even
// reached the regex, so a request filed through create-app.post.ts (already
// API-reachable with no front-end wired up yet, per t-012's 2026-08-21 cycle)
// would never appear in the "Being built" pending list: a real, open Todo
// waiting for the next Worker cycle, silently invisible to the requester.
const SCAFFOLD_TITLE_RE = /^Scaffold (?:new|external) app '([a-z0-9-]+)'/

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
        OR: [
          { title: { startsWith: "Scaffold new app '" } },
          { title: { startsWith: "Scaffold external app '" } },
        ],
      },
      select: {
        title: true,
        projectId: true,
        dreamId: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    const pending = openScaffoldTodos
      .map((todo) => {
        const slug = SCAFFOLD_TITLE_RE.exec(todo.title)?.[1]
        return slug
          ? {
              slug,
              projectId: todo.projectId,
              dreamId: todo.dreamId,
              requestedAt: todo.createdAt,
            }
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
