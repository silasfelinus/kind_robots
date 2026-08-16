// /utils/scripts/verifyModelBuilderAutoBuildFailedSummaryGuard.ts
//
// Regression guard (model-builder/t-029) -- autoBuildRun()/batchAutoBuild()'s
// per-item loop tallies autoBuildItem()'s AutoBuildOutcome into `committed`
// and `skipped` counters only, then unconditionally reports tone 'success'
// with a "committed/total" count once the loop finishes. A 'failed' outcome
// (a rejected commit -- e.g. the ASSET_ONLY branch's assertArtImageAttachable
// re-check in commit.post.ts firing because the ArtImage's owner changed its
// visibility mid-run -- an AI draft that came back empty, or any other real
// error autoBuildItem's own per-stage branches surface) is neither
// 'committed' nor 'skipped', so it silently vanished from both the count
// (committed + skipped < items.length with no explanation) and the tone: the
// final unconditional setStatus('success', ...) call also clobbers whatever
// 'error' status an earlier failed item in the same loop already set via
// setStatus/setStatusForRun, replacing it with a misleading green banner.
//
// This directly matters for the newly-added commit-time re-check: an
// ASSET_ONLY item's attachability can now legitimately fail at COMMIT even
// after every earlier gate passed, and auto-build/batch-auto-build are the
// exact surfaces that walk an item through every stage — including COMMIT —
// without a human reviewing each step, so a failure there most needs to be
// reported accurately.
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
export function checkAutoBuildFailedSummaryGuard(content: string): string[] {
  const errors: string[] = []

  const functions = extractFunctionBodies(content)

  for (const name of TARGET_FUNCTIONS) {
    const fn = functions.find((f) => f.name === name)
    if (!fn) {
      errors.push(
        `Could not find a function named ${name}() -- has it been renamed, ` +
          'removed, or inlined? If so, this guard (and the bug it protects ' +
          'against) needs to move with it.',
      )
      continue
    }

    const tracksFailed = /\bfailed\s*\+\+/.test(fn.body)
    if (!tracksFailed) {
      errors.push(
        `${name}() does not tally a 'failed' outcome from autoBuildItem() ` +
          'into its own counter (expected a `failed++` alongside `committed++`' +
          ' / `skipped++`). Without it, a rejected commit is invisible in ' +
          "this function's final summary.",
      )
      continue
    }

    const finalSetStatusMatch = fn.body.match(
      /setStatus\(\s*([\s\S]*?),\s*`[^`]*`\s*,?\s*\)/,
    )
    if (!finalSetStatusMatch) {
      errors.push(
        `${name}() does not appear to call setStatus(...) with its final ` +
          'summary message.',
      )
      continue
    }
    const toneExpression = finalSetStatusMatch[1]!
    const toneReflectsFailure =
      /failed\s*\?\s*'error'\s*:\s*'success'/.test(toneExpression) ||
      (/failed/.test(toneExpression) && /'error'/.test(toneExpression))
    if (!toneReflectsFailure) {
      errors.push(
        `${name}()'s final setStatus(...) call does not switch tone to ` +
          "'error' when failed > 0 -- it will report a plain 'success' " +
          'banner even when a real commit/draft/generate failure occurred ' +
          'in this run/group.',
      )
    }
  }

  return errors
}

function main(): void {
  const content = readFileSync(STORE_PATH, 'utf8')
  const errors = checkAutoBuildFailedSummaryGuard(content)

  if (errors.length) {
    console.error(
      'Model Builder auto-build failed-summary guard contract failed in ' +
        'modelBuilderStore.ts:',
    )
    for (const error of errors) console.error(`- ${error}`)
    process.exitCode = 1
    return
  }

  console.log(
    'Model Builder auto-build failed-summary guard contract passed: ' +
      'autoBuildRun() and batchAutoBuild() both tally failed outcomes and ' +
      'report them (with an error tone) in their final summary.',
  )
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  main()
}
