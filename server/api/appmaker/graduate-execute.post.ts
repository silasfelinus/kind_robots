// POST /api/appmaker/graduate-execute — appmaker/t-015, GITHUB-APP-DESIGN.md
// §5c: the actual squash-graduation push. graduate-request.post.ts only
// files the request (Todo + an AppRepo row already pointed at the target
// installation/repo); this endpoint is the separate, higher-risk mechanism
// that endpoint's own Todo explicitly said did not exist yet:
//
//   1. Read apps/<slug>/'s current tree out of the conductor monorepo.
//   2. Push it as a single squash commit onto the target repo's default
//      branch, via the target GithubInstallation's token.
//   3. Open a PR against conductor's own main removing apps/<slug>/.
//
// Both writes are real, irreversible mutations to repositories a bug here
// cannot cleanly undo (AGENTS.md hard rule 2: drafts, not live actions, at
// high stakes) -- admin-only, requires the graduation to have already been
// requested (an OPEN "Graduate app '<slug>' to its own repo" Todo, filed by
// graduate-request.post.ts), and re-validates the installation/grant exactly
// like the request step did rather than trusting the AppRepo row alone,
// since either can have changed in between.
import { defineEventHandler, readBody, createError, H3Error } from 'h3'
import prisma from '@/server/utils/prisma'
import { errorHandler } from '@/server/utils/error'
import { requireAdminApiUser } from '@/server/utils/authGuard'
import {
  listInstallationRepositories,
  readConductorAppTree,
  squashPushAppToRepo,
  openConductorAppRemovalPr,
} from '@/server/utils/appmakerGithub'

type GraduateExecuteBody = {
  slug?: string
}

const GRADUATE_TODO_TITLE = (slug: string) =>
  `Graduate app '${slug}' to its own repo`

export default defineEventHandler(async (event) => {
  try {
    await requireAdminApiUser(event)
    const body = await readBody<GraduateExecuteBody>(event)

    const slug = body.slug?.trim().toLowerCase()
    if (!slug) {
      throw createError({ statusCode: 400, message: 'slug is required.' })
    }

    const appRepo = await prisma.appRepo.findFirst({ where: { slug } })
    if (!appRepo) {
      throw createError({
        statusCode: 404,
        message: `No AppRepo found for '${slug}' -- file a graduate-request first.`,
      })
    }
    if (!appRepo.installationId) {
      throw createError({
        statusCode: 409,
        message: `AppRepo '${slug}' has no installationId -- this is a monorepo app row, not a graduation request.`,
      })
    }

    // The Todo is the trigger, not just a status marker: this must not run
    // twice for the same slug, and must not run for a slug nobody actually
    // requested graduation for.
    const todo = await prisma.todo.findFirst({
      where: { title: GRADUATE_TODO_TITLE(slug), status: 'OPEN' },
    })
    if (!todo) {
      throw createError({
        statusCode: 409,
        message: `No OPEN "${GRADUATE_TODO_TITLE(slug)}" Todo found -- nothing pending to execute for '${slug}'.`,
      })
    }

    const installation = await prisma.githubInstallation.findFirst({
      where: { id: appRepo.installationId },
    })
    if (!installation) {
      throw createError({
        statusCode: 404,
        message: 'GitHub installation for this AppRepo no longer exists.',
      })
    }
    if (installation.suspendedAt) {
      throw createError({
        statusCode: 409,
        message: 'This GitHub installation is suspended.',
      })
    }

    // Re-validate the grant rather than trusting it was still true after
    // filing -- the user can revoke repo access on GitHub at any time.
    const granted = await listInstallationRepositories(
      Number(installation.installationId),
    )
    const isGranted = granted.some(
      (r) => r.owner === appRepo.owner && r.repo === appRepo.repo,
    )
    if (!isGranted) {
      throw createError({
        statusCode: 403,
        message: `${appRepo.owner}/${appRepo.repo} is no longer among the repos granted to this installation.`,
      })
    }

    const { files } = await readConductorAppTree(slug)

    const pushResult = await squashPushAppToRepo({
      installationId: Number(installation.installationId),
      owner: appRepo.owner,
      repo: appRepo.repo,
      files,
      commitMessage: `Graduate '${slug}' from silasfelinus/conductor (squash)\n\nFull historical provenance stays in conductor at apps/${slug}/ until its removal PR merges; see conductor's appmaker/t-015.`,
    })

    const removalResult = await openConductorAppRemovalPr({
      slug,
      branch: `worker/graduate-remove-${slug}`,
      prTitle: `AppMaker: remove apps/${slug}/ (graduated to ${appRepo.owner}/${appRepo.repo})`,
      prBody: [
        `'${slug}' has been squash-graduated to ${appRepo.owner}/${appRepo.repo}.`,
        `Target commit: ${pushResult.commitHtmlUrl}`,
        '',
        'This PR removes the now-superseded copy from the monorepo. Merging it',
        'is the final, irreversible step of graduation -- review the target',
        'commit above before merging.',
      ].join('\n'),
    })

    await prisma.todo.update({
      where: { id: todo.id },
      data: { status: 'DONE' },
    })

    event.node.res.statusCode = 200
    return {
      success: true,
      data: {
        slug,
        targetRepo: `${appRepo.owner}/${appRepo.repo}`,
        commitSha: pushResult.commitSha,
        commitUrl: pushResult.commitHtmlUrl,
        createdInitialCommit: pushResult.createdInitialCommit,
        removalPrUrl: removalResult.prUrl,
        removalPrNumber: removalResult.prNumber,
      },
    }
  } catch (error) {
    if (error instanceof H3Error) throw error
    return errorHandler(error)
  }
})
