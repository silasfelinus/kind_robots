// POST /api/appmaker/scaffold-request — self-serve app creation (appmaker/t-004).
// Creates the first-class Project owned by the requesting user, then files an
// AGENT Todo under the worker account so the next Worker cycle runs
// scripts/new_app.py. Server-side caps apply; no admin gate by design.
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
    const [existingProject, existingDream] = await Promise.all([
      prisma.project.findFirst({
        where: { OR: [{ slug }, { conductorSlug: slug }] },
        select: { id: true },
      }),
      prisma.dream.findUnique({
        where: { slug },
        select: { id: true },
      }),
    ])

    if (existingProject || existingDream) {
      throw createError({ statusCode: 409, message: `Slug '${slug}' is already taken.` })
    }

    const isAdmin = user.Role === 'ADMIN' || user.id === 1
    await enforceProjectCap({ userId: user.id, userRole: user.Role, isAdmin })

    const scaffoldCommand =
      `python scripts/new_app.py ${slug} --title "${title}"` +
      (description ? ` --description "${description.replace(/"/g, "'")}"` : '')

    const { project, todo } = await prisma.$transaction(async (tx) => {
      const project = await tx.project.create({
        data: {
          title,
          slug,
          conductorSlug: slug,
          description,
          status: 'ACTIVE',
          priority: 'NORMAL',
          userId: user.id,
          isPublic: true,
          isActive: true,
        },
      })

      // The Worker only reads its own Todo queue, so the request is filed under
      // the worker account while remaining scoped to the requester's Project.
      const todo = await tx.todo.create({
        data: {
          title: `Scaffold new app '${slug}' with scripts/new_app.py`,
          description: [
            `AppMaker self-serve request from user ${user.id}.`,
            `Run: ${scaffoldCommand}`,
            `Project ${project.id} already exists (slug parity) — do not create another.`,
          ].join('\n'),
          status: 'OPEN',
          priority: 'NORMAL',
          category: 'AGENT',
          userId: getWorkerUserId(),
          projectId: project.id,
        },
      })

      return { project, todo }
    })

    event.node.res.statusCode = 201
    return {
      success: true,
      data: {
        projectId: project.id,
        dreamId: null,
        slug,
        todoId: todo.id,
      },
    }
  } catch (error) {
    if (error instanceof H3Error) throw error
    return errorHandler(error)
  }
})
