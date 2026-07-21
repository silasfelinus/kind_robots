// /server/api/appmaker/github/repos.get.ts
// GITHUB-APP-DESIGN.md §5a step 4: list the current user's GitHub App
// installations, the AppRepo mappings already created against them, and
// (appmaker/t-009) the live set of repos GitHub says the installation was
// actually granted — the create-app flow (5b step 1) needs to offer a repo
// the user can pick a slug for, and AppRepo alone only reflects repos we've
// already mapped, not what's newly available on a fresh install.
import { defineEventHandler } from 'h3'
import prisma from '~/server/utils/prisma'
import { requireApiUser } from '~/server/utils/authGuard'
import { listInstallationRepositories } from '~/server/utils/appmakerGithub'

export default defineEventHandler(async (event) => {
  const { user } = await requireApiUser(event)

  const installations = await prisma.githubInstallation.findMany({
    where: { userId: user.id },
    include: { AppRepos: true },
    orderBy: { createdAt: 'desc' },
  })

  const data = await Promise.all(
    installations.map(async (installation) => {
      const appRepos = installation.AppRepos.map((repo) => ({
        id: repo.id,
        slug: repo.slug,
        owner: repo.owner,
        repo: repo.repo,
        subPath: repo.subPath,
      }))

      // A suspended installation's token mint would just fail on GitHub's
      // side — skip the live lookup and return the mapped repos we already
      // know about rather than surfacing a 502 for the whole list.
      let availableRepos: Array<{
        owner: string
        repo: string
        defaultBranch: string
        private: boolean
      }> = []
      if (!installation.suspendedAt) {
        const mappedKeys = new Set(appRepos.map((r) => `${r.owner}/${r.repo}`))
        const granted = await listInstallationRepositories(
          Number(installation.installationId),
        )
        availableRepos = granted.filter(
          (r) => !mappedKeys.has(`${r.owner}/${r.repo}`),
        )
      }

      return {
        id: installation.id,
        accountLogin: installation.accountLogin,
        suspended: installation.suspendedAt !== null,
        createdAt: installation.createdAt,
        appRepos,
        availableRepos,
      }
    }),
  )

  return { success: true, data }
})
