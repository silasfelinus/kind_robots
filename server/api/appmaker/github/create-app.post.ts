// POST /api/appmaker/github/create-app — self-serve app creation on an
// external repo the user already granted the GitHub App (appmaker/t-009,
// GITHUB-APP-DESIGN.md §5b steps 1-2). Mirrors scaffold-request.post.ts's
// monorepo flow, but writes an AppRepo (installationId set) instead of
// scaffolding into apps/<slug>/, and files a Todo asking the Worker to
// trigger POST /api/appmaker/github/scaffold rather than scripts/new_app.py.
import { defineEventHandler, readBody, createError, H3Error } from 'h3'
import prisma from '@/server/utils/prisma'
import { errorHandler } from '@/server/utils/error'
import { requireApiUser } from '@/server/utils/authGuard'
import { enforceProjectCap } from '@/server/utils/projectCap'
import { listInstallationRepositories } from '@/server/utils/appmakerGithub'

const SLUG_RE = /^[a-z][a-z0-9-]{1,40}$/

type CreateAppBody = {
  installationId?: number
  owner?: string
  repo?: string
  subPath?: string
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
    const body = await readBody<CreateAppBody>(event)

    const installationId = Number(body.installationId)
    if (!Number.isInteger(installationId) || installationId <= 0) {
      throw createError({
        statusCode: 400,
        message: 'installationId is required.',
      })
    }
    const owner = body.owner?.trim()
    const repo = body.repo?.trim()
    if (!owner || !repo) {
      throw createError({
        statusCode: 400,
        message: 'owner and repo are required.',
      })
    }
    const subPath = body.subPath?.trim().replace(/^\/+|\/+$/g, '') ?? ''

    const title = body.title?.trim()
    if (!title) {
      throw createError({ statusCode: 400, message: 'title is required.' })
    }
    if (title.length > 200) {
      throw createError({
        statusCode: 400,
        message: 'title must be 200 characters or fewer.',
      })
    }

    const slug = body.slug?.trim()
      ? body.slug.trim().toLowerCase()
      : slugify(title)
    if (!SLUG_RE.test(slug)) {
      throw createError({
        statusCode: 400,
        message:
          'slug must be kebab-case: start with a letter, then letters/digits/hyphens.',
      })
    }

    const description = body.description?.trim() || null
    if (description && description.length > 1000) {
      throw createError({
        statusCode: 400,
        message: 'description must be 1000 characters or fewer.',
      })
    }

    // The installation must belong to this user, and GitHub must currently
    // report the repo as granted — never trust owner/repo from the client
    // alone, or any user could point AppMaker at a repo they don't control.
    const installation = await prisma.githubInstallation.findFirst({
      where: { id: installationId, userId: user.id },
    })
    if (!installation) {
      throw createError({
        statusCode: 404,
        message: 'GitHub installation not found.',
      })
    }
    if (installation.suspendedAt) {
      throw createError({
        statusCode: 409,
        message: 'This GitHub installation is suspended.',
      })
    }

    const granted = await listInstallationRepositories(
      Number(installation.installationId),
    )
    const isGranted = granted.some((r) => r.owner === owner && r.repo === repo)
    if (!isGranted) {
      throw createError({
        statusCode: 403,
        message: `${owner}/${repo} is not among the repos granted to this installation.`,
      })
    }

    const [existingProject, existingDream, existingAppRepo] = await Promise.all(
      [
        prisma.project.findFirst({
          where: { OR: [{ slug }, { conductorSlug: slug }] },
          select: { id: true },
        }),
        prisma.dream.findUnique({ where: { slug }, select: { id: true } }),
        prisma.appRepo.findUnique({
          where: { slug_userId: { slug, userId: user.id } },
          select: { id: true },
        }),
      ],
    )

    if (existingProject || existingDream || existingAppRepo) {
      throw createError({
        statusCode: 409,
        message: `Slug '${slug}' is already taken.`,
      })
    }

    const isAdmin = user.Role === 'ADMIN' || user.id === 1
    await enforceProjectCap({ userId: user.id, userRole: user.Role, isAdmin })

    const { project, appRepo, todo } = await prisma.$transaction(async (tx) => {
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

      const appRepo = await tx.appRepo.create({
        data: {
          slug,
          owner,
          repo,
          subPath,
          installationId: installation.id,
          userId: user.id,
        },
      })

      // The Worker only reads its own Todo queue (same convention as
      // scaffold-request.post.ts); the request is filed under the worker
      // account while remaining scoped to the requester's Project/AppRepo.
      const todo = await tx.todo.create({
        data: {
          title: `Scaffold external app '${slug}' via AppMaker GitHub integration`,
          description: [
            `AppMaker external-repo request from user ${user.id}.`,
            `Repo: ${owner}/${repo}${subPath ? ` (subPath: ${subPath})` : ''}`,
            `Call: POST /api/appmaker/github/scaffold with { "appRepoId": ${appRepo.id} }`,
            `Project ${project.id} and AppRepo ${appRepo.id} already exist (slug parity) — do not create another.`,
          ].join('\n'),
          status: 'OPEN',
          priority: 'NORMAL',
          category: 'AGENT',
          userId: getWorkerUserId(),
          projectId: project.id,
        },
      })

      return { project, appRepo, todo }
    })

    event.node.res.statusCode = 201
    return {
      success: true,
      data: {
        projectId: project.id,
        appRepoId: appRepo.id,
        slug,
        todoId: todo.id,
      },
    }
  } catch (error) {
    if (error instanceof H3Error) throw error
    return errorHandler(error)
  }
})
