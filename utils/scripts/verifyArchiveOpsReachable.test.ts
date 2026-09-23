// /utils/scripts/verifyArchiveOpsReachable.test.ts
//
// An operational tool has to be reachable from where it is actually run.
//
// The seed backfill was first written as utils/scripts/backfillArchiveSeeds.ts
// and could run in NEITHER place it needed to (art-archive/t-041, 2026-09-23):
//
//   * on the Unraid host, the checkout holds the deploy scripts and has no
//     DATABASE_URL -- that lives in /config/kind-robots.env, which only the
//     container reads -- so it died with "Error: DATABASE_URL is missing"
//   * inside the container, the file is not there at all: the runtime image
//     copies .output, node_modules, package.json, prisma, scripts and
//     prisma.config.ts, but NOT utils/
//
// Both failures are invisible to a unit test and to CI, because both pass in a
// dev checkout where everything exists and .env is loaded. They only show up on
// the machine that has to run the thing.
//
// So this checks the shape instead: every archive operation is an admin
// endpoint driven by scripts/art-archive-ingest.sh, which IS in the image, and
// nothing under utils/ pretends to be an archive operations tool.
import assert from 'node:assert/strict'
import { existsSync, readFileSync, readdirSync } from 'node:fs'

// ---- the runner is in the image ------------------------------------------
const dockerfile = readFileSync('Dockerfile', 'utf8')
const runtimeCopies = dockerfile
  .slice(dockerfile.indexOf('AS runtime'))
  .split('\n')
  .filter((line) => line.startsWith('COPY'))
  .join('\n')

assert.match(
  runtimeCopies,
  /\/app\/scripts \.\/scripts/,
  'the runtime image must copy scripts/, which is where the archive runner lives',
)
assert.doesNotMatch(
  runtimeCopies,
  /\/app\/utils/,
  'utils/ is deliberately NOT in the runtime image -- anything an operator ' +
    'has to run against production must not live there',
)
assert.ok(
  existsSync('scripts/art-archive-ingest.sh'),
  'the archive runner must be in scripts/',
)

// ---- every archive operation the runner drives has an endpoint -----------
const runner = readFileSync('scripts/art-archive-ingest.sh', 'utf8')
const referenced = [
  ...runner.matchAll(/'\/api\/admin\/art-archive\/([a-z-]+)'/g),
].map((match) => match[1])
assert.ok(referenced.length >= 4, 'the runner drives the archive endpoints')

for (const route of new Set(referenced)) {
  const candidates = [
    `server/api/admin/art-archive/${route}.post.ts`,
    `server/api/admin/art-archive/${route}.get.ts`,
  ]
  assert.ok(
    candidates.some((file) => existsSync(file)),
    `the runner calls /api/admin/art-archive/${route} but no handler exists`,
  )
}

// ---- the backfill specifically ------------------------------------------
// It is the one that got this wrong, so it is named rather than left to the
// general rule.
assert.match(
  runner,
  /--backfill-seeds\)/,
  'the runner must expose the seed backfill -- it is the only way to reach it ' +
    'on the host, where there is no DATABASE_URL and no utils/',
)
assert.ok(
  existsSync('server/api/admin/art-archive/backfill-seeds.post.ts'),
  'the seed backfill must be an endpoint, not a utils/ script',
)
assert.equal(
  existsSync('utils/scripts/backfillArchiveSeeds.ts'),
  false,
  'the unreachable script must be gone, not merely unused -- leaving it there ' +
    'means the next operator runs it and gets "DATABASE_URL is missing"',
)

// ---- the backfill covers EVERY field the import dropped ------------------
// The import lost two things for the same ~19,000 rows, for two different
// reasons: the seed, because the column was signed, and the cfg, because a
// half step (12.5) does not fit an Int without the cfgHalf flag. A backfill
// that restores only one leaves the other permanently missing, because the
// import will not revisit those rows -- their ledger rows correctly say
// IMPORTED. The first version of this endpoint did exactly that.
const backfill = readFileSync(
  'server/api/admin/art-archive/backfill-seeds.post.ts',
  'utf8',
)
assert.match(
  backfill,
  /OR: \[\{ seed: null \}, \{ cfg: null \}\]/,
  'the backfill must select rows missing EITHER value -- selecting on seed ' +
    'alone never even looks at a row whose seed stored fine but whose cfg did not',
)
for (const field of ['data.seed =', 'data.cfg =', 'data.cfgHalf =']) {
  assert.ok(
    backfill.includes(field),
    `the backfill must be able to restore ${field.replace(' =', '')}`,
  )
}
assert.match(
  backfill,
  /splitHalfStepCfg/,
  'cfg must be restored through the half-step split, not truncated to an Int',
)

// ---- nothing else under utils/ claims to be an archive ops tool ----------
// A verifier or a dev-time helper is fine; something that writes to the live
// archive is not, because it cannot be run where the archive is.
const utilsScripts = readdirSync('utils/scripts').filter((name) =>
  /archive/i.test(name),
)
for (const name of utilsScripts) {
  if (/^verify/i.test(name)) continue
  const body = readFileSync(`utils/scripts/${name}`, 'utf8')
  assert.doesNotMatch(
    body,
    /prisma\.(artImage|archiveEntry)\.(update|updateMany|create|delete)/,
    `utils/scripts/${name} writes to the archive but is not in the runtime ` +
      'image, so it cannot run where the archive actually is -- make it an ' +
      'admin endpoint driven by scripts/art-archive-ingest.sh instead',
  )
}

console.log(
  'Archive ops reachability verified: the runner ships in the runtime image, ' +
    'utils/ deliberately does not, every endpoint the runner calls exists, ' +
    'the seed backfill is an endpoint rather than an unreachable script, and ' +
    'no archive-writing tool is left somewhere it cannot be run from.',
)
