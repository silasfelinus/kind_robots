// /utils/scripts/verifyAppmakerGraduateRequestGuard.test.ts
//
// Regression test for checkGraduateRequestGuard() in
// verifyAppmakerGraduateRequestGuard.ts (appmaker/t-010). Exercises the real
// check against synthetic route-shaped fixtures: the fixed shape (every
// invariant present), and one fixture per invariant with just that one
// dropped, so each assertion is proven to actually fire rather than always
// passing vacuously.
import assert from 'node:assert/strict'

import { checkGraduateRequestGuard } from './verifyAppmakerGraduateRequestGuard.js'

const FIXED_ROUTE = `
import { requireAdminApiUser } from '@/server/utils/authGuard'
import { listInstallationRepositories } from '@/server/utils/appmakerGithub'

export default defineEventHandler(async (event) => {
  const { user } = await requireAdminApiUser(event)

  const existingAppRepo = await prisma.appRepo.findFirst({
    where: { slug },
    select: { id: true },
  })

  const installation = await prisma.githubInstallation.findFirst({
    where: { id: installationId, userId: user.id },
  })
  if (installation.suspendedAt) {
    throw createError({ statusCode: 409 })
  }
  const granted = await listInstallationRepositories(Number(installation.installationId))

  const todo = await tx.todo.create({
    data: {
      title: \`Graduate app '\${slug}' to its own repo\`,
    },
  })
})
`

const FIXED_APPS_ROUTE = `
const GRADUATE_TITLE_RE = /^Graduate app '([a-z0-9-]+)' to its own repo/
`

function withoutAdminGate(): string {
  return FIXED_ROUTE.replace(
    'const { user } = await requireAdminApiUser(event)',
    'const { user } = await requireApiUser(event)',
  )
}

function withoutCollisionCheck(): string {
  return FIXED_ROUTE.replace(
    `const existingAppRepo = await prisma.appRepo.findFirst({
    where: { slug },
    select: { id: true },
  })

  `,
    '',
  )
}

function withoutInstallationOwnershipScope(): string {
  return FIXED_ROUTE.replace(
    'where: { id: installationId, userId: user.id },',
    'where: { id: installationId },',
  )
}

function withoutSuspendedCheck(): string {
  return FIXED_ROUTE.replace(
    `if (installation.suspendedAt) {
    throw createError({ statusCode: 409 })
  }
  `,
    '',
  )
}

function withoutGrantCheck(): string {
  return FIXED_ROUTE.replace(
    'const granted = await listInstallationRepositories(Number(installation.installationId))\n\n  ',
    '',
  )
}

function withWrongTodoTitle(): string {
  return FIXED_ROUTE.replace(
    `title: \`Graduate app '\${slug}' to its own repo\`,`,
    `title: \`Graduate '\${slug}'\`,`,
  )
}

function withStaleRegex(): string {
  return FIXED_APPS_ROUTE.replace(
    "/^Graduate app '([a-z0-9-]+)' to its own repo/",
    "/^Graduate '([a-z0-9-]+)'/",
  )
}

function run(): void {
  const fixedErrors = checkGraduateRequestGuard(FIXED_ROUTE, FIXED_APPS_ROUTE)
  assert.deepEqual(
    fixedErrors,
    [],
    `expected the fixed fixture to pass, got: ${JSON.stringify(fixedErrors)}`,
  )

  const cases: Array<[string, string, string, RegExp]> = [
    [
      'missing admin gate',
      withoutAdminGate(),
      FIXED_APPS_ROUTE,
      /no longer calls requireAdminApiUser/,
    ],
    [
      'missing collision check',
      withoutCollisionCheck(),
      FIXED_APPS_ROUTE,
      /no longer checks for an existing AppRepo/,
    ],
    [
      'missing installation ownership scope',
      withoutInstallationOwnershipScope(),
      FIXED_APPS_ROUTE,
      /no longer scopes the installation lookup/,
    ],
    [
      'missing suspended check',
      withoutSuspendedCheck(),
      FIXED_APPS_ROUTE,
      /no longer checks installation\.suspendedAt/,
    ],
    [
      'missing grant check',
      withoutGrantCheck(),
      FIXED_APPS_ROUTE,
      /no longer calls listInstallationRepositories/,
    ],
    [
      'wrong Todo title',
      withWrongTodoTitle(),
      FIXED_APPS_ROUTE,
      /filed Todo title no longer matches/,
    ],
    [
      'stale GRADUATE_TITLE_RE',
      FIXED_ROUTE,
      withStaleRegex(),
      /GRADUATE_TITLE_RE no longer matches/,
    ],
  ]

  for (const [label, route, appsRoute, expected] of cases) {
    const errors = checkGraduateRequestGuard(route, appsRoute)
    assert.ok(
      errors.length > 0,
      `expected "${label}" fixture to fail at least one check, got none`,
    )
    assert.ok(
      errors.some((e) => expected.test(e)),
      `expected "${label}" fixture's errors to include something matching ` +
        `${expected}, got: ${JSON.stringify(errors)}`,
    )
  }

  console.log(
    'AppMaker graduate-request guard self-test passed: fixed fixture ' +
      'passes, and each of the 7 dropped-invariant fixtures fails its own ' +
      'specific check.',
  )
}

run()
