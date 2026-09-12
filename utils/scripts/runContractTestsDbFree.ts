// /utils/scripts/runContractTestsDbFree.ts
//
// Run every Contract Tests script the way CI runs it: with no DATABASE_URL.
//
// WHY THIS EXISTS. The workflow says of itself "Fast, DB-free contract checks
// ... No database or Nuxt build is needed, so these can gate every pull
// request", and server/utils/prisma.ts throws at module scope when
// DATABASE_URL is absent. So a contract test that reaches prisma through any
// import in its graph does not fail an assertion -- it dies on import and
// takes the whole job red.
//
// That has now happened twice, both times to a test guarding something worth
// guarding:
//
//   2026-09-11  verifyAnimatedArtOffload.test.ts imported artImageOffload.ts
//               (-> prisma). Fixed by splitting the encode decision into
//               artImageEncoding.ts.
//   2026-09-12  verifySceneAnimatorPromptOverride.test.ts imported
//               sceneAnimatorPromptStore.ts (-> prisma). Fixed by splitting the
//               prompt decision into sceneAnimatorPromptResolve.ts.
//
// Both passed locally and failed in CI, for one boring reason: a provisioned
// sandbox exports a dummy DATABASE_URL (see conductor's
// scripts/provision_kind_robots_deps.sh), so the local run is not the CI run.
//
// This closes that gap by executing the real scripts with the variable
// removed, rather than by trying to infer the answer from source. An earlier
// attempt did static import-graph analysis and produced two false positives
// within a minute -- a deliberate lazy `await import()` in
// textProviderService.ts, and an `import prisma` sitting inside a template
// literal fixture. Running the thing is both simpler and actually correct.
//
// NOT wired into contract-tests.yml on purpose: CI already runs each of these
// without a DATABASE_URL, so this would only duplicate it. This is the
// pre-push command that makes a local run mean something.
//
//   npm run test:contracts-db-free
import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const WORKFLOW = '.github/workflows/contract-tests.yml'

const root = process.cwd()
const workflow = readFileSync(resolve(root, WORKFLOW), 'utf8')

// `m[1]` is `string | undefined` under noUncheckedIndexedAccess even though the
// capture group always participates in a match; narrow rather than assert.
const scripts: string[] = [
  ...new Set(
    [...workflow.matchAll(/run:\s*npm run ([\w:-]+)/g)]
      .map((match) => match[1])
      .filter((name): name is string => Boolean(name)),
  ),
]

if (!scripts.length) {
  throw new Error(
    `no "npm run" steps found in ${WORKFLOW}; the workflow format changed and ` +
      `this would silently check nothing`,
  )
}

// The child must not inherit DATABASE_URL. Deleting it from a copy of the
// parent env is what `env -u` does, and is the whole point of this script.
const env: Record<string, string> = Object.fromEntries(
  Object.entries(process.env).filter(
    (entry): entry is [string, string] =>
      entry[0] !== 'DATABASE_URL' && entry[1] !== undefined,
  ),
)

const failed: string[] = []

console.log(`Running ${scripts.length} contract script(s) with DATABASE_URL unset...\n`)

for (const script of scripts) {
  const result = spawnSync('npm', ['run', '--silent', script], {
    cwd: root,
    env,
    encoding: 'utf8',
    shell: false,
  })

  const ok = result.status === 0
  console.log(`${ok ? '  ok  ' : '  FAIL'}  ${script}`)

  if (!ok) {
    failed.push(script)
    const output = `${result.stdout ?? ''}${result.stderr ?? ''}`.trim()
    for (const line of output.split('\n').slice(-12)) {
      console.log(`          ${line}`)
    }
  }
}

if (failed.length) {
  console.error(
    `\n❌ ${failed.length} contract script(s) failed without DATABASE_URL: ` +
      `${failed.join(', ')}\n\n` +
      '   If the failure is "DATABASE_URL is missing", the test reaches\n' +
      '   server/utils/prisma.ts on import. Move the pure decision into its own\n' +
      '   module -- see artImageEncoding.ts and sceneAnimatorPromptResolve.ts --\n' +
      '   rather than giving the DB-free workflow a database.\n',
  )
  process.exitCode = 1
} else {
  console.log(`\n✅ All ${scripts.length} contract scripts pass with no DATABASE_URL.`)
}
