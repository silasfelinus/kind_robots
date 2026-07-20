// /scripts/lib/deployIgnorePaths.mjs
//
// Single source of truth for "does this file's change affect the deployed
// app?" Shared by scripts/vercel-ignore-build.mjs (Vercel's ignoreCommand,
// which decides whether a push gets its own production deployment) and
// scripts/check-deploy-noop.mjs (used by .github/workflows/cypress.yml's
// "Wait for deploy to go live" step to recognize when production will never
// serve TARGET_SHA as its own deployment because Vercel already decided, via
// this same predicate, that TARGET_SHA's changes since the live commit are
// deploy-inert). Keeping one predicate means those two decisions can't drift
// apart the way they did before this module existed (see kind-robots
// roadmap.yaml for the incident this fixed).

export const ignoredPrefixes = [
  '.github/',
  '.migration-backups/',
  'artifacts/',
  'cypress/',
  'docs/',
  // Nightly public-content snapshot data (see fallback-snapshot.yml). It is
  // disaster-outage fallback that gets baked into the *next* real deploy
  // anyway, so a snapshot-only commit does not warrant its own production
  // deployment. Trade-off: on a day with no code deploys, the baked fallback
  // can lag by up to a day — acceptable for outage-only data.
  'stores/fallback/',
]

export const ignoredRootFiles = new Set(['AGENTS.md', 'AI_README.md', 'CONTROL.md', 'README.md'])

// Test/spec files never ship to the running app, so a commit that only touches
// them (e.g. a "add contract test" chore) should not redeploy production.
// Cypress specs are already covered by the cypress/ prefix above.
export const testFileSuffixes = [
  '.test.ts',
  '.test.js',
  '.test.mjs',
  '.spec.ts',
  '.spec.js',
  '.spec.mjs',
]

export function isIgnoredPath(filePath) {
  return (
    ignoredRootFiles.has(filePath) ||
    ignoredPrefixes.some((prefix) => filePath.startsWith(prefix)) ||
    testFileSuffixes.some((suffix) => filePath.endsWith(suffix)) ||
    filePath.endsWith('.bak')
  )
}
