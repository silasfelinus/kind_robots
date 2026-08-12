// /utils/scripts/verifyReactionRouteAuth.ts
//
// No anonymous full-table reads, and no user-id spoofing, on the Reaction API.
//
// WHY
// ---
// #1788. Two legacy top-level routes predated the per-target auth semantics and
// bypassed them entirely:
//
//   GET /api/reactions   called fetchAllReactions(), an unauthenticated
//                        `prisma.reaction.findMany({})`, and returned every
//                        Reaction row in the database -- comments, ratings and
//                        the userId behind each one -- to anybody.
//
//   server/api/reactions/index.ts exported a second create/update handler that
//                        read `userId` straight from the request body, never
//                        authenticated it, and ran none of the target access
//                        checks index.post.ts applies. Anyone could write a
//                        reaction as any user, for any method index.post.ts
//                        did not claim.
//
// Both are the kind of thing that comes back: the helper module is the natural
// place to park "just one more" handler, and a scoped findMany is one careless
// refactor away from being unscoped again. This asserts the shape rather than
// the behaviour, because a route contract that needs a live database does not
// run in CI -- and the shape is what regressed.
//
//   npx tsx utils/scripts/verifyReactionRouteAuth.ts
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { stripComments } from './lib/sourceText'

const reactionsDir = join(process.cwd(), 'server/api/reactions')

// Comments here describe the very patterns being banned -- this file's own
// header quotes `findMany({})`. Match code, not prose.
const read = (file: string) =>
  stripComments(readFileSync(join(reactionsDir, file), 'utf8'))

// ---------------------------------------------------------------- helper module

const helperModule = read('index.ts')

assert.doesNotMatch(
  helperModule,
  /export default/,
  'server/api/reactions/index.ts must stay a helper module with no default export, matching rewards/resources/facets. A default export here registers a second /api/reactions handler outside the authenticated create path.',
)
assert.doesNotMatch(
  helperModule,
  /fetchAllReactions/,
  'fetchAllReactions() returned the whole Reaction table and must not come back, even unexported -- its only caller was the anonymous read this contract exists to prevent.',
)

// ---------------------------------------------------------------- no body userId

// The authenticated routes derive the reactor from the session. A `userId` read
// out of a request body is the spoofing hole, wherever it reappears.
for (const file of readdirSync(reactionsDir).filter((name) => name.endsWith('.ts'))) {
  const source = read(file)
  assert.doesNotMatch(
    source,
    /body\.userId|requestData\.userId|\buserId\b\s*:\s*toPositiveId\(/,
    `${file} takes userId from the request body. Caller identity comes from auth, never from the payload.`,
  )
}

// ---------------------------------------------------------------- authenticated reads

const listRoute = read('index.get.ts')

assert.match(
  listRoute,
  /requireApiUser/,
  'GET /api/reactions must authenticate. It used to serve the entire table anonymously.',
)
assert.doesNotMatch(
  listRoute,
  /findMany\(\s*\{\s*\}\s*\)/,
  'GET /api/reactions must never issue an unscoped findMany.',
)
assert.match(
  listRoute,
  /isAdmin/,
  'reading another user’s reactions, or everyone’s, must be gated on admin',
)
assert.match(
  listRoute,
  /userId: /,
  'the default scope for GET /api/reactions is the caller’s own reactions',
)

const byIdRoute = read('[id].get.ts')

assert.match(
  byIdRoute,
  /requireApiUser/,
  'GET /api/reactions/<id> must authenticate: walking ids rebuilds the table one row at a time, which is the same leak the list route had.',
)
assert.match(
  byIdRoute,
  /data\.userId !== auth\.user\.id/,
  'GET /api/reactions/<id> must return only the caller’s own reaction unless they are an admin',
)
assert.match(
  byIdRoute,
  /statusCode: 404/,
  'a reaction the caller may not read must 404 rather than 403 -- a 403 confirms the row exists',
)

// ---------------------------------------------------------------- create path

const createRoute = read('index.post.ts')

assert.match(
  createRoute,
  /validateApiKey|requireApiUser|getOptionalApiUser/,
  'POST /api/reactions must authenticate',
)
assert.match(
  createRoute,
  /assertReactionTargetAccessible/,
  'POST /api/reactions must keep its per-target access check',
)

const routeFiles = readdirSync(reactionsDir).filter((name) => name.endsWith('.ts'))

console.log(
  `Reaction route auth verified: ${routeFiles.length} handler(s), no anonymous table reads, no body-supplied userId.`,
)
