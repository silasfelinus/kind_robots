#!/usr/bin/env node
// scripts/check-deploy-noop.mjs <live_sha> <target_sha>
//
// Shared by .github/workflows/cypress.yml's "Wait for deploy to go live"
// step and utils/scripts/verifyDeployWaitNoOp.ts's regression test.
//
// scripts/vercel-ignore-build.mjs (Vercel's ignoreCommand) intentionally
// skips a production deployment when a push's changes are all within paths
// that never affect the running app (cypress/, docs/, *.test.ts, etc — see
// scripts/lib/deployIgnorePaths.mjs). When that happens, production keeps
// serving whatever commit was already live and will NEVER serve TARGET_SHA
// as its own deployment — the deploy-wait step's exact-match and
// superseding-commit checks (scripts/check-deploy-ancestry.sh) both wait for
// a deployment that Vercel already decided not to build, and time out.
//
// This script recognizes that case: exits 0 (accept) when <live_sha> is an
// ancestor of <target_sha> AND every file that changed between them is a
// deploy-inert path per the exact same predicate Vercel's ignoreCommand
// uses. Exits 1 (reject) otherwise, including when <live_sha> isn't known to
// this checkout or isn't an ancestor of <target_sha>.
//
// Callers are responsible for fetching/deepening the checkout first so
// <live_sha> is resolvable when it should be — this script does no network
// I/O, which is what keeps it hermetic and fast to test.
import { spawnSync } from 'node:child_process'
import { isIgnoredPath } from './lib/deployIgnorePaths.mjs'

const [liveSha, targetSha] = process.argv.slice(2)

function reject(reason) {
  console.log(`[deploy-noop] Rejected: ${reason}`)
  process.exit(1)
}

if (!liveSha || !targetSha) {
  reject('usage: check-deploy-noop.mjs <live_sha> <target_sha>')
}

const ancestry = spawnSync('git', ['merge-base', '--is-ancestor', liveSha, targetSha], {
  stdio: 'ignore',
})

if (ancestry.status !== 0) {
  reject(`${liveSha} is not a known ancestor of ${targetSha}`)
}

const diff = spawnSync(
  'git',
  ['diff', '--name-only', '--diff-filter=ACMRTUXB', liveSha, targetSha],
  {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  },
)

if (diff.status !== 0) {
  reject(diff.stderr.trim() || `git diff exited with ${diff.status ?? 'unknown status'}`)
}

const changedFiles = diff.stdout
  .split('\n')
  .map((filePath) => filePath.trim())
  .filter(Boolean)

const deployableFiles = changedFiles.filter((filePath) => !isIgnoredPath(filePath))

if (deployableFiles.length > 0) {
  reject(`deployable change(s) since ${liveSha}: ${deployableFiles.slice(0, 10).join(', ')}`)
}

console.log(
  `[deploy-noop] Accepted: every file changed between ${liveSha} and ${targetSha} ` +
    `(${changedFiles.length} total) is deploy-inert -- Vercel's ignoreCommand will never ` +
    'build this commit on its own, so the live deployment already reflects it.',
)
process.exit(0)
