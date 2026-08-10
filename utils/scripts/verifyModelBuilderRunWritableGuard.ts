// /utils/scripts/verifyModelBuilderRunWritableGuard.ts
//
// Regression guard (model-builder/t-039, kaizen from t-029's 2026-08-01T08:29Z
// cycle, kind_robots PR #1239) -- assertRunWritable() in
// server/api/model-builder/runs/index.ts closes a gap none of the
// write-capable item routes previously covered: cancelRun() marks a
// ModelBuildRun CANCELLED specifically so no further work lands on it, but
// until PR #1239 that intent was enforced only client-side (modelBuilderStore.ts's
// in-memory cancelledRunIds Set, wiped on reload and scoped to the one tab
// that issued the cancellation). A second tab, or a tab reloaded later
// against a stale `modelBuilder:runId`, had no way to learn the run was
// cancelled and could keep editing, generating, and durably committing into a
// run the user had already abandoned.
//
// PR #1239 added assertRunWritable(run) next to the existing assertRunAccess()
// call in all four write-capable item routes (items/[id].patch.ts,
// items/batch.patch.ts, items/[id]/artifacts.post.ts, items/[id]/commit.post.ts),
// but -- unlike every sibling client-side cancelledRunIds check -- shipped
// without a dedicated textual regression guard, per that cycle's own
// deferred kaizen note. A future refactor could silently drop the
// assertRunWritable() call from any one of the four routes with nothing
// failing except a live end-to-end test this sandbox can't run.
//
// This asserts the textual shape stays in place: each of the four routes
// calls assertRunWritable(<run>) immediately after assertRunAccess(<run>,
// auth.user) for the same run reference -- deliberately scoped to this one
// bug shape, mirroring verifyModelBuilderItemPatchStageGuard.ts's and
// verifyModelBuilderCommitCancelledRunGuard.ts's preference for explicit,
// narrow textual checks over a general-purpose static analyzer.
//
// This script is already wired into the required Contract Tests workflow. Two
// sibling Model Builder guard scripts were callable from package.json but never
// wired into that required job, which meant they could silently regress without
// blocking a PR. Until the workflow is reorganized, this required entry point
// also executes those two existing guards so the approved-asset and item-patch
// stage invariants are enforced by required CI rather than living as dormant
// npm scripts.
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { checkApprovedAssetGuard } from './verifyModelBuilderApprovedAssetGuard.js'
import { checkItemPatchStageGuard } from './verifyModelBuilderItemPatchStageGuard.js'

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const repositoryRoot = resolve(scriptDirectory, '../..')

interface RouteCheck {
  relativePath: string
  runVar: string
}

const ROUTES: RouteCheck[] = [
  {
    relativePath: 'server/api/model-builder/items/[id].patch.ts',
    runVar: 'existing.Run',
  },
  {
    relativePath: 'server/api/model-builder/items/batch.patch.ts',
    runVar: 'existing.Run',
  },
  {
    relativePath: 'server/api/model-builder/items/[id]/artifacts.post.ts',
    runVar: 'item.Run',
  },
  {
    relativePath: 'server/api/model-builder/items/[id]/commit.post.ts',
    runVar: 'item.Run',
  },
]

// Checks the fix's exact shape against the full source text of one route
// file. Exported (rather than only exercised via main()) so the self-test
// below can run it against synthetic route-shaped fixtures without touching
// the real route files.
export function checkRunWritableGuard(
  content: string,
  route: RouteCheck,
): string[] {
  const errors: string[] = []
  const escapedVar = route.runVar.replace(/\./g, '\\.')

  const accessPattern = new RegExp(
    `assertRunAccess\\(\\s*${escapedVar},\\s*auth\\.user\\s*\\)`,
  )
  const accessMatch = accessPattern.exec(content)
  if (!accessMatch) {
    errors.push(
      `${route.relativePath} no longer contains ` +
        `\`assertRunAccess(${route.runVar}, auth.user)\` -- this guard's ` +
        'anchor point has moved; re-check how run ownership is verified here.',
    )
    return errors
  }

  // Tolerant of the whitespace/indentation between the two statements
  // (each route indents this pair differently) rather than requiring an
  // exact adjacent line.
  const writablePattern = new RegExp(
    `assertRunAccess\\(\\s*${escapedVar},\\s*auth\\.user\\s*\\)\\s*\\n\\s*` +
      `assertRunWritable\\(\\s*${escapedVar}\\s*\\)`,
  )
  if (!writablePattern.test(content)) {
    errors.push(
      `${route.relativePath} does not call ` +
        `\`assertRunWritable(${route.runVar})\` immediately after ` +
        `\`assertRunAccess(${route.runVar}, auth.user)\`. cancelRun() marks ` +
        'a run CANCELLED specifically to stop further writes landing on it, ' +
        'but that intent is enforced client-side only by an in-memory Set ' +
        'scoped to the tab that issued the cancellation -- without this ' +
        'server-side check, a second tab or a stale reload can keep ' +
        'editing, generating, or durably committing into an abandoned run.',
    )
  }

  return errors
}

function main(): void {
  const allErrors: string[] = []

  for (const route of ROUTES) {
    const filePath = join(repositoryRoot, route.relativePath)
    const content = readFileSync(filePath, 'utf8')
    allErrors.push(...checkRunWritableGuard(content, route))
  }

  const storeContent = readFileSync(
    join(repositoryRoot, 'stores/modelBuilderStore.ts'),
    'utf8',
  )
  allErrors.push(...checkApprovedAssetGuard(storeContent))

  const runsIndexContent = readFileSync(
    join(repositoryRoot, 'server/api/model-builder/runs/index.ts'),
    'utf8',
  )
  allErrors.push(...checkItemPatchStageGuard(runsIndexContent))

  if (allErrors.length) {
    console.error('Model Builder required guard contracts failed:')
    for (const error of allErrors) console.error(`- ${error}`)
    process.exitCode = 1
    return
  }

  console.log(
    'Model Builder required guard contracts passed: all four write-capable ' +
      'item routes refuse writes to CANCELLED runs, finished renders cannot ' +
      'replace already-approved assets, and item PATCH writes cannot bypass ' +
      'server-stored stage review gates.',
  )
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  main()
}
