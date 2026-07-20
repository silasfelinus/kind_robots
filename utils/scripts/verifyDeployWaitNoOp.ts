// /utils/scripts/verifyDeployWaitNoOp.ts
//
// Regression test for scripts/check-deploy-noop.mjs -- the check
// .github/workflows/cypress.yml's "Wait for deploy to go live" step uses
// alongside scripts/check-deploy-ancestry.sh. scripts/vercel-ignore-build.mjs
// (Vercel's ignoreCommand) skips building a production deployment when every
// file a push changed is deploy-inert (cypress/, docs/, *.test.ts, etc — see
// scripts/lib/deployIgnorePaths.mjs). When that happens, production keeps
// serving the previous commit forever and the deploy-wait step's other two
// checks (exact match, "live supersedes target") both wait for a deployment
// Vercel already decided not to build, timing out (see kind-robots
// roadmap.yaml for the incident this fixed -- a test-only fix PR's Cypress
// re-run couldn't go green because production never redeployed it).
//
// This exercises the exact same script -- not a reimplementation -- against
// the accept path (live precedes target, only deploy-inert files changed),
// two reject paths (a real app file changed; live is a non-ancestor sibling
// commit even though its diff would otherwise qualify), and the
// unknown-commit edge case, entirely in a hermetic temp git repo with no
// network calls.
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const repositoryRoot = resolve(scriptDirectory, '../..')
const noopScript = join(repositoryRoot, 'scripts/check-deploy-noop.mjs')

function git(cwd: string, ...args: string[]): string {
  return execFileSync('git', args, { cwd, encoding: 'utf8' }).trim()
}

function writeAndCommit(
  cwd: string,
  relativePath: string,
  contents: string,
  message: string,
): string {
  const fullPath = join(cwd, relativePath)
  mkdirSync(dirname(fullPath), { recursive: true })
  writeFileSync(fullPath, contents)
  git(cwd, 'add', relativePath)
  git(cwd, 'commit', '--quiet', '-m', message)
  return git(cwd, 'rev-parse', 'HEAD')
}

/** Runs the shared no-op script; returns true (accept) / false (reject). */
function checkNoOp(cwd: string, liveSha: string, targetSha: string): boolean {
  try {
    execFileSync('node', [noopScript, liveSha, targetSha], { cwd, stdio: 'pipe' })
    return true
  } catch {
    return false
  }
}

const repo = mkdtempSync(join(tmpdir(), 'deploy-wait-noop-'))

try {
  git(repo, 'init', '--quiet', '--initial-branch=main')
  git(repo, 'config', 'user.email', 'test@example.com')
  git(repo, 'config', 'user.name', 'Deploy Wait No-Op Test')

  const liveSha = writeAndCommit(repo, 'server/api/seed.ts', 'export const seed = true\n', 'seed commit (this is "live")')

  // Accept path: every file changed since "live" is deploy-inert (a Cypress
  // spec and a docs file), matching scripts/lib/deployIgnorePaths.mjs's
  // predicate -- Vercel's ignoreCommand would skip this build, so the live
  // deployment already reflects TARGET_SHA.
  writeAndCommit(repo, 'cypress/e2e/api/example.cy.ts', 'describe("noop", () => {})\n', 'test-only change')
  const inertTargetSha = writeAndCommit(repo, 'docs/notes.md', '# notes\n', 'docs-only change')
  assert.equal(
    checkNoOp(repo, liveSha, inertTargetSha),
    true,
    `expected TARGET_SHA ${inertTargetSha} to be ACCEPTED: every file changed since live ${liveSha} is deploy-inert`,
  )

  // Reject path: a real app file changed alongside the inert ones -- Vercel
  // would build this commit, so it is not yet "live" until it actually is.
  const deployableTargetSha = writeAndCommit(repo, 'server/api/foo.ts', 'export const foo = 1\n', 'real app change')
  assert.equal(
    checkNoOp(repo, liveSha, deployableTargetSha),
    false,
    `expected TARGET_SHA ${deployableTargetSha} to be REJECTED: server/api/foo.ts is a deployable change`,
  )

  // Reject path: "live" is a sibling-branch commit that never precedes
  // target, even though every file it would diff against target is
  // deploy-inert-shaped. Ancestry must be checked first, not inferred from
  // the diff alone.
  git(repo, 'checkout', '--quiet', '-b', 'sibling-branch', liveSha)
  const siblingLiveSha = writeAndCommit(
    repo,
    'cypress/e2e/api/sibling.cy.ts',
    'describe("sibling", () => {})\n',
    'sibling commit (this is "live", not an ancestor of target)',
  )
  assert.equal(
    checkNoOp(repo, siblingLiveSha, inertTargetSha),
    false,
    `expected TARGET_SHA ${inertTargetSha} to be REJECTED against sibling-branch commit ${siblingLiveSha} (no ancestor relationship)`,
  )

  // Unknown-commit edge case: "live" isn't a commit this checkout has ever
  // seen. Must reject rather than throw an uncaught error.
  const unknownSha = '0'.repeat(40)
  assert.equal(
    checkNoOp(repo, unknownSha, inertTargetSha),
    false,
    `expected an unknown live commit (${unknownSha}) to be REJECTED, not accepted or crash`,
  )

  console.log(
    'Deploy-wait no-op check verified: accepts deploy-inert-only diffs from an ancestor ' +
      'live commit, rejects real app changes, non-ancestor "live" commits, and unknown commits.',
  )
} finally {
  rmSync(repo, { recursive: true, force: true })
}
