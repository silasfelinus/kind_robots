// /server/api/appmaker/github/repos.get.ts
// GITHUB-APP-DESIGN.md §5a step 4: list the current user's GitHub App
// installations and any AppRepo mappings already created against them, so
// the AppMaker UI can offer granted repos for app creation/graduation.
import { defineEventHandler } from 'h3'
import prisma from '~/server/utils/prisma'
import { requireApiUser } from '~/server/utils/authGuard'

export default defineEventHandler(async (event) => {
  const { user } = await requireApiUser(event)

  const installations = await prisma.githubInstallation.findMany({
    where: { userId: user.id },
    include: { AppRepos: true },
    orderBy: { createdAt: 'desc' },
  })

  return {
    success: true,
    data: installations.map((installation) => ({
      id: installation.id,
      accountLogin: installation.accountLogin,
      suspended: installation.suspendedAt !== null,
      createdAt: installation.createdAt,
      appRepos: installation.AppRepos.map((repo) => ({
        id: repo.id,
        slug: repo.slug,
        owner: repo.owner,
        repo: repo.repo,
        subPath: repo.subPath,
      })),
    })),
  }
})
