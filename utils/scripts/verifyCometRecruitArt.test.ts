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

const fromRoot = (path: string) =>
  readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8')
const store = fromRoot('stores/recruitArtStore.ts')
const page = fromRoot('pages/play/comet-city-academy.vue')

assert.ok(store.includes('if (!user.isAdmin) return'))
assert.ok(store.includes('if (!user.isAdmin) return null'))
assert.ok(store.includes('artJobs.loadJobImage(id)'))
assert.ok(store.includes('artJobs.imageSrcById[receipt.artImageId]'))
assert.ok(page.includes('const recruitArt = useRecruitArtStore()'))
assert.ok(page.includes('if (isAdmin) void recruitArt.loadAll()'))
assert.ok(page.includes("recruitArt.imageFor(id, 'neutral')"))
assert.ok(page.includes("recruitArt.imageFor("))
assert.ok(page.includes('recoveringFollower(run.value, id as StudentId)'))

console.log('Prom: eight private recruit ArtImages mapped to admin roster safely.')
