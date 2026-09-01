import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const googleExchange = readFileSync(
  'server/api/auth/first-party/google/exchange.post.ts',
  'utf8',
)
const codeExchange = readFileSync(
  'server/api/auth/first-party/exchange.post.ts',
  'utf8',
)
const passwordExchange = readFileSync(
  'server/api/auth/first-party/password.post.ts',
  'utf8',
)
const delegation = readFileSync(
  'server/utils/firstPartyDelegation.ts',
  'utf8',
)
const authGuard = readFileSync('server/utils/authGuard.ts', 'utf8')

for (const source of [googleExchange, codeExchange, passwordExchange]) {
  assert.match(source, /issueFirstPartyDelegation/)
  assert.match(source, /delegationToken/)
}

assert.match(passwordExchange, /findFirstPartyClient/)
assert.match(passwordExchange, /validateUserCredentials/)
assert.match(delegation, /kind:\s*TOKEN_KIND/)
assert.match(delegation, /setSubject\(String\(input\.userId\)\)/)
assert.match(delegation, /setAudience\(input\.client\.id\)/)
assert.match(delegation, /issuer:\s*ISSUER/)
assert.match(delegation, /algorithms:\s*\['HS256'\]/)
assert.match(delegation, /findFirstPartyClient\(getFirstPartyClients\(\), clientId\)/)
assert.doesNotMatch(delegation, /\bid:\s*input\.userId/)

assert.match(authGuard, /'first-party-delegation'/)
assert.match(authGuard, /validateFirstPartyDelegationAuth\(bearerToken\)/)
assert.match(authGuard, /clientId:\s*delegation\.clientId/)
assert.match(authGuard, /isAdmin:\s*false/)
assert.match(
  authGuard,
  /auth\.kind === 'agent-credential' \|\| auth\.kind === 'first-party-delegation'/,
)

// Google provider tokens remain server-side and are never returned as the BFF delegation.
assert.doesNotMatch(googleExchange, /return\s+\{[^}]*access_token/s)

console.log('First-party BFF delegation contract OK')
