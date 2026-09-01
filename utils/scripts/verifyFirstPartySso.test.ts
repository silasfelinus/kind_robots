import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

import {
  DEFAULT_FIRST_PARTY_CLIENTS,
  evaluateAuthorizationCodeExchange,
  findFirstPartyClient,
  hashAuthorizationCode,
  isAllowedFirstPartyRedirect,
  parseFirstPartyClientsJson,
  pkceS256,
  validatePkceChallenge,
  validatePkceVerifier,
  validateSsoState,
} from '../firstPartySsoContract.js'

const clients = parseFirstPartyClientsJson(undefined)
const rainbow = findFirstPartyClient(clients, 'rainbow-butterflies')
assert.ok(rainbow)
assert.deepEqual(clients, DEFAULT_FIRST_PARTY_CLIENTS)

assert.equal(
  isAllowedFirstPartyRedirect(
    rainbow,
    'https://rainbowbutterflies.org/auth/callback',
  ),
  true,
)
assert.equal(
  isAllowedFirstPartyRedirect(
    rainbow,
    'https://rainbowbutterflies.org/auth/google/callback',
  ),
  true,
)
assert.equal(
  isAllowedFirstPartyRedirect(rainbow, 'https://evil.example/auth/callback'),
  false,
)
assert.equal(
  isAllowedFirstPartyRedirect(
    rainbow,
    'https://rainbowbutterflies.org.evil.example/auth/callback',
  ),
  false,
)
assert.equal(
  isAllowedFirstPartyRedirect(
    rainbow,
    'https://rainbowbutterflies.org/auth/callback#steal-me',
  ),
  false,
)
assert.equal(
  isAllowedFirstPartyRedirect(rainbow, 'javascript:alert(1)'),
  false,
)

assert.equal(validateSsoState('too-short'), null)
assert.equal(validateSsoState('0123456789abcdef'), '0123456789abcdef')

const verifier = 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk'
const challenge = 'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM'
assert.equal(pkceS256(verifier), challenge)
assert.equal(validatePkceVerifier(verifier), verifier)
assert.equal(validatePkceChallenge(challenge), challenge)
assert.equal(validatePkceVerifier('short'), null)
assert.equal(validatePkceChallenge('short'), null)

const now = new Date('2026-08-30T05:30:00.000Z')
const record = {
  id: 1,
  codeHash: hashAuthorizationCode('single-use-code'),
  userId: 42,
  clientId: 'rainbow-butterflies',
  redirectUri: 'https://rainbowbutterflies.org/auth/callback',
  codeChallenge: challenge,
  codeChallengeMethod: 'S256',
  expiresAt: new Date('2026-08-30T05:32:00.000Z'),
  consumedAt: null,
}

assert.deepEqual(
  evaluateAuthorizationCodeExchange(record, {
    clientId: 'rainbow-butterflies',
    redirectUri: 'https://rainbowbutterflies.org/auth/callback',
    verifier,
    now,
  }),
  { ok: true, userId: 42 },
)

const crossUserAttempt = {
  clientId: 'rainbow-butterflies',
  redirectUri: 'https://rainbowbutterflies.org/auth/callback',
  verifier,
  now,
  userId: 99,
}
assert.deepEqual(evaluateAuthorizationCodeExchange(record, crossUserAttempt), {
  ok: true,
  userId: 42,
})

assert.deepEqual(
  evaluateAuthorizationCodeExchange(
    { ...record, consumedAt: new Date('2026-08-30T05:29:00.000Z') },
    {
      clientId: 'rainbow-butterflies',
      redirectUri: 'https://rainbowbutterflies.org/auth/callback',
      verifier,
      now,
    },
  ),
  { ok: false, reason: 'consumed' },
)

assert.deepEqual(
  evaluateAuthorizationCodeExchange(
    { ...record, expiresAt: new Date('2026-08-30T05:29:59.000Z') },
    {
      clientId: 'rainbow-butterflies',
      redirectUri: 'https://rainbowbutterflies.org/auth/callback',
      verifier,
      now,
    },
  ),
  { ok: false, reason: 'expired' },
)

assert.deepEqual(
  evaluateAuthorizationCodeExchange(record, {
    clientId: 'other-client',
    redirectUri: 'https://rainbowbutterflies.org/auth/callback',
    verifier,
    now,
  }),
  { ok: false, reason: 'client' },
)

assert.deepEqual(
  evaluateAuthorizationCodeExchange(record, {
    clientId: 'rainbow-butterflies',
    redirectUri: 'https://rainbowbutterflies.org/auth/other',
    verifier,
    now,
  }),
  { ok: false, reason: 'redirect' },
)

assert.deepEqual(
  evaluateAuthorizationCodeExchange(record, {
    clientId: 'rainbow-butterflies',
    redirectUri: 'https://rainbowbutterflies.org/auth/callback',
    verifier: `${verifier.slice(0, -1)}A`,
    now,
  }),
  { ok: false, reason: 'pkce' },
)

const googleConfigSource = readFileSync(
  'server/api/auth/first-party/google/config.get.ts',
  'utf8',
)
const googleExchangeSource = readFileSync(
  'server/api/auth/first-party/google/exchange.post.ts',
  'utf8',
)
const registrationSource = readFileSync('server/api/users/register.post.ts', 'utf8')

assert.match(googleConfigSource, /GOOGLE_ID/)
assert.doesNotMatch(googleConfigSource, /GOOGLE_SECRET/)
assert.match(googleExchangeSource, /GOOGLE_SECRET/)
assert.match(googleExchangeSource, /email_verified\s*!==\s*true/)
assert.match(googleExchangeSource, /code_verifier:\s*verifier/)
assert.doesNotMatch(googleExchangeSource, /return\s+\{[^}]*access_token/s)
assert.doesNotMatch(registrationSource, /Received user data.*userData/)
assert.match(registrationSource, /password:\s*_password/)

console.log('First-party SSO contract OK')
