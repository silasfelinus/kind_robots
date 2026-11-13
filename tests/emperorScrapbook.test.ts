import assert from 'node:assert/strict'
import { createRun } from '../utils/emperorOfDust/fortress/engine'
import {
  decodeScrapbook,
  rememberReign,
} from '../utils/emperorOfDust/fortress/scrapbook'

const run = { ...createRun(123), day: 51, brass: 37 }
const first = rememberReign([], run, '2026-11-13T03:07:20Z')
assert.equal(first.length, 1)
assert.equal(first[0]?.ending, 'long-night')
assert.equal(first[0]?.brass, 37)
assert.deepEqual(rememberReign(first, run, '2026-11-14T03:07:20Z'), first)
assert.deepEqual(decodeScrapbook(JSON.stringify(first)), first)
assert.deepEqual(rememberReign([], createRun(123), '2026-11-13T03:07:20Z'), [])
assert.equal(decodeScrapbook('{bad'), null)
assert.equal(decodeScrapbook('[{"ending":"long-night"}]'), null)
assert.equal(decodeScrapbook('[{"__proto__":true}]'), null)
assert.deepEqual(decodeScrapbook(null), [])
