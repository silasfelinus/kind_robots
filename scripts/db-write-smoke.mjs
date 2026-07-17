#!/usr/bin/env node
// scripts/db-write-smoke.mjs
//
// Fast database-write canary for issue #324 — one write to a currently-failing
// table (Reward) and one control write (Todo), via the live API. Runs anywhere
// with network access in ~15s: no Cypress, no Cypress Cloud, no DB credentials.
//
//   node scripts/db-write-smoke.mjs
//   BASE_API_URL=https://preview-url.vercel.app/api node scripts/db-write-smoke.mjs
//
// Exit code 0 = both writes committed (bug fixed / healthy).
// Exit code 1 = the failing-table write still 503s (bug present) or the
//               control write broke (wider outage).
//
// Creates a throwaway `cypress-user-smoke-*` account and deletes it (plus all
// fixtures) at the end; the name matches the existing cypress cleanup sweeps,
// so leaked fixtures are removed by the janitor even if this script dies.

const apiBase = String(
  process.env.BASE_API_URL || 'https://kind-robots.vercel.app/api',
).replace(/\/+$/, '')

const stamp = `${Date.now()}`
const username = `cypress-user-smoke-${stamp}`
const password = 'testtest12'
const jsonHeaders = { Accept: 'application/json', 'Content-Type': 'application/json' }

const call = async (method, path, body, token) => {
  const startedAt = Date.now()
  const response = await fetch(`${apiBase}${path}`, {
    method,
    headers: {
      ...jsonHeaders,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  let parsed = null
  try {
    parsed = await response.json()
  } catch {
    // non-JSON body; status is enough
  }
  return { status: response.status, ms: Date.now() - startedAt, body: parsed }
}

const failures = []
const report = (label, ok, detail) => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}  ${detail}`)
  if (!ok) failures.push(label)
}

// --- probe 0: user write (register doubles as the User-table write probe) -----
const registered = await call('POST', '/users/register', {
  username,
  email: `${username}@example.com`,
  password,
})
const userId = registered.body?.user?.id
report(
  'user write      (POST /users/register)',
  Boolean(userId),
  `${registered.status} in ${registered.ms}ms${
    userId ? '' : ` — ${registered.body?.message || 'no user id returned'}`
  }`,
)
if (!userId) {
  console.error(
    '\ndb-write smoke FAILED: cannot register a probe user, so the ' +
      'authenticated probes were skipped. See issue #324.',
  )
  process.exit(1)
}

const login = await call('POST', '/auth/login', { username, password })
const token = login.body?.data?.token || login.body?.token
if (!token) {
  console.error(`setup failed: login returned ${login.status}`)
  await call('DELETE', `/users/${userId}`, undefined, token)
  process.exit(1)
}

// --- the two probes ----------------------------------------------------------
const todo = await call('POST', '/todos', { title: `smoke ${stamp}` }, token)
report(
  'control write   (POST /todos)  ',
  todo.status === 201 && todo.body?.data?.id,
  `${todo.status} in ${todo.ms}ms`,
)

const reward = await call(
  'POST',
  '/rewards',
  {
    name: 'Cypress Smoke Reward',
    slug: `cypress-smoke-${stamp}`,
    rewardType: 'ITEM',
    rarity: 'COMMON',
  },
  token,
)
report(
  'canary write    (POST /rewards)',
  [200, 201].includes(reward.status) && reward.body?.data?.id,
  `${reward.status} in ${reward.ms}ms${
    reward.status === 503 ? ` — ${reward.body?.message || 'unavailable'}` : ''
  }`,
)

// --- cleanup (best-effort; user purge removes owned rows regardless) ----------
if (todo.body?.data?.id) {
  await call('DELETE', `/todos/${todo.body.data.id}`, undefined, token)
}
if (reward.body?.data?.id) {
  await call('DELETE', `/rewards/${reward.body.data.id}`, undefined, token)
}
const removal = await call('DELETE', `/users/${userId}`, undefined, token)
if (![200, 202, 204].includes(removal.status)) {
  console.warn(
    `cleanup warning: DELETE /users/${userId} returned ${removal.status} ` +
      '(the cypress-user janitor will sweep it)',
  )
}

// --- verdict -------------------------------------------------------------------
if (failures.length > 0) {
  console.error(`\ndb-write smoke FAILED (${failures.length}/3): see issue #324`)
  process.exit(1)
}
console.log('\ndb-write smoke passed: failing-table and control writes both commit.')
