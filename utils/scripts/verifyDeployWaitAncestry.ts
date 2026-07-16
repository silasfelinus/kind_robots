// /utils/scripts/verifyDeployWaitAncestry.ts
//
// Regression test for scripts/check-deploy-ancestry.sh -- the ancestry check
// shared by .github/workflows/cypress.yml's "Wait for deploy to go live"
// step. That step accepts a deploy as live either when the served commit
// exactly matches the pushed commit, or when the served commit is a *newer*
// commit that already contains the pushed commit as an ancestor (a burst of
// merges can supersede TARGET_SHA before its own deploy finishes).
//
// Before this test existed, that accept/reject logic was only ever verified
// by hand against scratch git repos (see kind-robots/t-018 in conductor's
// roadmap.yaml). This exercises the exact same script -- not a
// reimplementation -- against the accept path (superseding commit), the
// reject path (non-superseding sibling-branch commit), and the
// unknown-commit edge case, entirely in a hermetic temp git repo with no
// network calls.
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const repositoryRoot = resolve(scriptDirectory, '../..')
const ancestryScript = join(repositoryRoot, 'scripts/check-deploy-ancestry.sh')

function git(cwd: string, ...args: string[]): string {
  return execFileSync('git', args, { cwd, encoding: 'utf8' }).trim()
}

function commit(cwd: string, message: string): string {
  git(cwd, 'commit', '--allow-empty', '-m', message)
  return git(cwd, 'rev-parse', 'HEAD')
}

/** Runs the shared ancestry script; returns true (accept) / false (reject). */
function checkAncestry(cwd: string, targetSha: string, liveSha: string): boolean {
  try {
    execFileSync('bash', [ancestryScript, targetSha, liveSha], {
      cwd,
      stdio: 'pipe',
    })
    return true
  } catch {
    return false
  }
}

// Fork two branches from one shared root commit so "sibling, not an
// ancestor" and "descendant, an ancestor" relationships are both
// unambiguous to build.
const repo = mkdtempSync(join(tmpdir(), 'deploy-wait-ancestry-'))

try {
  git(repo, 'init', '--quiet', '--initial-branch=main')
  git(repo, 'config', 'user.email', 'test@example.com')
  git(repo, 'config', 'user.name', 'Deploy Wait Ancestry Test')

  const root = commit(repo, 'shared root')

  // Accept path: TARGET_SHA is an ancestor of a later "live" commit on the
  // same line of history -- this deploy's changes are live via a
  // superseding commit.
  const targetSha = commit(repo, 'target commit (this is TARGET_SHA)')
  const supersedingLiveSha = commit(repo, 'superseding commit (this is "live")')
  assert.equal(
    checkAncestry(repo, targetSha, supersedingLiveSha),
    true,
    `expected TARGET_SHA ${targetSha} to be accepted as an ancestor of superseding commit ${supersedingLiveSha}`,
  )

  // Exact match trivially satisfies "is an ancestor of itself" too.
  assert.equal(
    checkAncestry(repo, targetSha, targetSha),
    true,
    `expected TARGET_SHA ${targetSha} to be accepted against itself`,
  )

  // Reject path: "live" is a sibling-branch commit forked from the same
  // root but does NOT contain TARGET_SHA -- must not be accepted, even
  // though both commits exist in the checkout.
  git(repo, 'checkout', '--quiet', '-b', 'sibling-branch', root)
  const siblingLiveSha = commit(repo, 'sibling commit (this is "live", not a descendant)')
  assert.equal(
    checkAncestry(repo, targetSha, siblingLiveSha),
    false,
    `expected TARGET_SHA ${targetSha} to be REJECTED against sibling-branch commit ${siblingLiveSha} (no ancestor relationship)`,
  )

  // Unknown-commit edge case: "live" isn't a commit this checkout has ever
  // seen (e.g. an ancestry-deepening fetch didn't reach far enough). Must
  // reject rather than throw an uncaught error.
  const unknownSha = '0'.repeat(40)
  assert.equal(
    checkAncestry(repo, targetSha, unknownSha),
    false,
    `expected an unknown live commit (${unknownSha}) to be REJECTED, not accepted or crash`,
  )

  console.log(
    'Deploy-wait ancestry check verified: accepts superseding commits, ' +
      'rejects sibling-branch commits and unknown commits.',
  )
} finally {
  rmSync(repo, { recursive: true, force: true })
}
