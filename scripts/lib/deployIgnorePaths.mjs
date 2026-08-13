// /scripts/lib/deployIgnorePaths.mjs
//
// Single source of truth for "does this file's change affect the deployed
// app?" Used by scripts/check-deploy-noop.mjs so CI can recognize commits that
// do not require production to serve a distinct image before tests continue.

export const ignoredPrefixes = [
  '.github/',
  '.migration-backups/',
  'artifacts/',
  'cypress/',
  'docs/',
  // Nightly public-content snapshot data (see fallback-snapshot.yml). It is
  // disaster-outage fallback that gets baked into the next real deploy, so a
  // snapshot-only commit does not warrant waiting for a distinct production
  // image. Trade-off: on a day with no code deploys, the baked fallback can
  // lag by up to a day — acceptable for outage-only data.
  'stores/fallback/',
]

export const ignoredRootFiles = new Set(['AGENTS.md', 'AI_README.md', 'CONTROL.md', 'README.md'])

// Test/spec files never ship to the running app, so a commit that only touches
// them does not need a distinct production image.
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
