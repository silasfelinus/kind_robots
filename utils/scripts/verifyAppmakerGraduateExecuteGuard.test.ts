// /utils/scripts/verifyAppmakerGraduateExecuteGuard.test.ts
//
// Regression test for checkGraduateExecuteGuard() in
// verifyAppmakerGraduateExecuteGuard.ts (appmaker/t-015). Exercises the real
// check against a synthetic route-shaped fixture: the fixed shape (every
// invariant present), and one fixture per invariant with just that one
// dropped, so each assertion is proven to actually fire rather than always
// passing vacuously.
import assert from 'node:assert/strict'

import { checkGraduateExecuteGuard } from './verifyAppmakerGraduateExecuteGuard.js'

const FIXED_ROUTE = `
import { requireAdminApiUser } from '@/server/utils/authGuard'
import { listInstallationRepositories, openConductorAppRemovalPr } from '@/server/utils/appmakerGithub'

export default defineEventHandler(async (event) => {
  await requireAdminApiUser(event)

  const todo = await prisma.todo.findFirst({
    where: { title: GRADUATE_TODO_TITLE(slug), status: 'OPEN' },
  })

  if (installation.suspendedAt) {
    throw createError({ statusCode: 409 })
  }
  const granted = await listInstallationRepositories(Number(installation.installationId))

  const removalResult = await openConductorAppRemovalPr({ slug })

  await prisma.todo.update({
    where: { id: todo.id },
    data: { status: 'DONE' },
  })
})
`

function withoutAdminGate(): string {
  return FIXED_ROUTE.replace(
    'await requireAdminApiUser(event)',
    'await requireApiUser(event)',
  )
}

function withoutTodoGate(): string {
  return FIXED_ROUTE.replace(
    `const todo = await prisma.todo.findFirst({
    where: { title: GRADUATE_TODO_TITLE(slug), status: 'OPEN' },
  })

  `,
    '',
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

function withoutTodoDone(): string {
  return FIXED_ROUTE.replace(
    `
  await prisma.todo.update({
    where: { id: todo.id },
    data: { status: 'DONE' },
  })
`,
    '\n',
  )
}

function withTodoDoneBeforeRemoval(): string {
  return FIXED_ROUTE.replace(
    `  const removalResult = await openConductorAppRemovalPr({ slug })

  await prisma.todo.update({
    where: { id: todo.id },
    data: { status: 'DONE' },
  })`,
    `  await prisma.todo.update({
    where: { id: todo.id },
    data: { status: 'DONE' },
  })

  const removalResult = await openConductorAppRemovalPr({ slug })`,
  )
}

function run(): void {
  const fixedErrors = checkGraduateExecuteGuard(FIXED_ROUTE)
  assert.deepEqual(
    fixedErrors,
    [],
    `expected the fixed fixture to pass, got: ${JSON.stringify(fixedErrors)}`,
  )

  const cases: Array<[string, string, RegExp]> = [
    [
      'missing admin gate',
      withoutAdminGate(),
      /no longer calls requireAdminApiUser/,
    ],
    [
      'missing Todo gate',
      withoutTodoGate(),
      /no longer requires an OPEN graduation Todo/,
    ],
    [
      'missing suspended check',
      withoutSuspendedCheck(),
      /no longer checks installation\.suspendedAt/,
    ],
    [
      'missing grant re-validation',
      withoutGrantCheck(),
      /no longer re-validates the target repo/,
    ],
    [
      'missing Todo-done update',
      withoutTodoDone(),
      /no longer marks the triggering Todo DONE/,
    ],
    [
      'Todo marked done before removal PR',
      withTodoDoneBeforeRemoval(),
      /marks the Todo done before/,
    ],
  ]

  for (const [label, route, expected] of cases) {
    const errors = checkGraduateExecuteGuard(route)
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
    'AppMaker graduate-execute guard self-test passed: fixed fixture ' +
      'passes, and each of the 6 dropped-invariant fixtures fails its own ' +
      'specific check.',
  )
}

run()
