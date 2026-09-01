// /utils/scripts/verifyAgentCredentials.test.ts
//
// Regression test for rainbow-butterflies/t-015's scoped agent credentials
// (server/utils/agentCredentials.ts). Pure functions only -- no prisma, no
// database, no Nuxt/H3 runtime -- same discipline as
// utils/scripts/verifyMandarinSrs.test.ts.
import assert from 'node:assert/strict'

import {
  AGENT_CREDENTIAL_SCOPES,
  DEFAULT_FORUM_AGENT_SCOPES,
  isValidScope,
  parseCredentialToken,
  sanitizeScopes,
  toSafeCredential,
} from '../../server/utils/agentCredentials.js'

// --- isValidScope ------------------------------------------------------

{
  for (const scope of AGENT_CREDENTIAL_SCOPES) {
    assert.equal(isValidScope(scope), true, `${scope} should be a valid scope`)
  }

  assert.equal(isValidScope('forum:thread:create'), true)
  assert.equal(isValidScope('not:a:real:scope'), false)
  assert.equal(isValidScope(''), false)
  assert.equal(isValidScope(123), false)
  assert.equal(isValidScope(null), false)
  assert.equal(isValidScope(undefined), false)
}

// --- sanitizeScopes ------------------------------------------------------

{
  // Drops unknown scopes, keeps valid ones, dedupes.
  const result = sanitizeScopes([
    'profile:read',
    'forum:read',
    'forum:thread:create',
    'profile:read',
    'not-a-scope',
    42,
  ])
  assert.deepEqual(
    result.sort(),
    ['forum:read', 'forum:thread:create', 'profile:read'].sort(),
  )

  // Non-array input -> empty, never throws.
  assert.deepEqual(sanitizeScopes(null), [])
  assert.deepEqual(sanitizeScopes(undefined), [])
  assert.deepEqual(sanitizeScopes('profile:read'), [])
  assert.deepEqual(sanitizeScopes({}), [])

  // Empty array -> empty.
  assert.deepEqual(sanitizeScopes([]), [])
}

// --- DEFAULT_FORUM_AGENT_SCOPES is itself always a valid, sanitizable set ---

{
  assert.deepEqual(
    sanitizeScopes(DEFAULT_FORUM_AGENT_SCOPES).sort(),
    [...DEFAULT_FORUM_AGENT_SCOPES].sort(),
  )
  assert.equal(
    DEFAULT_FORUM_AGENT_SCOPES.includes('forum:thread:create'),
    false,
    'starting new threads must remain an explicit human opt-in',
  )
}

// --- toSafeCredential: strips hashedSecret, sanitizes stored scopes -----

{
  const fakeRow = {
    id: 1,
    createdAt: new Date('2026-08-30T00:00:00Z'),
    updatedAt: new Date('2026-08-30T00:00:00Z'),
    userId: 7,
    botId: null,
    label: 'Forum bot',
    keyPrefix: 'abc123',
    hashedSecret: '$2a$10$fakehashfakehashfakehashfa',
    scopes: ['forum:read', 'forum:write', 'not-a-real-scope'],
    expiresAt: null,
    lastUsedAt: null,
    revokedAt: null,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any

  const safe = toSafeCredential(fakeRow)
  assert.equal('hashedSecret' in safe, false)
  assert.deepEqual(safe.scopes.sort(), ['forum:read', 'forum:write'].sort())
  assert.equal(safe.id, 1)
  assert.equal(safe.label, 'Forum bot')
}

// --- parseCredentialToken -------------------------------------------------

{
  // The happy path: exactly one dot, both halves non-empty.
  const parsed = parseCredentialToken('abc123.deadbeef')
  assert.deepEqual(parsed, { keyPrefix: 'abc123', secret: 'deadbeef' })

  // No dot at all (legacy whole-user apiKey shape) -> not a credential token.
  assert.equal(parseCredentialToken('legacyRawApiKeyNoDots'), null)

  // Two dots (a JWT's shape) -> never mistaken for a credential token.
  assert.equal(parseCredentialToken('header.payload.signature'), null)

  // Leading or trailing dot -> either half empty, rejected.
  assert.equal(parseCredentialToken('.deadbeef'), null)
  assert.equal(parseCredentialToken('abc123.'), null)

  // Empty / whitespace-only input.
  assert.equal(parseCredentialToken(''), null)
  assert.equal(parseCredentialToken('   '), null)

  // Surrounding whitespace on an otherwise-valid token is trimmed first.
  assert.deepEqual(parseCredentialToken('  abc123.deadbeef  '), {
    keyPrefix: 'abc123',
    secret: 'deadbeef',
  })
}

console.log('verifyAgentCredentials.test.ts: all assertions passed')
