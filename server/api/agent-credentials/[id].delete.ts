// /server/api/agent-credentials/[id].delete.ts
// rainbow-butterflies/t-015: revoke (never hard-delete) an agent credential.
// Revocation is idempotent and ownership-checked -- revoking someone else's
// credential id 403s rather than 404ing, matching the rest of this repo's
// ownership-guard convention (canMutateServer, etc.) of telling an owner why
// a request was rejected without leaking whether a given id merely doesn't
// exist.
import { createError, defineEventHandler, getRouterParam } from 'h3'
import { errorHandler } from '../../utils/error'
import { requireHumanApiUser } from '@/server/utils/authGuard'
import { revokeAgentCredential } from '@/server/utils/agentCredentials'

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireHumanApiUser(event)
    const idParam = getRouterParam(event, 'id')
    const id = Number(idParam)

    if (!Number.isInteger(id) || id <= 0) {
      throw createError({ statusCode: 400, message: 'Invalid credential id.' })
    }

    const result = await revokeAgentCredential(id, auth.user.id)

    if (result === 'not-found') {
      throw createError({ statusCode: 404, message: 'Credential not found.' })
    }

    if (result === 'forbidden') {
      throw createError({
        statusCode: 403,
        message: 'You do not own this credential.',
      })
    }

    return { success: true }
  } catch (error) {
    const { message, statusCode } = errorHandler(error)
    event.node.res.statusCode = statusCode || 500

    return {
      success: false,
      message: message || 'Failed to revoke credential.',
    }
  }
})
