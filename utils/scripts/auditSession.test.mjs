import assert from 'node:assert/strict'
import test from 'node:test'
import {
  auditBrowserOptions,
  resolveAuditSession,
  storageStateForToken,
} from './lib/auditSession.mjs'

const base = 'https://kindrobots.org'
const json = (status, body) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => body,
})

test('storage state is the token the SPA reads, on the audited origin', () => {
  const state = storageStateForToken(base + '/play/slime-city', 'jwt-value')
  assert.equal(state.origins.length, 1)
  assert.equal(state.origins[0].origin, base)
  assert.deepEqual(state.origins[0].localStorage, [
    { name: 'token', value: 'jwt-value' },
    { name: 'stayLoggedIn', value: 'true' },
  ])
})

test('no file and no audit account means no session, and no request', async () => {
  let calls = 0
  const session = await resolveAuditSession({
    base,
    env: {},
    fetchImpl: async () => {
      calls += 1
      return json(200, {})
    },
  })
  assert.equal(session, null)
  assert.equal(calls, 0)
  // One half of the pair is not an account either.
  assert.equal(
    await resolveAuditSession({ base, env: { KR_AUDIT_USERNAME: 'qa' } }),
    null,
  )
})

test('a storage-state file wins over the audit account', async () => {
  const session = await resolveAuditSession({
    base,
    storageStatePath: '/outside/repo/state.json',
    env: { KR_AUDIT_USERNAME: 'qa', KR_AUDIT_PASSWORD: 'pw' },
    fetchImpl: async () => assert.fail('must not sign in'),
  })
  assert.equal(session.storageState, '/outside/repo/state.json')
})

test('the audit account signs in through /api/auth/login', async () => {
  const seen = []
  const session = await resolveAuditSession({
    base: base + '/',
    env: { KR_AUDIT_USERNAME: 'qa', KR_AUDIT_PASSWORD: 'pw' },
    fetchImpl: async (url, init) => {
      seen.push({ url, init })
      return json(200, { success: true, token: 'jwt-value' })
    },
  })
  assert.equal(seen.length, 1)
  assert.equal(seen[0].url, base + '/api/auth/login')
  assert.equal(seen[0].init.method, 'POST')
  assert.deepEqual(JSON.parse(seen[0].init.body), {
    username: 'qa',
    password: 'pw',
  })
  assert.equal(session.source, 'audit account')
  assert.equal(
    session.storageState.origins[0].localStorage[0].value,
    'jwt-value',
  )
  // Some responses nest the token under data.
  const nested = await resolveAuditSession({
    base,
    env: { KR_AUDIT_USERNAME: 'qa', KR_AUDIT_PASSWORD: 'pw' },
    fetchImpl: async () => json(200, { data: { token: 'nested' } }),
  })
  assert.equal(nested.storageState.origins[0].localStorage[0].value, 'nested')
})

test('a refused sign-in fails loudly without echoing the credentials', async () => {
  for (const response of [
    json(401, { success: false, message: 'Invalid password for qa: pw' }),
    json(200, { success: true }),
  ])
    await assert.rejects(
      resolveAuditSession({
        base,
        env: { KR_AUDIT_USERNAME: 'qa-user', KR_AUDIT_PASSWORD: 'pw-secret' },
        fetchImpl: async () => response,
      }),
      (error) => {
        assert.match(error.message, /^AUDIT_LOGIN_FAILED/)
        assert.doesNotMatch(error.message, /pw-secret|qa-user|Invalid password/)
        return true
      },
    )
})

test('browser options stay plain unless a sandbox opts in', () => {
  assert.deepEqual(auditBrowserOptions(undefined, {}), {
    launch: { args: ['--no-sandbox'] },
    context: {},
  })
  const sandbox = auditBrowserOptions('http://proxy.test:3128', {
    AUDIT_CHROMIUM: '/opt/chromium',
  })
  assert.equal(sandbox.launch.proxy.server, 'http://proxy.test:3128')
  assert.equal(sandbox.launch.executablePath, '/opt/chromium')
  assert.equal(sandbox.context.ignoreHTTPSErrors, true)
})
