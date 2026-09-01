import {
  createError,
  getCookie,
  type H3Event,
} from 'h3'
import { verifyJwtToken } from '@/server/api/auth'
import {
  evaluateAuthorizationCodeExchange,
  findFirstPartyClient,
  generateAuthorizationCode,
  hashAuthorizationCode,
  normalizeAllowedFirstPartyRedirect,
  parseFirstPartyClientsJson,
  validatePkceChallenge,
  validatePkceVerifier,
  validateSsoState,
  type AuthorizationCodeRecord,
  type FirstPartyClient,
} from '~/utils/firstPartySsoContract'
import prisma from './prisma'

const AUTHORIZATION_CODE_LIFETIME_MS = 2 * 60 * 1000
const AUTHORIZATION_CODE_RETENTION_MS = 24 * 60 * 60 * 1000
const MAX_AUTHORIZATION_CODE_LENGTH = 256

export type FirstPartyIdentity = {
  id: number
  username: string
}

export type FirstPartyAuthorizeRequest = {
  client: FirstPartyClient
  redirectUri: string
  state: string
  codeChallenge: string
}

export type FirstPartyExchangeRequest = {
  client: FirstPartyClient
  redirectUri: string
  code: string
  verifier: string
}

export function getFirstPartyClients(): FirstPartyClient[] {
  return parseFirstPartyClientsJson(process.env.FIRST_PARTY_SSO_CLIENTS_JSON)
}

export function parseFirstPartyAuthorizeRequest(
  query: Record<string, unknown>,
): FirstPartyAuthorizeRequest {
  if (query.response_type !== 'code') {
    throw createError({
      statusCode: 400,
      message: 'response_type must be "code".',
    })
  }

  const client = findFirstPartyClient(getFirstPartyClients(), query.client_id)
  if (!client) {
    throw createError({
      statusCode: 400,
      message: 'Unknown first-party client.',
    })
  }

  const redirectUri = normalizeAllowedFirstPartyRedirect(client, query.redirect_uri)
  if (!redirectUri) {
    // Never redirect an error to an untrusted URI. An invalid redirect target is
    // reported locally so this endpoint cannot be turned into an open redirect.
    throw createError({
      statusCode: 400,
      message: 'redirect_uri is not registered for this first-party client.',
    })
  }

  if (query.code_challenge_method !== 'S256') {
    throw createError({
      statusCode: 400,
      message: 'code_challenge_method must be "S256".',
    })
  }

  const codeChallenge = validatePkceChallenge(query.code_challenge)
  if (!codeChallenge) {
    throw createError({
      statusCode: 400,
      message: 'A valid PKCE S256 code_challenge is required.',
    })
  }

  const state = validateSsoState(query.state)
  if (!state) {
    throw createError({
      statusCode: 400,
      message: 'A high-entropy state value is required.',
    })
  }

  return { client, redirectUri, state, codeChallenge }
}

export function parseFirstPartyExchangeRequest(
  body: Record<string, unknown>,
): FirstPartyExchangeRequest {
  if (body.grant_type !== 'authorization_code') {
    throw createError({
      statusCode: 400,
      message: 'grant_type must be "authorization_code".',
    })
  }

  const client = findFirstPartyClient(getFirstPartyClients(), body.client_id)
  if (!client) {
    throw createError({
      statusCode: 400,
      message: 'Unknown first-party client.',
    })
  }

  const redirectUri = normalizeAllowedFirstPartyRedirect(client, body.redirect_uri)
  if (!redirectUri) {
    throw createError({
      statusCode: 400,
      message: 'redirect_uri is not registered for this first-party client.',
    })
  }

  const verifier = validatePkceVerifier(body.code_verifier)
  if (!verifier) {
    throw createError({
      statusCode: 400,
      message: 'A valid PKCE code_verifier is required.',
    })
  }

  const code = typeof body.code === 'string' ? body.code.trim() : ''
  if (!code || code.length > MAX_AUTHORIZATION_CODE_LENGTH) {
    throw createError({
      statusCode: 400,
      message: 'A valid authorization code is required.',
    })
  }

  return { client, redirectUri, code, verifier }
}

export async function getKindSessionIdentity(
  event: H3Event,
): Promise<FirstPartyIdentity | null> {
  const token = getCookie(event, 'kind-session')?.trim() ?? ''
  if (!token) return null

  const verification = await verifyJwtToken(token)
  if (!verification.success || !verification.userId) return null

  const user = await prisma.user.findUnique({
    where: { id: verification.userId },
    select: {
      id: true,
      username: true,
      isActive: true,
    },
  })

  if (!user || user.isActive === false) return null

  return {
    id: user.id,
    username: user.username,
  }
}

export async function issueFirstPartyAuthorizationCode(input: {
  userId: number
  clientId: string
  redirectUri: string
  codeChallenge: string
}): Promise<{ code: string; expiresAt: Date }> {
  const now = new Date()
  const expiresAt = new Date(now.getTime() + AUTHORIZATION_CODE_LIFETIME_MS)
  const code = generateAuthorizationCode()
  const codeHash = hashAuthorizationCode(code)

  // Keep the server-only handoff table bounded without adding a scheduler.
  const retentionCutoff = new Date(now.getTime() - AUTHORIZATION_CODE_RETENTION_MS)
  await prisma.$executeRaw`
    DELETE FROM \`FirstPartyAuthorizationCode\`
    WHERE \`expiresAt\` < ${retentionCutoff}
  `

  await prisma.$executeRaw`
    INSERT INTO \`FirstPartyAuthorizationCode\`
      (\`codeHash\`, \`userId\`, \`clientId\`, \`redirectUri\`, \`codeChallenge\`, \`codeChallengeMethod\`, \`createdAt\`, \`expiresAt\`)
    VALUES
      (${codeHash}, ${input.userId}, ${input.clientId}, ${input.redirectUri}, ${input.codeChallenge}, 'S256', ${now}, ${expiresAt})
  `

  return { code, expiresAt }
}

export async function consumeFirstPartyAuthorizationCode(
  input: FirstPartyExchangeRequest,
): Promise<FirstPartyIdentity> {
  const codeHash = hashAuthorizationCode(input.code)

  return await prisma.$transaction(async (tx) => {
    const rows = await tx.$queryRaw<AuthorizationCodeRecord[]>`
      SELECT
        \`id\`, \`codeHash\`, \`userId\`, \`clientId\`, \`redirectUri\`,
        \`codeChallenge\`, \`codeChallengeMethod\`, \`expiresAt\`, \`consumedAt\`
      FROM \`FirstPartyAuthorizationCode\`
      WHERE \`codeHash\` = ${codeHash}
      LIMIT 1
      FOR UPDATE
    `

    const record = rows[0]
    if (!record) {
      throw createError({
        statusCode: 400,
        message: 'Invalid or expired authorization code.',
      })
    }

    const decision = evaluateAuthorizationCodeExchange(record, {
      clientId: input.client.id,
      redirectUri: input.redirectUri,
      verifier: input.verifier,
    })

    if (!decision.ok) {
      // Do not reveal which grant component failed. The caller gets one stable
      // invalid-grant shape, while the row lock prevents racing replays.
      throw createError({
        statusCode: 400,
        message: 'Invalid or expired authorization code.',
      })
    }

    const consumedAt = new Date()
    const changed = await tx.$executeRaw`
      UPDATE \`FirstPartyAuthorizationCode\`
      SET \`consumedAt\` = ${consumedAt}
      WHERE \`codeHash\` = ${codeHash}
        AND \`consumedAt\` IS NULL
    `

    if (changed !== 1) {
      throw createError({
        statusCode: 400,
        message: 'Invalid or expired authorization code.',
      })
    }

    const user = await tx.user.findUnique({
      where: { id: decision.userId },
      select: {
        id: true,
        username: true,
        isActive: true,
      },
    })

    if (!user || user.isActive === false) {
      throw createError({
        statusCode: 403,
        message: 'The Kind Robots account is unavailable.',
      })
    }

    return {
      id: user.id,
      username: user.username,
    }
  })
}
