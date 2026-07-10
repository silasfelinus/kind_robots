#!/usr/bin/env node
// scripts/cleanup-test-users.mjs
//
// One-time (or occasional) sweep for leaked cypress/test users. These piled up
// because DELETE /api/users/:id only allowed self-deletion (admin cleanup got
// a silent 403) and because residual owned rows (art collections, ledger rows,
// reactions, ...) RESTRICT the delete. Both are fixed server-side; this script
// clears the backlog through the fixed endpoint, one user at a time.
//
// DRY RUN by default — prints what it would delete. Pass --delete to execute.
//
// Usage:
//   BASE_API_URL=https://kind-robots.vercel.app/api ADMIN_TOKEN=... \
//     node scripts/cleanup-test-users.mjs [--delete] [--limit N]
//
// Env: BASE_API_URL (default https://kind-robots.vercel.app/api)
//      ADMIN_TOKEN or BETA_ADMIN_TOKEN or API_KEY (required)

const apiBase = String(
  process.env.BASE_API_URL || 'https://kind-robots.vercel.app/api',
).replace(/\/+$/, '')

const adminToken = String(
  process.env.ADMIN_TOKEN ||
    process.env.BETA_ADMIN_TOKEN ||
    process.env.API_KEY ||
    '',
)

const doDelete = process.argv.includes('--delete')
const limitFlagIndex = process.argv.indexOf('--limit')
const limit =
  limitFlagIndex !== -1 ? Number(process.argv[limitFlagIndex + 1]) : Infinity

// Usernames produced by the cypress suites:
//   cypress-user-<ts>-<rand>          (createFreshLoggedInTestUser)
//   cypress-primary|second|third-<id> (per-run seed users)
//   testuser<ts>                      (users.cy.ts registration spec)
const testUserPattern = /^(cypress-(user|primary|second|third)-|testuser\d+$)/i

// Never touch admins or low-id system accounts (id 10 is the default owner
// for orphaned content) no matter what their username looks like.
const isProtected = (user) =>
  user.id <= 10 || String(user.Role || '').toUpperCase() === 'ADMIN'

const headers = {
  Accept: 'application/json',
  'Content-Type': 'application/json',
  'x-beta-admin-token': adminToken,
  'x-admin-token': adminToken,
  'x-api-key': adminToken,
}

const readJson = async (response) => {
  const text = await response.text()
  try {
    return text ? JSON.parse(text) : {}
  } catch {
    return { message: text }
  }
}

const main = async () => {
  if (!adminToken) {
    console.error('Missing ADMIN_TOKEN / BETA_ADMIN_TOKEN / API_KEY env var.')
    process.exit(1)
  }

  const listResponse = await fetch(`${apiBase}/users`, { headers })
  const listBody = await readJson(listResponse)

  if (!listResponse.ok || !Array.isArray(listBody?.data)) {
    console.error(`Failed to list users: ${listResponse.status}`, listBody)
    process.exit(1)
  }

  const candidates = listBody.data
    .filter(
      (user) =>
        Number.isInteger(user?.id) && typeof user?.username === 'string',
    )
    .filter((user) => testUserPattern.test(user.username))
    .filter((user) => !isProtected(user))
    .slice(0, Number.isFinite(limit) && limit > 0 ? limit : undefined)

  console.log(
    `${listBody.data.length} users total, ${candidates.length} matching test-user patterns${
      doDelete ? '' : ' (dry run — pass --delete to remove them)'
    }`,
  )

  let deleted = 0
  let failed = 0

  for (const user of candidates) {
    if (!doDelete) {
      console.log(
        `  would delete ${user.id} ${user.username} (created ${user.createdAt})`,
      )
      continue
    }

    const response = await fetch(`${apiBase}/users/${user.id}`, {
      method: 'DELETE',
      headers,
    })
    const body = await readJson(response)

    if (response.ok && body?.success) {
      deleted += 1
      const purged = body?.data?.purged
      const purgedNote =
        purged && Object.keys(purged).length > 0
          ? ` purged=${JSON.stringify(purged)}`
          : ''
      console.log(`  deleted ${user.id} ${user.username}${purgedNote}`)
    } else {
      failed += 1
      console.error(
        `  FAILED ${user.id} ${user.username}: ${response.status} ${body?.message || ''}`,
      )
    }
  }

  if (doDelete) {
    console.log(`Done: ${deleted} deleted, ${failed} failed.`)
    if (failed > 0) process.exit(1)
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
