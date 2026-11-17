import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRun } from '../ecotone/engine'
import { COMPANIONS, ENDING_IDS } from '../ecotone/content'
import { revealedGuides } from '../ecotone/guideReveal'

// Before any run and with an empty ledger, nobody is introduced.
assert.equal(revealedGuides(undefined, []).size, 0)
assert.equal(revealedGuides(null, []).size, 0)

// Meeting in the current run reveals exactly the guides met, in any order.
assert.deepEqual([...revealedGuides(['kit', 'mara'], [])].sort(), [
  'kit',
  'mara',
])

// An earned ending reveals its final lead across runs (lead.lens.fate).
for (const companion of COMPANIONS) {
  const ending = ENDING_IDS.find((id) => id.startsWith(`${companion.id}.`))
  assert.ok(ending, `${companion.id} must lead at least one collectible ending`)
  assert.deepEqual([...revealedGuides(undefined, [ending])], [companion.id])
}

// Unknown or malformed ledger entries and meeting ids never reveal anyone.
assert.equal(
  revealedGuides(['nobody'], ['', 'stranger.sober.hope', 'kit']).size,
  1,
  'a bare known id still names its guide; unknown ids are ignored',
)
assert.equal(revealedGuides(['nobody'], ['stranger.sober.hope']).size, 0)

// A fresh run with no meetings yet keeps every guide hidden until met.
const run = createRun(7)
for (const id of run.meetingOrder)
  assert.ok(revealedGuides(run.meetingOrder, []).has(id))
assert.equal(
  revealedGuides(run.meetingOrder, []).size,
  new Set(run.meetingOrder).size,
)

// The Guides tab must gate every identifying detail on the reveal.
const board = readFileSync('components/ecotone-board.vue', 'utf8')
const guidesTab = board.slice(
  board.indexOf(`tab === 'guides'`),
  board.indexOf(`tab === 'county'`),
)
assert.ok(guidesTab.length > 0, 'Guides tab markup must be found')
for (const field of ['art', 'bio', 'line', 'meetAt', 'role']) {
  const at = guidesTab.indexOf(`companion.${field}`)
  assert.ok(at > 0, `Guides tab still shows companion.${field}`)
  const before = guidesTab.slice(Math.max(0, at - 700), at)
  assert.ok(
    before.includes('guideRevealed(companion.id)'),
    `companion.${field} must be gated by guideRevealed`,
  )
}
assert.ok(guidesTab.includes('A guide not yet met'))

console.log('verifyEcotoneGuideReveal: ok')
