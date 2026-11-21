import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  ENDING_ART_IMAGE_IDS,
  MAX_EMPEROR_ART_REVIEW_BATCH,
  parseEmperorArtReviewTargets,
} from '../emperorOfDust/fortress/artDelivery'

const targets = Object.entries(ENDING_ART_IMAGE_IDS).map(
  ([ending, artImageId]) => ({
    asset: 'endings/' + ending,
    artImageId,
  }),
)
assert.equal(MAX_EMPEROR_ART_REVIEW_BATCH, 8)
assert.equal(targets.length, 8)
assert.deepEqual(parseEmperorArtReviewTargets(targets), targets)
assert.throws(() =>
  parseEmperorArtReviewTargets([
    ...targets,
    { asset: 'quests/sample', artImageId: 42 },
  ]),
)
assert.throws(() =>
  parseEmperorArtReviewTargets([
    { asset: 'endings/bell-restored', artImageId: 270431 },
  ]),
)
assert.throws(() =>
  parseEmperorArtReviewTargets([
    { asset: 'endings/../../outside', artImageId: 270430 },
  ]),
)

const route = readFileSync(
  new URL(
    '../../server/api/admin/emperor-of-dust/art-review.post.ts',
    import.meta.url,
  ),
  'utf8',
)
assert.match(route, /requireAdminApiUser\(event\)/)
assert.match(route, /parseEmperorArtReviewTargets\(body.targets\)/)
assert.match(route, /projectSlug: 'emperor-of-dust'/)
assert.match(route, /status: 'DONE'/)
assert.match(route, /isMature: false/)
assert.match(route, /readArtImageBytes\(target.artImageId\)/)
assert.match(route, /private, no-store/)
assert.match(route, /toBuffer\(\)/)
assert.doesNotMatch(route, /fs\.writeFile|prisma\.artImage\.update/)
assert.doesNotMatch(route, /mediaShareRootIsMounted|IMAGES_PATH/)
const store = readFileSync(
  new URL('../stores/emperorArtReviewStore.ts', import.meta.url),
  'utf8',
)
assert.match(store, /write: false/)
assert.doesNotMatch(store, /write: true|curated: true/)
const page = readFileSync(
  new URL('../pages/admin/emperor-art-review.vue', import.meta.url),
  'utf8',
)
assert.match(page, /userStore.isAdmin/)
assert.match(page, /ENDING_REVIEW_TARGETS/)
console.log('Emperor private art review contract passed.')
