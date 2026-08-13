// /utils/scripts/verifyModelBuilderConfirmedOutcomeGuard.ts
//
// Meta-guard (model-builder/t-042, kaizen from t-029). Three separate t-029
// bug-hunt cycles found the same shape of defect in modelBuilderStore.ts: a
// store action calls one of the store's own Promise-returning helpers
// (pushItem's batch sibling batchPushItems, specifically -- see PR #1859)
// without awaiting it, then unconditionally shows a `setStatus`/
// `setStatusForRun` success toast the instant the request is *issued*
// rather than once it actually *confirms*. Each cycle so far added one
// narrow verifyModelBuilder*Guard.ts per fixed function
// (verifyModelBuilderBatchSetFieldConfirmedSuccessGuard.ts). This guard
// instead walks the whole file's action surface at once, so the next new
// batch/draft/push-style action added to the store gets this property
// checked automatically instead of needing its own bespoke guard
// discovered a cycle later.
//
// What counts as "the store's own Promise-returning helpers" is computed
// from the file itself, not hardcoded: any top-level function declared
// `async function NAME(...)`, or a non-async `function NAME(...):
// Promise<...>` (batchPushItems' own shape -- see its doc comment: "Returns
// whether the write actually succeeded, so a caller that summarizes its own
// outcome ... can await the real result instead of assuming success the
// instant the request is issued"). A function with a plain `void` return
// (pushItem, approveStage, ...) is deliberately excluded: this store's own
// idiom is that those ARE meant to be fired-and-forgotten in the background
// (their own internal `.then`/`.catch` already scope their failure toast via
// setStatusForRun), and a caller reporting success based on locally-known,
// already-confirmed state right after firing one (e.g. generateItemAsset's
// "Generated a candidate" toast, reporting the *render* succeeding, with
// pushItem firing the background persist alongside it) is the established,
// correct pattern -- not the bug this guards against.
//
// For every top-level function in the store that contains a 'success'-toned
// setStatus(...)/setStatusForRun(...) call anywhere in its body, this
// asserts: no *bare* (i.e. a stand-alone expression-statement, not awaited,
// not assigned, not returned, and not explicitly marked with the `void`
// operator to declare an intentional fire-and-forget -- see
// generateItemAssetAsync's `void pollAsyncArtJob(...)`) call to one of the
// store's own Promise-returning helpers appears anywhere before that
// success toast in the same function body. Deliberately scoped to this
// store's own textual idiom over a general-purpose static analyzer, per
// this codebase's established narrow-textual-guard convention.
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { extractFunctionBodies } from './verifyModelBuilderCompletionGate.js'

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const repositoryRoot = resolve(scriptDirectory, '../..')

const STORE_PATH = join(repositoryRoot, 'stores/modelBuilderStore.ts')

const SIGNATURE_PATTERN = /^ {2}(async )?function (\w+)\s*\(/gm

export interface PromiseHelper {
  name: string
  isAsync: boolean
}

// Every top-level `function NAME(` (this store's setup-function convention,
// mirroring extractFunctionBodies' own signature pattern) that either is
// declared `async` or whose parameter list is followed by a `: Promise<`
// return-type annotation before its body's opening brace.
export function findPromiseReturningHelpers(content: string): PromiseHelper[] {
  const helpers: PromiseHelper[] = []

  for (const match of content.matchAll(SIGNATURE_PATTERN)) {
    const isAsync = Boolean(match[1])
    const name = match[2]!
    const parenOpen = match.index + match[0].length - 1

    let parenDepth = 0
    let i = parenOpen
    for (; i < content.length; i++) {
      if (content[i] === '(') parenDepth++
      else if (content[i] === ')') {
        parenDepth--
        if (parenDepth === 0) break
      }
    }
    if (parenDepth !== 0) continue

    const braceOpen = content.indexOf('{', i)
    if (braceOpen === -1) continue

    // The text between the parameter list's closing ')' and the body's
    // opening '{' is the return-type annotation, if any (e.g.
    // `): Promise<boolean> {`).
    const returnType = content.slice(i + 1, braceOpen)

    if (isAsync || /:\s*Promise</.test(returnType)) {
      helpers.push({ name, isAsync })
    }
  }

  return helpers
}

// True if a 'success'-toned setStatus(...) or setStatusForRun(...) call
// appears anywhere in `body`. Both functions take the tone as a string
// literal argument ('success' | 'error'); matching the literal is enough --
// this codebase's own message strings are always template literals, never
// bare 'success'/'error' quoted strings, so there's no realistic collision.
function hasSuccessToast(body: string): boolean {
  return /\bsetStatus(?:ForRun)?\([^)]*?'success'/s.test(body)
}

export interface ConfirmedOutcomeViolation {
  functionName: string
  helperName: string
  line: number
}

// A "bare" call to `helperName(` -- a stand-alone expression statement, not
// `await helperName(`, not `const x = helperName(`/`return helperName(`,
// and not explicitly fire-and-forgotten via the `void` operator. Anchored
// to the start of a line (after indentation) so an assignment, return, or
// await -- which all put a different token before the call on the same
// line -- never match.
function findBareCalls(body: string, helperName: string): number[] {
  const pattern = new RegExp(`^[ \\t]*${helperName}\\(`, 'gm')
  return [...body.matchAll(pattern)].map((m) => m.index)
}

export function checkConfirmedOutcomeGuard(content: string): string[] {
  const errors: string[] = []
  const helpers = findPromiseReturningHelpers(content)
  const functions = extractFunctionBodies(content)

  for (const fn of functions) {
    if (!hasSuccessToast(fn.body)) continue

    // A function may legitimately call itself recursively or reference its
    // own name in a comment; only other helpers matter for the "did this
    // function fire-and-forget something it's about to claim succeeded"
    // check.
    for (const helper of helpers) {
      if (helper.name === fn.name) continue

      const bareOffsets = findBareCalls(fn.body, helper.name)
      if (!bareOffsets.length) continue

      // Only the toast(s) that occur AFTER the bare call are in scope --
      // a success toast for a fully separate, earlier branch of the same
      // function isn't describing this call's outcome.
      const successToastPattern = /\bsetStatus(?:ForRun)?\([^)]*?'success'/gs
      const toastOffsets = [...fn.body.matchAll(successToastPattern)].map(
        (m) => m.index,
      )

      const earliestBare = Math.min(...bareOffsets)
      const violatingToast = toastOffsets.find((t) => t > earliestBare)
      if (violatingToast === undefined) continue

      const absoluteOffset = fn.bodyStart + earliestBare
      const line = content.slice(0, absoluteOffset).split('\n').length

      errors.push(
        `${fn.name}() line ${line}: calls ${helper.name}(...) without ` +
          '`await`, `return`, an assignment, or an explicit `void` marker, ' +
          "then shows a 'success' status toast later in the same function " +
          `-- the toast fires the instant ${helper.name}(...) is issued, ` +
          'not once it actually confirms. Either `await` the call and gate ' +
          'the toast on its real result (see batchSetField), or mark it ' +
          '`void ' +
          `${helper.name}(...)\` if it's meant to keep running in the ` +
          'background and the toast is reporting on separately-confirmed ' +
          'work instead (see generateItemAssetAsync/pollAsyncArtJob).',
      )
    }
  }

  return errors
}

function main(): void {
  const content = readFileSync(STORE_PATH, 'utf8')
  const errors = checkConfirmedOutcomeGuard(content)

  if (errors.length) {
    console.error(
      'Model Builder confirmed-outcome-before-toast meta-guard failed in ' +
        'modelBuilderStore.ts:',
    )
    for (const error of errors) console.error(`- ${error}`)
    process.exitCode = 1
    return
  }

  console.log(
    'Model Builder confirmed-outcome-before-toast meta-guard passed: every ' +
      "store action with a 'success' status toast either has no bare, " +
      "unhandled call to one of the store's own Promise-returning helpers " +
      'ahead of it, or that call is explicitly `void`-marked as intentional.',
  )
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  main()
}
