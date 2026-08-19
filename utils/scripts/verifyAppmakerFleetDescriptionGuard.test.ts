// /utils/scripts/verifyAppmakerFleetDescriptionGuard.test.ts
//
// Regression test for checkFleetDescriptionGuard() in
// verifyAppmakerFleetDescriptionGuard.ts (appmaker/t-012). Exercises the
// real check against synthetic component-shaped fixtures covering: the
// fixed shape (description prefers goal, then notesFromSilas, then the
// empty-task literal), the pre-fix shape (description only ever the
// empty-task literal), and partial regressions (only one of the two real
// fields dropped).
import assert from 'node:assert/strict'

import { checkFleetDescriptionGuard } from './verifyAppmakerFleetDescriptionGuard.js'

function fixture(fleetBody: string): string {
  return `
<script setup lang="ts">
const slugError = computed(() => '')

const fleet = computed<FleetApp[]>(() =>
${fleetBody}
)
</script>
`
}

const FIXED = fixture(`
  scaffolded.value.map((slug) => {
    const project = conductorStore.projects.find(
      (candidate) => candidate.slug === slug,
    )
    const tasks = project?.tasks ?? []
    const description =
      project?.goal || project?.notesFromSilas || ''
    return {
      slug,
      title: project?.name || titleize(slug),
      description: description || (tasks.length === 0 ? 'Freshly scaffolded.' : ''),
      taskDone: tasks.filter((task) => task.status === 'done').length,
      taskTotal: tasks.length,
      needsHuman: tasks.filter((task) => task.status === 'needs-human').length,
    }
  }),
`)

// Pre-fix shape: description is only ever the empty-task literal, never a
// real project field.
const BUGGY = fixture(`
  scaffolded.value.map((slug) => {
    const project = conductorStore.projects.find(
      (candidate) => candidate.slug === slug,
    )
    const tasks = project?.tasks ?? []
    return {
      slug,
      title: project?.name || titleize(slug),
      description: tasks.length === 0 ? 'Freshly scaffolded.' : '',
      taskDone: tasks.filter((task) => task.status === 'done').length,
      taskTotal: tasks.length,
      needsHuman: tasks.filter((task) => task.status === 'needs-human').length,
    }
  }),
`)

// Partial regression: goal survived but the notesFromSilas fallback (the
// only field new_app.py actually seeds on a freshly scaffolded app) was
// dropped.
const PARTIALLY_REGRESSED = fixture(`
  scaffolded.value.map((slug) => {
    const project = conductorStore.projects.find(
      (candidate) => candidate.slug === slug,
    )
    const tasks = project?.tasks ?? []
    const description = project?.goal || ''
    return {
      slug,
      title: project?.name || titleize(slug),
      description: description || (tasks.length === 0 ? 'Freshly scaffolded.' : ''),
      taskDone: tasks.filter((task) => task.status === 'done').length,
      taskTotal: tasks.length,
      needsHuman: tasks.filter((task) => task.status === 'needs-human').length,
    }
  }),
`)

function run(): void {
  const fixedErrors = checkFleetDescriptionGuard(FIXED)
  assert.deepEqual(
    fixedErrors,
    [],
    `expected the fixed fixture to pass, got: ${JSON.stringify(fixedErrors)}`,
  )

  const buggyErrors = checkFleetDescriptionGuard(BUGGY)
  assert.equal(
    buggyErrors.length,
    2,
    `expected the pre-fix fixture (no goal, no notesFromSilas) to fail both ` +
      `real-field checks, got: ${JSON.stringify(buggyErrors)}`,
  )
  assert.ok(
    buggyErrors.some((e) => /no longer reads `project\?\.goal`/.test(e)),
  )
  assert.ok(
    buggyErrors.some((e) => /no longer falls back to.*notesFromSilas/.test(e)),
  )

  const regressedErrors = checkFleetDescriptionGuard(PARTIALLY_REGRESSED)
  assert.equal(
    regressedErrors.length,
    1,
    'expected a fixture missing only the notesFromSilas fallback to fail ' +
      `only that assertion, got: ${JSON.stringify(regressedErrors)}`,
  )
  assert.ok(
    regressedErrors.some((e) =>
      /no longer falls back to.*notesFromSilas/.test(e),
    ),
  )

  const missingFunction = checkFleetDescriptionGuard(
    '<script setup lang="ts">\nconst somethingElse = 1\n</script>\n',
  )
  assert.equal(missingFunction.length, 1)
  assert.ok(missingFunction.some((e) => /Could not find/.test(e)))

  console.log(
    'AppMaker fleet-description guard self-test passed: buggy fixture ' +
      'fails, fixed fixture passes, a partially-regressed fixture fails, ' +
      'and a missing fleet computed is detected.',
  )
}

run()
