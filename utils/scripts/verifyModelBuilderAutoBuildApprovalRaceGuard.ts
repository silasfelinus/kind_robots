// /utils/scripts/verifyModelBuilderAutoBuildApprovalRaceGuard.ts
//
// Regression guard (model-builder/t-029) -- autoBuildItem()'s
// FIELDS_AND_PROMPTS and GENERATE_ASSETS blocks each await a draft/generate
// call and then call approveStage(itemId, 'KEY') unconditionally right
// after. approveStage() (unlike finishGenerateAssets/finishCommit) has no
// in-flight check of its own -- it unconditionally overwrites
// item.stages[stageKey] to 'approved'. The Edit buttons in
// model-builder-item-panel.vue are gated only by `:disabled="isCommitting"`,
// not isAutoBuilding, so they stay clickable throughout an auto-build run: a
// concurrent Edit click on an earlier stage calls reopenStage(), which
// markDownstreamStale()s every stage after it, including whichever one
// autoBuildItem is mid-await on. When that await resolves, its boolean
// result (drafted / generated) only reflects whether the underlying network
// call succeeded -- not whether the stage is still the same 'ready' state
// autoBuildItem itself put it in. Before this fix, the unconditional
// approveStage() call clobbered a correctly-set 'stale' back to 'approved',
// silently re-approving unreviewed content and unlocking COMMIT on it.
//
// verifyModelBuilderCompletionGate.ts already guards this bug *class* for
// direct `item.stages.KEY = ...` assignments after an await, but
// approveStage() writes via bracket notation (`item.stages[stageKey] = ...`)
// inside its own synchronous function body -- neither the direct-assignment
// regex nor the isAsync-only function scan in that checker reaches a call
// site like `approveStage(itemId, 'GENERATE_ASSETS')`. This is a narrower,
// deliberately explicit companion check for exactly those two call sites,
// mirroring verifyModelBuilderAutoBuildDraftGate.ts's preference for a
// literal textual anchor over a general-purpose static analyzer.
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { extractFunctionBodies } from './verifyModelBuilderCompletionGate.js'

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const repositoryRoot = resolve(scriptDirectory, '../..')

const STORE_PATH = join(repositoryRoot, 'stores/modelBuilderStore.ts')

const FN_NAME = 'autoBuildItem'

const APPROVAL_GATES = ['FIELDS_AND_PROMPTS', 'GENERATE_ASSETS'] as const

// Checks the fix's exact shape against the full source text of a file
// containing an `autoBuildItem`-named async function. Exported (rather than
// only exercised via main()) so the self-test below can run it against
// synthetic buggy/fixed fixtures without touching the real store file.
export function checkAutoBuildApprovalRaceGuard(content: string): string[] {
  const errors: string[] = []

  const functions = extractFunctionBodies(content)
  const fn = functions.find((f) => f.name === FN_NAME)
  if (!fn) {
    errors.push(
      `Could not find an async function named ${FN_NAME}() -- has it been ` +
        'renamed, removed, or inlined? If so, this guard (and the bug it ' +
        'protects against) needs to move with it.',
    )
    return errors
  }

  for (const stageKey of APPROVAL_GATES) {
    const approvePattern = new RegExp(`approveStage\\(itemId, '${stageKey}'\\)`)
    const approveMatch = approvePattern.exec(fn.body)
    if (!approveMatch) {
      errors.push(
        `${FN_NAME}() no longer calls approveStage(itemId, '${stageKey}') ` +
          "-- this guard's anchor point has moved.",
      )
      continue
    }

    // The status check must immediately gate the approveStage() call --
    // require it as the `if` condition wrapping the call (allowing a
    // reasonable amount of intervening whitespace/comment, but not an
    // unrelated block of logic) rather than accepting a check anywhere
    // earlier in the function body.
    const before = fn.body.slice(0, approveMatch.index)
    const guardPattern = new RegExp(
      `if \\(item\\.stages\\.${stageKey}\\.status === 'ready'\\)\\s*\\{\\s*$`,
    )
    if (!guardPattern.test(before)) {
      errors.push(
        `${FN_NAME}()'s approveStage(itemId, '${stageKey}') call is not ` +
          `immediately wrapped in ` +
          `\`if (item.stages.${stageKey}.status === 'ready') { ... }\`. ` +
          'Without that guard, a concurrent Edit click on an earlier stage ' +
          '(clickable throughout auto-build -- the Edit buttons in ' +
          'model-builder-item-panel.vue are gated only by isCommitting, ' +
          'not isAutoBuilding) can markDownstreamStale() this stage while ' +
          'the preceding await is pending. approveStage() has no in-flight ' +
          'check of its own, so it would silently clobber the correctly-set ' +
          "'stale' status back to 'approved', re-approving unreviewed " +
          'content and unlocking COMMIT on it.',
      )
      continue
    }

    // The non-'ready' branch must not fall through to approveStage() --
    // require an `else { return 'failed' }` (or equivalent bail) rather
    // than just trusting the guard's braces to be closed correctly.
    const approveEnd = approveMatch.index + approveMatch[0].length
    const afterApprove = fn.body.slice(approveEnd, approveEnd + 200)
    if (!/^\s*\}\s*else\s*\{\s*return 'failed'/.test(afterApprove)) {
      errors.push(
        `${FN_NAME}()'s '${stageKey}' approval guard does not fall back to ` +
          `\`else { return 'failed' }\` when the stage is not 'ready'. ` +
          'Without an explicit bail, a stage staled by a concurrent edit ' +
          'would silently stay stale/unapproved with no signal to the ' +
          'caller (batchAutoBuild/autoBuildRun) that this item needs ' +
          're-review.',
      )
    }
  }

  return errors
}

function main(): void {
  const content = readFileSync(STORE_PATH, 'utf8')
  const errors = checkAutoBuildApprovalRaceGuard(content)

  if (errors.length) {
    console.error(
      'Model Builder auto-build approval-race guard contract failed for ' +
        `${FN_NAME}() in modelBuilderStore.ts:`,
    )
    for (const error of errors) console.error(`- ${error}`)
    process.exitCode = 1
    return
  }

  console.log(
    'Model Builder auto-build approval-race guard contract passed: ' +
      `${FN_NAME}() only approves FIELDS_AND_PROMPTS/GENERATE_ASSETS after ` +
      'confirming the stage is still ready, not concurrently staled.',
  )
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  main()
}
