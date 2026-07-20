// /server/api/appmaker/github/setup.get.ts
// Step 3 of GITHUB-APP-DESIGN.md §5a: GitHub's setup-URL callback after the
// user picks an account + repos on GitHub's own installation screen.
// Verifies the state nonce, fetches installation details as the app itself,
// and upserts GithubInstallation. Never receives or stores a credential —
// only the installation id GitHub already generated.
import { createError, defineEventHandler, getQuery, sendRedirect } from 'h3'
import prisma from '~/server/utils/prisma'
import {
  fetchInstallationDetails,
  verifyInstallState,
} from '~/server/utils/appmakerGithub'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const installationIdRaw = query.installation_id
  const state = query.state

  if (typeof installationIdRaw !== 'string' || typeof state !== 'string') {
    throw createError({
      statusCode: 400,
      message: 'Missing installation_id or state',
    })
  }

  const installationId = Number(installationIdRaw)
  if (!Number.isInteger(installationId) || installationId <= 0) {
    throw createError({ statusCode: 400, message: 'Invalid installation_id' })
  }

  const userId = await verifyInstallState(state)
  const details = await fetchInstallationDetails(installationId)

  await prisma.githubInstallation.upsert({
    where: { installationId: BigInt(details.installationId) },
    create: {
      installationId: BigInt(details.installationId),
      userId,
      accountLogin: details.accountLogin,
    },
    update: {
      userId,
      accountLogin: details.accountLogin,
      suspendedAt: null,
    },
  })

  return sendRedirect(event, '/appmaker?github=connected', 302)
})
