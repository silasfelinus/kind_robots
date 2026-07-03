// POST /api/appmaker/scaffold-request — self-serve app creation (appmaker/t-004).
// Creates the PROJECT Dream (slug parity) owned by the requesting user, then
// files an AGENT todo under the worker account so the next Worker cycle runs
// scripts/new_app.py. Server-side caps apply; no admin gate by design
// (Silas, 2026-07-02: build the self-serve end state).
import { defineEventHandler, readBody, createError, H3Error } from 'h3'
import prisma from '@/server/utils/prisma'
import { errorHandler } from '@/server/utils/error'
import { requireApiUser } from '@/server/utils/authGuard'
import { enforceProjectCap } from '@/server/utils/projectCap'

const SLUG_RE = /^[a-z][a-z0-9-]{1,40}$/

type ScaffoldRequestBody = {
  title?: string
  slug?: string
  description?: string
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
}

function getWorkerUserId(): number {
  const raw = Number(process.env.BETA_ADMIN_USER_ID || 1)
  return Number.isInteger(raw) && raw > 0 ? raw : 1
}

export default defineEventHandler(async (event) => {
  try {
    const { user } = await requireApiUser(event)
    const body = await readBody<ScaffoldRequestBody>(event)

    const title = body.title?.trim()
    if (!title) {
      throw createError({ statusCode: 400, message: 'title is required.' })
    }

    const slug = body.slug?.trim() ? body.slug.trim().toLowerCase() : slugify(title)
    if (!SLUG_RE.test(slug)) {
      throw createError({
        statusCode: 400,
        message: 'slug must be kebab-case: start with a letter, then letters/digits/hyphens.',
      })
    }

    const description = body.description?.trim() || null

    const existing = await prisma.dream.findUnique({
      where: { slug },
      select: { id: true },
    })
    if (existing) {
      throw createError({ statusCode: 409, message: `Slug '${slug}' is already taken.` })
    }

    const isAdmin = user.Role === 'ADMIN' || user.id === 1
    await enforceProjectCap({ userId: user.id, userRole: user.Role, isAdmin })

    const dream = await prisma.dream.create({
      data: {
        title,
        slug,
        description,
        dreamType: 'PROJECT',
        projectStatus: 'ACTIVE',
        userId: user.id,
        isPublic: true,
      },
    })

    // The Worker only reads its own todo queue (fetch_todos.py runs with the
    // worker account's token), so the request is filed there — not under the
    // requesting user.
    const scaffoldCommand =
      `python scripts/new_app.py ${slug} --title "${title}"` +
      (description ? ` --description "${description.replace(/"/g, "'")}"` : '')

    const todo = await prisma.todo.create({
      data: {
        title: `Scaffold new app '${slug}' with scripts/new_app.py`,
        description: [
          `AppMaker self-serve request from user ${user.id}.`,
          `Run: ${scaffoldCommand}`,
          `Dream ${dream.id} already exists (slug parity) — do not create another.`,
        ].join('\n'),
        status: 'OPEN',
        priority: 'NORMAL',
        category: 'AGENT',
        userId: getWorkerUserId(),
        dreamId: dream.id,
      },
    })

    event.node.res.statusCode = 201
    return {
      success: true,
      data: { dreamId: dream.id, slug, todoId: todo.id },
    }
  } catch (error) {
    if (error instanceof H3Error) throw error
    return errorHandler(error)
  }
})
