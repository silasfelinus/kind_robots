import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  RECRUIT_ART_RECEIPTS,
  recruitArtReceipt,
} from '../cometAcademy/recruitArtReceipts'

const expected = [
  ['vesna', 'vesna-duarte', 74325, 277331],
  ['bram', 'bram-kowalczyk', 74327, 277333],
  ['femi', 'femi-ilunga', 74329, 277335],
  ['cyrus', 'cyrus-adeyemi', 74331, 277337],
] as const

assert.equal(Object.keys(RECRUIT_ART_RECEIPTS).length, 4)
for (const [id, slug, firstJob, firstImage] of expected) {
  for (const [index, slot] of (['neutral', 'injured'] as const).entries()) {
    const receipt = recruitArtReceipt(id, slot)!
    assert.ok(receipt, id + ' ' + slot)
    assert.equal(receipt.artJobId, firstJob + index)
    assert.equal(receipt.artImageId, firstImage + index)
    assert.equal(receipt.asset, `recruits/${slug}/${slot}`)
  }
}
assert.equal(recruitArtReceipt('unknown', 'neutral'), null)

const emotions = [
  ['vesna', [76670, 278835], [76671, 278836], [76672, 278837]],
  ['bram', [76673, 278838], [76674, 278839], [76675, 278840]],
  ['femi', [76676, 278841], [76686, 279005], [76677, 278842]],
  ['cyrus', [76678, 278843], [76679, 278844], [76680, 278845]],
] as const

for (const [id, joyous, angry, afraid] of emotions) {
  for (const [slot, pair] of [
    ['joyous', joyous],
    ['angry', angry],
    ['afraid', afraid],
  ] as const) {
    const receipt = recruitArtReceipt(id, slot)
    if (!pair) {
      assert.equal(receipt, null, 'pending art must not masquerade as DONE')
      continue
    }
    assert.deepEqual([receipt?.artJobId, receipt?.artImageId], pair)
    assert.equal(receipt?.slot, slot)
  }
}

const fromRoot = (path: string) =>
  readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8')
const store = fromRoot('stores/recruitArtStore.ts')
const page = fromRoot('pages/play/comet-city-academy.vue')

assert.ok(store.includes('if (!user.isAdmin) return'))
assert.ok(store.includes('if (!user.isAdmin) return null'))
assert.ok(store.includes('artJobs.loadJobImage(id)'))
assert.ok(store.includes('Object.values(slots).flatMap'))
assert.ok(store.includes('artJobs.imageSrcById[receipt.artImageId]'))
assert.ok(page.includes('const recruitArt = useRecruitArtStore()'))
assert.ok(page.includes('if (isAdmin) void recruitArt.loadAll()'))
assert.ok(page.includes("recruitArt.imageFor(id, 'neutral')"))
assert.ok(page.includes('recruitArt.imageFor('))
assert.match(page, /mood === 'positive'\s*\?\s*'joyous'/)
assert.match(page, /mood === 'negative'\s*\?\s*'afraid'/)
assert.ok(page.includes('recoveringFollower(run.value, id as StudentId)'))

console.log(
  'Prom: twenty DONE private recruit portraits and expression images mapped safely.',
)
