// POST /api/appmaker/graduate-request — appmaker/t-010, GITHUB-APP-DESIGN.md
// §5c: file an admin-only request to graduate an existing monorepo app
// (apps/<slug>/) out to its own standalone external repo.
//
// This endpoint only files the request — same Todo-filing pattern as
// scaffold-request.post.ts / github/create-app.post.ts. It does NOT push
// anything to GitHub or touch the monorepo. Silas's 2026-09-07 default-
// recommendation decision (see conductor appmaker/t-010's roadmap note)
// resolved the three open design questions that previously blocked this
// task:
//   1. History mechanism: squash-graduate (single commit), not a full
//      git-subtree-split replay — far less new-code risk.
//   2. Ownership: a monorepo app has no individual owner, so only an admin
//      may request its graduation.
//   3. Target repo: must be an already-connected GitHub installation's
//      already-granted repo — this endpoint never creates a repo.
//
// The actual squash-push executor (mint an installation token, build a
// single commit via the Git Data API, open the initial PR/push, then the
// monorepo-removal PR) is NOT implemented here — it is real, separate,
// higher-risk infrastructure (see appmakerGithub.ts's own note that
// pushScaffoldBranchAndOpenPr's per-file Contents-API loop is the wrong
// shape for a single-commit squash into a brand-new repo). The Todo filed
// below says so explicitly rather than pointing at a follow-up endpoint
// that does not exist yet, so a Worker cycle does not mistake it for
// actionable-now the way scaffold Todos are.
import { defineEventHandler, readBody, createError, H3Error } from 'h3'
import prisma from '@/server/utils/prisma'
import { errorHandler } from '@/server/utils/error'
import { requireAdminApiUser } from '@/server/utils/authGuard'
import { listInstallationRepositories } from '@/server/utils/appmakerGithub'
import { conductorList } from '~/server/utils/conductor-github'

type GraduateRequestBody = {
  slug?: string
  installationId?: number
  owner?: string
  repo?: string
}

function getWorkerUserId(): number {
  const raw = Number(process.env.BETA_ADMIN_USER_ID || 1)
  return Number.isInteger(raw) && raw > 0 ? raw : 1
}

export default defineEventHandler(async (event) => {
  try {
    const { user } = await requireAdminApiUser(event)
    const body = await readBody<GraduateRequestBody>(event)

    const slug = body.slug?.trim().toLowerCase()
    if (!slug) {
      throw createError({ statusCode: 400, message: 'slug is required.' })
    }

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

    // The app must actually be a monorepo app today (apps/<slug>/ exists in
    // the conductor repo) — graduating something that isn't there, or that
    // was already created as an external AppRepo, doesn't mean anything.
    const entries = await conductorList('apps')
    const isScaffolded = (entries ?? []).some(
      (entry) => entry.type === 'dir' && entry.name === slug,
    )
    if (!isScaffolded) {
      throw createError({
        statusCode: 404,
        message: `'${slug}' is not a scaffolded monorepo app (apps/${slug}/ not found).`,
      })
    }

    // Any existing AppRepo row for this slug means it's already external —
    // already graduated, or a graduation request is already in flight.
    const existingAppRepo = await prisma.appRepo.findFirst({
      where: { slug },
      select: { id: true },
    })
    if (existingAppRepo) {
      throw createError({
        statusCode: 409,
        message: `'${slug}' already has an AppRepo (already graduated, or a graduation request is already filed).`,
      })
    }

    // The installation must belong to the requesting admin, and GitHub must
    // currently report the target repo as granted — never trust owner/repo
    // from the client alone (same check as github/create-app.post.ts).
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

    // Link the Todo to the app's existing Project when one exists (every
    // real scaffolded app has one — scripts/new_app.py seeds it), matching
    // scaffold.post.ts's lookup. Best-effort: a Project isn't required to
    // link an AppRepo, and its absence shouldn't block the request.
    const project = await prisma.project.findFirst({
      where: { OR: [{ slug }, { conductorSlug: slug }] },
      select: { id: true },
    })

    const { appRepo, todo } = await prisma.$transaction(async (tx) => {
      const appRepo = await tx.appRepo.create({
        data: {
          slug,
          owner,
          repo,
          subPath: '',
          installationId: installation.id,
          userId: user.id,
        },
      })

      // The Worker only reads its own Todo queue (same convention as the
      // two self-serve flows); filed under the worker account. Unlike
      // create-app.post.ts, this deliberately does NOT say "Call: POST
      // /api/..." — no executor endpoint exists yet, so saying so would be
      // a Todo the Worker can never actually complete.
      const todo = await tx.todo.create({
        data: {
          title: `Graduate app '${slug}' to its own repo`,
          description: [
            `Admin graduation request from user ${user.id}.`,
            `Target: ${owner}/${repo} (installation ${installation.id}, AppRepo ${appRepo.id}).`,
            `'${slug}' currently lives in the kind_robots monorepo at apps/${slug}/.`,
            'No automated executor exists yet for this request: building the ' +
              'squash-graduation push (a single commit into the target repo, ' +
              'via the Git Data API — not pushScaffoldBranchAndOpenPr, which ' +
              'produces one commit per file) plus the monorepo-removal PR is ' +
              "tracked in Conductor as appmaker/t-010's remaining scope. Do " +
              'not attempt this by hand from this Todo alone; wait for the ' +
              'executor to land, then it (or a human running the graduation ' +
              'manually) closes this Todo.',
            `AppRepo ${appRepo.id} already exists (slug parity) — do not create another.`,
          ].join('\n'),
          status: 'OPEN',
          priority: 'NORMAL',
          category: 'AGENT',
          userId: getWorkerUserId(),
          projectId: project?.id,
        },
      })

      return { appRepo, todo }
    })

    event.node.res.statusCode = 201
    return {
      success: true,
      data: {
        slug,
        appRepoId: appRepo.id,
        todoId: todo.id,
      },
    }
  } catch (error) {
    if (error instanceof H3Error) throw error
    return errorHandler(error)
  }
})
