import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  ENDING_ART_IMAGE_IDS,
  MAX_EMPEROR_ART_DELIVERY_BATCH,
  emperorMediaArtUrl,
  endingMediaArtUrl,
  parseEmperorArtDeliveryTargets,
} from '../emperorOfDust/fortress/artDelivery'
import { ENDINGS } from '../emperorOfDust/fortress/endings'
import type { EndingId } from '../emperorOfDust/fortress/endings'

const endings = Object.keys(ENDINGS) as EndingId[]
assert.equal(endings.length, 8, 'exactly eight authored endings')
assert.equal(new Set(Object.values(ENDING_ART_IMAGE_IDS)).size, endings.length)
assert.deepEqual(
  Object.values(ENDING_ART_IMAGE_IDS).sort((a, b) => a - b),
  [270430, 270431, 270432, 270433, 270434, 270435, 270436, 270437],
  'the source ArtImage IDs must match the original completed ArtJobs',
)
const targets = endings.map((ending) => ({
  asset: `endings/${ending}`,
  artImageId: ENDING_ART_IMAGE_IDS[ending],
}))
assert.deepEqual(parseEmperorArtDeliveryTargets(targets), targets)
for (const ending of endings) {
  assert.equal(
    endingMediaArtUrl(ending),
    `/images/emperor-of-dust/endings/${ending}.webp`,
  )
}
assert.equal(
  emperorMediaArtUrl('quests/r-fever-ward-success'),
  '/images/emperor-of-dust/quests/r-fever-ward-success.webp',
)
assert.equal(
  emperorMediaArtUrl('followers/F001/illustrated/happy'),
  '/images/emperor-of-dust/cast/followers/F001/illustrated/happy.webp',
)
assert.equal(
  emperorMediaArtUrl('npcs/young-komodo/neutral'),
  '/images/emperor-of-dust/cast/npcs/young-komodo/neutral.webp',
)
assert.deepEqual(
  parseEmperorArtDeliveryTargets([
    { asset: 'chance-events/dust-weather-1/notice', artImageId: 17 },
    { asset: 'talks/kiyo/kiyo-close-friendship', artImageId: 18 },
    { asset: 'followers/F001/illustrated/happy', artImageId: 19 },
    { asset: 'npcs/young-komodo/neutral', artImageId: 20 },
  ]).map((entry) => entry.artImageId),
  [17, 18, 19, 20],
)

for (const item of [
  { asset: 'endings/iron-peace', artImageId: 270430 },
  { asset: 'endings/unknown', artImageId: 270432 },
  { asset: 'endings/iron-peace.webp', artImageId: 270432 },
  { asset: 'endings/../../etc/passwd', artImageId: 270432 },
  { asset: '/endings/iron-peace', artImageId: 270432 },
  { asset: 'endings//iron-peace', artImageId: 270432 },
  { asset: 'endings\\iron-peace', artImageId: 270432 },
  { asset: 'other/renders', artImageId: 270432 },
  { asset: 'quests/success', artImageId: 0 },
  { asset: 'quests/success', artImageId: 1.5 },
  { asset: 'quests/success', artImageId: '270430' },
]) {
  assert.throws(
    () => parseEmperorArtDeliveryTargets([item]),
    undefined,
    `unsafe or untrusted target should fail: ${JSON.stringify(item)}`,
  )
}
assert.throws(() => parseEmperorArtDeliveryTargets([]))
assert.throws(
  () => parseEmperorArtDeliveryTargets(Array.from(
    { length: MAX_EMPEROR_ART_DELIVERY_BATCH + 1 },
    (_, index) => ({ asset: `quests/test-${index}`, artImageId: 10 + index }),
  )),
)
assert.throws(() => parseEmperorArtDeliveryTargets([targets[0], targets[0]]))
assert.deepEqual(
  parseEmperorArtDeliveryTargets([
    { asset: 'quests/r-fever-ward-success', artImageId: 276530 },
    { asset: 'quests/r-verge-scouts-failure', artImageId: 276531 },
  ]),
  [
    { asset: 'quests/r-fever-ward-success', artImageId: 276530 },
    { asset: 'quests/r-verge-scouts-failure', artImageId: 276531 },
  ],
)

const endpoint = readFileSync(
  new URL(
    '../../server/api/admin/emperor-of-dust/art-deliver.post.ts',
    import.meta.url,
  ),
  'utf8',
)
assert.match(endpoint, /requireAdminApiUser\(event\)/)
assert.match(endpoint, /projectSlug: 'emperor-of-dust'/)
assert.match(endpoint, /status: 'DONE'/)
assert.match(endpoint, /isMature: true/)
assert.match(endpoint, /readArtImageBytes\(target.artImageId\)/)
assert.match(endpoint, /mediaShareRootIsMounted\(root\)/)
assert.match(endpoint, /body.curated !== true/)
assert.match(endpoint, /await fs.link\(temporary, destination\)/)
assert.match(endpoint, /another export won/i)
assert.doesNotMatch(endpoint, /imageData:\s*null/)
assert.doesNotMatch(endpoint, /prisma\.artImage\.update/)

const plate = readFileSync(
  new URL('../../components/EmperorFortressEndingPlate.vue', import.meta.url),
  'utf8',
)
assert.match(plate, /endingMediaArtUrl\(props.endingId\)/)
assert.match(plate, /@error="tryNext"/)
assert.match(plate, /position.value >= 2/)
assert.match(plate, /'\/emperor-of-dust\/map\/wasteland.webp'/)
console.log(
  'Emperor durable ArtImage delivery: eight locked sources, safe batch ' +
    'validation, admin-only no-clobber media export and visible fallback passed',
)
