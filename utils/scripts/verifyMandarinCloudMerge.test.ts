// /utils/scripts/verifyMandarinCloudMerge.test.ts
//
// Regression test for mandarin-tutor/t-017, covering
// utils/mandarinCloudMerge.ts -- the merge rules `mandarinTutorStore.loadCloudState`
// (mandarin-tutor/t-016) relies on to keep a learner's customSets/artJobs
// consistent once the server becomes reachable. Pure functions only -- no
// prisma, no database, no Nuxt/Pinia runtime -- same discipline as
// utils/scripts/verifyMandarinSrs.test.ts.
import assert from 'node:assert/strict'

import { mergeArtJobs, mergeCustomSets } from '../mandarinCloudMerge'
import type { MandarinCustomSet } from '../mandarin'

function makeSet(id: string, name: string): MandarinCustomSet {
  return { id, name, cardKeys: [], createdAt: '2026-08-26T00:00:00.000Z' }
}

// --- mergeCustomSets ---------------------------------------------------------

{
  // Server-only sets pass through untouched: nothing local to merge, nothing
  // to re-push.
  const server = [makeSet('s1', 'Server Set')]
  const result = mergeCustomSets(server, [])
  assert.deepEqual(result.merged, server)
  assert.deepEqual(result.unsynced, [])
}

{
  // A local-only set the server has never seen is kept, ordered after the
  // server's sets, and reported for re-push.
  const server = [makeSet('s1', 'Server Set')]
  const local = [makeSet('local-only', 'Offline Set')]
  const result = mergeCustomSets(server, local)
  assert.deepEqual(result.merged, [...server, ...local])
  assert.deepEqual(result.unsynced, local)
}

{
  // A set present on both sides prefers the server's value -- even if the
  // local copy has a different name, the server row for that id wins and is
  // NOT reported as needing a re-push.
  const server = [makeSet('shared', 'Server Name')]
  const local = [makeSet('shared', 'Stale Local Name')]
  const result = mergeCustomSets(server, local)
  assert.deepEqual(result.merged, server)
  assert.equal(
    result.merged[0]?.name,
    'Server Name',
    'server copy must win over a stale local copy with the same id',
  )
  assert.deepEqual(
    result.unsynced,
    [],
    'a server-known id must not be re-pushed',
  )
}

{
  // Mixed: one shared id (server wins, no re-push) plus one local-only id
  // (kept and re-pushed), in one merge.
  const server = [makeSet('shared', 'Server Name'), makeSet('s2', 'Server Two')]
  const local = [
    makeSet('shared', 'Stale Local Name'),
    makeSet('local-only', 'Offline Set'),
  ]
  const result = mergeCustomSets(server, local)
  assert.deepEqual(result.merged, [
    ...server,
    makeSet('local-only', 'Offline Set'),
  ])
  assert.deepEqual(result.unsynced, [makeSet('local-only', 'Offline Set')])
}

// --- mergeArtJobs -------------------------------------------------------------

{
  // Server-only links pass through untouched.
  const server = { 'card-1': 101 }
  const result = mergeArtJobs(server, {})
  assert.deepEqual(result.merged, server)
  assert.deepEqual(result.unsynced, [])
}

{
  // A local-only cardKey the server doesn't know about is kept and reported
  // for re-push.
  const server = { 'card-1': 101 }
  const local = { 'card-2': 202 }
  const result = mergeArtJobs(server, local)
  assert.deepEqual(result.merged, { 'card-1': 101, 'card-2': 202 })
  assert.deepEqual(result.unsynced, [['card-2', 202]])
}

{
  // A cardKey present on both sides prefers the server's jobId, and is not
  // re-pushed.
  const server = { 'card-1': 101 }
  const local = { 'card-1': 999 }
  const result = mergeArtJobs(server, local)
  assert.deepEqual(result.merged, { 'card-1': 101 })
  assert.deepEqual(result.unsynced, [])
}

{
  // Mixed: one shared cardKey (server wins) plus one local-only cardKey
  // (kept and re-pushed), in one merge.
  const server = { 'card-1': 101, 'card-3': 303 }
  const local = { 'card-1': 999, 'card-2': 202 }
  const result = mergeArtJobs(server, local)
  assert.deepEqual(result.merged, {
    'card-1': 101,
    'card-3': 303,
    'card-2': 202,
  })
  assert.deepEqual(result.unsynced, [['card-2', 202]])
}

console.log('verifyMandarinCloudMerge: all assertions passed')
