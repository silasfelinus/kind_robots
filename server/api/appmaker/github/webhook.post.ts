// /server/api/appmaker/github/webhook.post.ts
// GITHUB-APP-DESIGN.md §5e / §6 invariant 4: HMAC-SHA256 verified before any
// parsing. Only `installation` lifecycle events are acted on in this task
// (t-008's scope is the connect flow + webhook endpoint, not the CI-status
// cache §5e sketches — that needs its own model and belongs to a later
// task). `push`/`pull_request`/`check_suite` are acknowledged but no-op.
import { createError, defineEventHandler, getHeader, readRawBody } from 'h3'
import prisma from '~/server/utils/prisma'
import { errorHandler } from '~/server/utils/error'
import { verifyWebhookSignature } from '~/server/utils/appmakerGithub'

interface InstallationWebhookPayload {
  action: string
  installation: { id: number }
}

async function handleInstallationEvent(payload: InstallationWebhookPayload) {
  const installationId = BigInt(payload.installation.id)

  switch (payload.action) {
    case 'deleted':
      await prisma.githubInstallation.deleteMany({
        where: { installationId },
      })
      break
    case 'suspend':
      await prisma.githubInstallation.updateMany({
        where: { installationId },
        data: { suspendedAt: new Date() },
      })
      break
    case 'unsuspend':
      await prisma.githubInstallation.updateMany({
        where: { installationId },
        data: { suspendedAt: null },
      })
      break
    default:
      // 'created', 'new_permissions_accepted', repo add/remove, etc. — the
      // setup callback (setup.get.ts) is the source of truth for creation
      // since only it knows which kind_robots user installed the app; the
      // webhook alone has no reliable userId to attribute a new row to.
      break
  }
}

export default defineEventHandler(async (event) => {
  let response

  try {
    const { appmakerGhWebhookSecret } = useRuntimeConfig()
    if (!appmakerGhWebhookSecret) {
      throw createError({
        statusCode: 500,
        message: 'AppMaker GitHub webhook secret is not configured',
      })
    }

    const signature = getHeader(event, 'x-hub-signature-256')
    const rawBody = await readRawBody(event)
    const githubEvent = getHeader(event, 'x-github-event')

    if (!rawBody) {
      throw createError({ statusCode: 400, message: 'Missing webhook body' })
    }

    if (
      !verifyWebhookSignature(
        rawBody,
        signature,
        appmakerGhWebhookSecret as string,
      )
    ) {
      throw createError({
        statusCode: 401,
        message: 'Invalid webhook signature',
      })
    }

    const payload = JSON.parse(rawBody)

    if (githubEvent === 'installation') {
      await handleInstallationEvent(payload)
    }
    // push / pull_request / check_suite: acknowledged, no-op (see file header)

    response = { received: true }
    event.node.res.statusCode = 200
  } catch (error: unknown) {
    console.error('🔥 AppMaker GitHub Webhook Error:', error)
    const handledError = errorHandler(error)
    event.node.res.statusCode = handledError.statusCode || 400
    response = {
      success: false,
      message: handledError.message || 'AppMaker webhook handling failed',
    }
  }

  return response
})
