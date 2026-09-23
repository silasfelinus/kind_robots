// /utils/scripts/auditServerApiCallers.test.ts
//
// Regression coverage for the route-path derivation and matcher the orphan
// scanner is actually built on -- against synthetic paths and source, not
// the live repo, so it pins the LOGIC rather than today's route inventory.
import assert from 'node:assert/strict'

import {
  routeDisplayPath,
  routeMatchPattern,
  routeSegmentsForApiFile,
} from './auditServerApiCallers'

// ---- route derivation -----------------------------------------------------

assert.deepEqual(
  routeSegmentsForApiFile('server/api/characters/index.get.ts'),
  [{ value: 'characters', dynamic: false, catchAll: false }],
  'an index.get.ts route strips to its parent path, same as GET /api/characters',
)

assert.deepEqual(
  routeSegmentsForApiFile('server/api/index.get.ts'),
  [],
  'the bare API index route has no segments at all',
)

assert.deepEqual(
  routeSegmentsForApiFile('server/api/characters/[id].get.ts'),
  [
    { value: 'characters', dynamic: false, catchAll: false },
    { value: 'id', dynamic: true, catchAll: false },
  ],
  'a [id] segment is dynamic',
)

assert.deepEqual(
  routeSegmentsForApiFile('server/api/art/archive/[...slug].get.ts'),
  [
    { value: 'art', dynamic: false, catchAll: false },
    { value: 'archive', dynamic: false, catchAll: false },
    { value: 'slug', dynamic: true, catchAll: true },
  ],
  'a [...slug] segment is a dynamic catch-all',
)

assert.deepEqual(
  routeSegmentsForApiFile('server/api/characters/[id]/facets.post.ts'),
  [
    { value: 'characters', dynamic: false, catchAll: false },
    { value: 'id', dynamic: true, catchAll: false },
    { value: 'facets', dynamic: false, catchAll: false },
  ],
  'a dynamic directory segment followed by a literal file segment',
)

assert.equal(
  routeSegmentsForApiFile('server/api/characters/selects.ts'),
  null,
  'a helper module with no recognized HTTP-method suffix is not a route',
)

assert.equal(
  routeSegmentsForApiFile('server/utils/prisma.ts'),
  null,
  'a file outside server/api is never a route',
)

// ---- display form -----------------------------------------------------

assert.equal(
  routeDisplayPath([]),
  '/api',
  'the bare API index displays as /api',
)
assert.equal(
  routeDisplayPath([{ value: 'id', dynamic: true, catchAll: false }]),
  '/api/:id',
  'a dynamic segment displays with a leading colon',
)
assert.equal(
  routeDisplayPath([{ value: 'slug', dynamic: true, catchAll: true }]),
  '/api/:slug*',
  'a catch-all segment displays with a trailing star',
)

// ---- match pattern: literal routes ----------------------------------------

const charactersIndex = routeMatchPattern([
  { value: 'characters', dynamic: false, catchAll: false },
])
assert.ok(
  charactersIndex.test("performFetch('/api/characters')"),
  'a bare-string call to the exact literal path must match',
)
assert.ok(
  !charactersIndex.test("performFetch('/api/characters/generate')"),
  'a longer path must not match a shorter literal route (no trailing boundary)',
)
assert.ok(
  !charactersIndex.test("performFetch('/api/charactersx')"),
  'a route path must not match as a prefix of an unrelated longer word',
)

// ---- match pattern: dynamic segments --------------------------------------

const byId = routeMatchPattern([
  { value: 'characters', dynamic: false, catchAll: false },
  { value: 'id', dynamic: true, catchAll: false },
])
assert.ok(
  byId.test('await performFetch(`/api/characters/${characterId}`)'),
  'a template-literal call with an interpolated id must match a dynamic segment',
)
assert.ok(
  byId.test("performFetch('/api/characters/42')"),
  'a literal numeric id must also match a dynamic segment',
)
assert.ok(
  !byId.test('await performFetch(`/api/characters/${characterId}/facets`)'),
  'a dynamic segment must not swallow a real trailing segment that follows it',
)

// ---- match pattern: catch-all ----------------------------------------------

const catchAll = routeMatchPattern([
  { value: 'slug', dynamic: true, catchAll: true },
])
assert.ok(
  catchAll.test('await performFetch(`/api/archive/${a}/${b}/${c}`)'),
  'a catch-all segment must match an arbitrarily deep path',
)

// ---- match pattern: base path is respected --------------------------------

const withBase = routeMatchPattern([
  { value: 'characters', dynamic: false, catchAll: false },
  { value: 'id', dynamic: true, catchAll: false },
  { value: 'facets', dynamic: false, catchAll: false },
])
assert.ok(
  withBase.test('await performFetch(`/api/characters/${id}/facets`)'),
  'a multi-segment route (dynamic then literal) must match its own shape',
)
assert.ok(
  !withBase.test('await performFetch(`/api/characters/${id}/facets/extra`)'),
  'a multi-segment route must not match a call with an extra trailing segment',
)

console.log('auditServerApiCallers.test: all assertions passed')
