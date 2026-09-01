import {
  createError,
  defineEventHandler,
  readBody,
  setHeader,
} from 'h3'
import {
  consumeFirstPartyAuthorizationCode,
  parseFirstPartyExchangeRequest,
} from '@/server/utils/firstPartySso'
import { issueFirstPartyDelegation } from '@/server/utils/firstPartyDelegation'

export default defineEventHandler(async (event) => {
  setHeader(event, 'Cache-Control', 'no-store')
  setHeader(event, 'Pragma', 'no-cache')

  const rawBody = await readBody<unknown>(event)
  if (!rawBody || typeof rawBody !== 'object' || Array.isArray(rawBody)) {
    throw createError({
      statusCode: 400,
      message: 'A JSON authorization-code exchange body is required.',
    })
  }

  const request = parseFirstPartyExchangeRequest(
    rawBody as Record<string, unknown>,
  )
  const user = await consumeFirstPartyAuthorizationCode(request)
  const delegationToken = await issueFirstPartyDelegation({
    userId: user.id,
    client: request.client,
  })

  return {
    success: true,
    clientId: request.client.id,
    user,
    delegationToken,
  }
})
