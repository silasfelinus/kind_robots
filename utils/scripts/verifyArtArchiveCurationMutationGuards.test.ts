// /utils/scripts/verifyArtArchiveCurationMutationGuards.test.ts
//
// Shared invalid-id / missing-entry / state-update contract for the admin
// Art Archive curation mutation routes (butterfly-gallery/t-029 kaizen:
// kind_robots#2864's PR body).
//
// WHY
// ---
// rate.patch.ts, quarantine.post.ts, restore.post.ts, collections.patch.ts,
// and needs-review.post.ts each hand-roll the same three checks -- an admin
// gate, a positive-integer id guard, and a "does this entry exist" lookup --
// before doing their own real mutation. Nothing asserted that pattern held
// across all five, so a new sibling route (or an edit to an existing one)
// could silently drop the id/existence guard and only be caught by someone
// noticing in review. This is a shape contract, not a behavior one: it never
// imports prisma or opens a database connection, so it runs in CI the same
// way verifyReactionRouteAuth.ts does for the Reaction API.
//
//   npx tsx utils/scripts/verifyArtArchiveCurationMutationGuards.test.ts
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { stripComments } from './lib/sourceText'

const entriesDir = join(
  process.cwd(),
  'server/api/admin/art-archive/entries/[id]',
)

const read = (file: string) => stripComments(readFileSync(join(entriesDir, file), 'utf8'))

// Each entry names the prisma call(s) that constitute this route's actual
// state-changing write, beyond the shared id/existence guards.
const ROUTES: { file: string; mutations: RegExp[] }[] = [
  { file: 'rate.patch.ts', mutations: [/prisma\.archiveEntry\.update\(/] },
  {
    file: 'quarantine.post.ts',
    mutations: [/quarantineArchiveEntry\(/],
  },
  {
    file: 'restore.post.ts',
    mutations: [/tx\.archiveEntry\.update\(/, /prisma\.\$transaction\(/],
  },
  { file: 'collections.patch.ts', mutations: [/prisma\.artImage\.update\(/] },
  { file: 'needs-review.post.ts', mutations: [/prisma\.archiveEntry\.update\(/] },
  { file: 'enqueue.post.ts', mutations: [/prisma\.artJob\.create\(/] },
]

const quarantineHelper = stripComments(
  readFileSync(
    join(process.cwd(), 'server/utils/artArchiveQuarantine.ts'),
    'utf8',
  ),
)
for (const token of [
  'quarantineConfinedArchiveFile',
  'tx.archiveEntry.update(',
  'tx.artImage.update(',
  'preQuarantineRelativePath',
  'isActive: false',
]) {
  assert.ok(
    quarantineHelper.includes(token),
    `artArchiveQuarantine.ts must preserve the shared quarantine invariant: ${token}`,
  )
}

for (const { file, mutations } of ROUTES) {
  const source = read(file)

  // ---- admin gate, before any id parsing or prisma access -------------
  const authIndex = source.indexOf('requireAdminApiUser(event)')
  assert.notEqual(authIndex, -1, `${file} must call requireAdminApiUser(event).`)

  // ---- invalid-id guard: reject non-positive-integer ids with a 400 ----
  const idGuardMatch = source.match(
    /if\s*\(\s*!Number\.isInteger\(id\)\s*\|\|\s*id\s*<=\s*0\s*\)\s*\{[\s\S]{0,160}?statusCode:\s*400/,
  )
  assert.ok(
    idGuardMatch,
    `${file} must reject a non-positive-integer :id with a 400 before doing anything else with it.`,
  )
  assert.ok(
    authIndex < source.indexOf(idGuardMatch![0]),
    `${file} must authenticate before validating/using the :id param.`,
  )

  // ---- missing-entry guard: 404 when the row doesn't exist -------------
  const findIndex = source.indexOf('prisma.archiveEntry.findUnique(')
  assert.notEqual(
    findIndex,
    -1,
    `${file} must look up the ArchiveEntry (prisma.archiveEntry.findUnique) before mutating it.`,
  )
  const notFoundGuardMatch = source.match(
    /if\s*\(\s*!entry\s*\)[\s\S]{0,160}?statusCode:\s*404/,
  )
  assert.ok(
    notFoundGuardMatch,
    `${file} must 404 when the looked-up ArchiveEntry is missing.`,
  )
  assert.ok(
    findIndex < source.indexOf(notFoundGuardMatch![0]),
    `${file}'s missing-entry 404 must come after the findUnique lookup it guards.`,
  )

  // ---- state-update: the route's real write happens after both guards --
  const guardEnd = source.indexOf(notFoundGuardMatch![0]) + notFoundGuardMatch![0].length
  const mutationIndex = mutations
    .map((pattern) => source.search(pattern))
    .find((index) => index !== -1)
  assert.notEqual(
    mutationIndex,
    undefined,
    `${file} must contain one of its expected mutation call(s): ${mutations.map((p) => p.source).join(', ')}`,
  )
  assert.ok(
    (mutationIndex as number) > guardEnd,
    `${file}'s state-mutating write must run after the invalid-id/missing-entry guards, not before them.`,
  )

  // ---- standard response envelope, on both the success and error paths -
  assert.match(
    source,
    /catch\s*\(\s*error:\s*unknown\s*\)/,
    `${file} must wrap its handler body in a try/catch(error: unknown) using errorHandler, matching its siblings' error shape.`,
  )
  assert.match(
    source,
    /success:\s*true/,
    `${file} must return { success: true, ... } on its success path.`,
  )
  assert.match(
    source,
    /success:\s*false/,
    `${file} must return { success: false, ... } on its error path.`,
  )
}

console.log(
  `Art Archive curation mutation guard contract verified across ${ROUTES.length} route(s): admin gate -> invalid-id 400 -> missing-entry 404 -> state update, consistent response envelope.`,
)
