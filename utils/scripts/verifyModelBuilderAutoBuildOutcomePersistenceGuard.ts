// /utils/scripts/verifyModelBuilderAutoBuildOutcomePersistenceGuard.ts
//
// Regression guard (model-builder/t-029) -- autoBuildRun()/batchAutoBuild()
// tally autoBuildItem()'s AutoBuildOutcome into run-wide committed/skipped/
// failed counters (see verifyModelBuilderAutoBuildFailedSummaryGuard.ts), but
// that summary only ever reached the UI as one aggregate toast at the end of
// a run/group. There was no per-item signal at all short of opening each
// item's own panel -- a large auto-build run with a handful of failures
// among dozens of successes looked identical, at a glance, to a run that
// fully succeeded, unless you clicked into every item to check.
//
// The fix has both loops mirror each item's outcome onto its own
// `item.lastAutoBuildOutcome` field (both for the outcome autoBuildItem()
// returns, and for the "already committed before this pass reached it"
// branch that skips calling autoBuildItem() at all) so
// model-builder-progress-matrix.vue and model-builder-batch-editor.vue can
// render a per-item badge without their own parallel bookkeeping. This
// guard checks both assignments stay in place in both functions: if a
// future refactor drops either, the aggregate counters keep working (the
// guard above stays green) while the per-item UI silently goes stale/blank
// again.
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { extractFunctionBodies } from './verifyModelBuilderCompletionGate.js'

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const repositoryRoot = resolve(scriptDirectory, '../..')

const STORE_PATH = join(repositoryRoot, 'stores/modelBuilderStore.ts')

const TARGET_FUNCTIONS = ['autoBuildRun', 'batchAutoBuild'] as const

// Checks the fix's exact shape against the full source text of a file
// containing `autoBuildRun`/`batchAutoBuild`-named functions. Exported
// (rather than only exercised via main()) so the self-test below can run it
// against synthetic buggy/fixed fixtures without touching the real store file.
export function checkAutoBuildOutcomePersistenceGuard(
  content: string,
): string[] {
  const errors: string[] = []

  const functions = extractFunctionBodies(content)

  for (const name of TARGET_FUNCTIONS) {
    const fn = functions.find((f) => f.name === name)
    if (!fn) {
      errors.push(
        `Could not find a function named ${name}() -- has it been renamed, ` +
          'removed, or inlined? If so, this guard (and the per-item outcome ' +
          'persistence it protects) needs to move with it.',
      )
      continue
    }

    const persistsAttemptedOutcome =
      /item\.lastAutoBuildOutcome\s*=\s*outcome\b/.test(fn.body)
    if (!persistsAttemptedOutcome) {
      errors.push(
        `${name}() does not assign the outcome of autoBuildItem() onto ` +
          "the item's own `lastAutoBuildOutcome` field (expected something " +
          'like `item.lastAutoBuildOutcome = outcome`). Without it, ' +
          "model-builder-progress-matrix.vue's and model-builder-batch-" +
          "editor.vue's per-item failed/committed badges have no per-item " +
          'signal to read once this run/batch finishes.',
      )
    }

    const persistsPreCommittedOutcome =
      /stages\.COMMIT\.status === 'approved'\)\s*\{[\s\S]{0,600}?item\.lastAutoBuildOutcome\s*=\s*'committed'/.test(
        fn.body,
      )
    if (!persistsPreCommittedOutcome) {
      errors.push(
        `${name}()'s "already committed before this pass" branch does not ` +
          "set item.lastAutoBuildOutcome = 'committed'. Without it, an " +
          'item committed before this run/batch reached it can keep ' +
          "showing a stale 'failed' badge from an earlier attempt, since " +
          'that branch `continue`s without ever calling autoBuildItem().',
      )
    }
  }

  return errors
}

function main(): void {
  const content = readFileSync(STORE_PATH, 'utf8')
  const errors = checkAutoBuildOutcomePersistenceGuard(content)

  if (errors.length) {
    console.error(
      'Model Builder auto-build outcome-persistence guard contract failed ' +
        'in modelBuilderStore.ts:',
    )
    for (const error of errors) console.error(`- ${error}`)
    process.exitCode = 1
    return
  }

  console.log(
    'Model Builder auto-build outcome-persistence guard contract passed: ' +
      'autoBuildRun() and batchAutoBuild() both mirror per-item outcomes ' +
      '(attempted and pre-committed) onto item.lastAutoBuildOutcome.',
  )
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  main()
}
