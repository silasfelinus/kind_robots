// /utils/scripts/verifyModelBuilderSingleItemRevertGuard.ts
//
// Regression guard (model-builder/t-029 cycle 10). Cycle 9 gave
// batchPushItems() a `{ ok, failedIds }` result so batchApproveStage() /
// batchSetField() could revert exactly the group entries a partial batch
// failure rejected (see verifyModelBuilderBatchPartialFailureRevertGuard.ts),
// and left as its suggested next lead: pushItem() -- the single-item
// background PATCH used by approveStage/rejectStage/reopenStage/updatePitch/
// updateFields/updatePrompt -- has the identical fire-and-forget,
// no-local-revert-on-failure shape. A failed single-item PATCH already
// surfaced an error toast via setStatusForRun, but the item itself (approved
// badge, edited pitch/fields/prompt text, stage statuses) kept showing the
// unpersisted optimistic change until a full reload rebuilt it from the
// server's real (unchanged) state -- the same "review gate lying about what's
// actually stored" class of bug this codebase treats as real everywhere else
// it's found (batch scope, item.error persistence, stageStatuses JSON
// parsing, ...).
//
// Fixed by giving pushItem() an optional `onFailure?: () => void` callback,
// invoked from both its `.then` success:false branch and its `.catch` branch
// (mirroring where it already calls setStatusForRun), and having each of the
// six single-item mutators snapshot the fields it's about to change and pass
// a revert closure as pushItem's 4th argument.
//
// This asserts the textual shape of that fix stays in place: pushItem()
// declares an `onFailure` parameter and invokes it (`onFailure?.()` or
// `onFailure()`) from both its response-handling branches, and each of the
// six callers below both snapshots its own pre-mutation state and passes an
// arrow-function 4th argument to its own pushItem(...) call that reassigns
// at least one of the snapshotted fields back.
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { extractFunctionBodies } from './verifyModelBuilderCompletionGate.js'

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const repositoryRoot = resolve(scriptDirectory, '../..')

const STORE_PATH = join(repositoryRoot, 'stores/modelBuilderStore.ts')

// extractFunctionBodies only captures a function's body (between its outer
// braces), not its parameter list, so the onFailure *parameter* has to be
// checked against the raw signature text instead of fn.body. Captures
// everything between pushItem('s opening paren and the `): void {` that
// closes its parameter list -- non-greedy, so it stops at the first such
// close rather than a later unrelated one -- and requires an `onFailure`
// parameter somewhere in that captured list.
const PUSHITEM_SIGNATURE = /function pushItem\(([\s\S]*?)\)\s*:\s*void\s*\{/
const ONFAILURE_PARAM = /onFailure\s*\?\s*:\s*\(\s*\)\s*=>\s*void/
const ONFAILURE_CALL = /onFailure\s*\?\.?\s*\(\s*\)/

// Each single-item mutator: the field(s) it snapshots before mutating, and
// the field it must restore inside the 4th-argument revert closure passed to
// its own pushItem(...) call.
const CALLER_FIELDS: Record<string, string> = {
  approveStage: 'stages',
  rejectStage: 'stages',
  reopenStage: 'stages',
  updatePitch: 'pitch',
  updateFields: 'fieldsDraft',
  updatePrompt: 'promptDraft',
}

export function checkSingleItemRevertGuard(content: string): string[] {
  const errors: string[] = []
  const functions = extractFunctionBodies(content)

  const pushItemFn = functions.find((f) => f.name === 'pushItem')
  if (!pushItemFn) {
    errors.push(
      'Could not find a function named pushItem() -- has it been renamed, ' +
        'removed, or inlined? If so, this guard (and the bug it protects ' +
        'against) needs to move with it.',
    )
  } else {
    const signatureMatch = PUSHITEM_SIGNATURE.exec(content)
    if (!signatureMatch || !ONFAILURE_PARAM.test(signatureMatch[1]!)) {
      errors.push(
        'pushItem() no longer declares an `onFailure?: () => void` ' +
          'parameter -- without it, none of its callers have a way to ' +
          'revert their optimistic local mutation when the PATCH actually ' +
          'fails.',
      )
    }
    const onFailureCalls = pushItemFn.body.match(
      new RegExp(ONFAILURE_CALL, 'g'),
    )
    if (!onFailureCalls || onFailureCalls.length < 2) {
      errors.push(
        'pushItem() no longer invokes onFailure() from both its `.then` ' +
          'success:false branch and its `.catch` branch -- a failure ' +
          'reached through only one of the two paths would silently skip ' +
          "the caller's revert.",
      )
    }
  }

  for (const [fnName, field] of Object.entries(CALLER_FIELDS)) {
    const fn = functions.find((f) => f.name === fnName)
    if (!fn) {
      errors.push(
        `Could not find a function named ${fnName}() -- has it been ` +
          'renamed, removed, or inlined? If so, this guard (and the bug it ' +
          'protects against) needs to move with it.',
      )
      continue
    }

    const snapshotPattern = new RegExp(
      `const\\s+previous\\w*\\s*=\\s*(\\{\\s*\\.\\.\\.item\\.${field}\\s*\\}|item\\.${field})`,
    )
    if (!snapshotPattern.test(fn.body)) {
      errors.push(
        `${fnName}() no longer snapshots item.${field} into a \`previous*\` ` +
          'const before mutating it -- without a pre-mutation snapshot, a ' +
          'failed PATCH has nothing correct to revert to.',
      )
    }

    // The revert closure must be pushItem's 4th argument and must reassign
    // the snapshotted field back onto the item.
    const revertPattern = new RegExp(
      `pushItem\\([\\s\\S]*?,\\s*\\(\\)\\s*=>\\s*\\{[\\s\\S]*?item\\.${field}\\s*=\\s*previous\\w*[\\s\\S]*?\\}\\s*,?\\s*\\)`,
    )
    if (!revertPattern.test(fn.body)) {
      errors.push(
        `${fnName}() no longer passes a revert closure as pushItem()'s 4th ` +
          `argument that restores item.${field} from its snapshot -- a ` +
          'failed PATCH would leave this item showing an unpersisted ' +
          'optimistic change until a full reload.',
      )
    }
  }

  return errors
}

function main(): void {
  const content = readFileSync(STORE_PATH, 'utf8')
  const errors = checkSingleItemRevertGuard(content)

  if (errors.length) {
    console.error(
      'Model Builder single-item revert-on-failure guard contract failed ' +
        'in modelBuilderStore.ts:',
    )
    for (const error of errors) console.error(`- ${error}`)
    process.exitCode = 1
    return
  }

  console.log(
    'Model Builder single-item revert-on-failure guard contract passed: ' +
      'pushItem() supports an onFailure callback invoked on both failure ' +
      'paths, and approveStage/rejectStage/reopenStage/updatePitch/' +
      'updateFields/updatePrompt each snapshot and revert their own ' +
      'optimistic mutation when the PATCH actually fails.',
  )
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  main()
}
