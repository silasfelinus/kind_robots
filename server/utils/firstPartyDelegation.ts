import crypto from 'node:crypto'
import { jwtVerify, SignJWT } from 'jose'
import {
  findFirstPartyClient,
  type FirstPartyClient,
} from '~/utils/firstPartySsoContract'
import { getFirstPartyClients } from './firstPartySso'

const ISSUER = 'kind-robots:first-party'
const TOKEN_KIND = 'first-party-delegation'
const TOKEN_LIFETIME = '7d'

function getSecretKey() {
  const jwtSecret = useRuntimeConfig().jwtSecret
  if (typeof jwtSecret !== 'string' || !jwtSecret) {
    throw new Error('JWT_SECRET is not configured or is not a string.')
  }
  return crypto.createSecretKey(Buffer.from(jwtSecret, 'utf8'))
}

export type FirstPartyDelegation = {
  userId: number
  clientId: string
}

export async function issueFirstPartyDelegation(input: {
  userId: number
  client: FirstPartyClient
}): Promise<string> {
  return await new SignJWT({
    kind: TOKEN_KIND,
    clientId: input.client.id,
  })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setSubject(String(input.userId))
    .setIssuer(ISSUER)
    .setAudience(input.client.id)
    .setIssuedAt()
    .setExpirationTime(TOKEN_LIFETIME)
    .sign(getSecretKey())
}

export async function validateFirstPartyDelegation(
  token: string,
): Promise<FirstPartyDelegation | null> {
  if (!token || token.split('.').length !== 3) return null

  try {
    const { payload } = await jwtVerify(token, getSecretKey(), {
      issuer: ISSUER,
    })

    if (payload.kind !== TOKEN_KIND) return null
    const clientId = typeof payload.clientId === 'string' ? payload.clientId : ''
    const client = findFirstPartyClient(getFirstPartyClients(), clientId)
    if (!client) return null

    const audience = Array.isArray(payload.aud) ? payload.aud : [payload.aud]
    if (!audience.includes(client.id)) return null

    const userId = Number(payload.sub)
    if (!Number.isInteger(userId) || userId <= 0) return null

    return { userId, clientId: client.id }
  } catch {
    return null
  }
}
