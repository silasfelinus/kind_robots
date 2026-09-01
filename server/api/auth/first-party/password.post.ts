import { createError, defineEventHandler, readBody, setHeader } from 'h3'
import { validateUserCredentials } from '@/server/api/auth'
import { getFirstPartyClients } from '@/server/utils/firstPartySso'
import { issueFirstPartyDelegation } from '@/server/utils/firstPartyDelegation'
import { findFirstPartyClient } from '~/utils/firstPartySsoContract'

type PasswordBody = {
  client_id?: unknown
  username?: unknown
  password?: unknown
}

export default defineEventHandler(async (event) => {
  setHeader(event, 'Cache-Control', 'no-store')
  setHeader(event, 'Pragma', 'no-cache')

  const body = await readBody<PasswordBody>(event)
  const client = findFirstPartyClient(getFirstPartyClients(), body?.client_id)
  if (!client) {
    throw createError({ statusCode: 400, message: 'Unknown first-party client.' })
  }

  const username = typeof body?.username === 'string' ? body.username.trim() : ''
  const password = typeof body?.password === 'string' ? body.password : ''
  if (!username || !password) {
    throw createError({ statusCode: 400, message: 'Username and password are required.' })
  }

  const result = await validateUserCredentials(username, password)
  if (!result?.user || result.user.isActive === false) {
    throw createError({ statusCode: 401, message: 'Invalid username or password.' })
  }

  const delegationToken = await issueFirstPartyDelegation({
    userId: result.user.id,
    client,
  })

  return {
    success: true,
    clientId: client.id,
    user: {
      id: result.user.id,
      username: result.user.username,
    },
    delegationToken,
  }
})
