import assert from 'node:assert/strict'
import {
  CAPES_PRODUCTION_IDENTITIES,
  CAPES_UNSTABLE_PRODUCTION,
  capesProductionFor,
} from '../capesProductionArt'
import { readFileSync } from 'node:fs'
import {
  CAPES_STYLE_CRITERIA,
  CAPES_STYLE_DESIGNER,
  CAPES_STYLE_DESIGNERS,
  CAPES_STYLE_LANES,
  CAPES_STYLE_SUBJECTS,
  capesStyleCellKey,
  capesStyleLaneFromModel,
} from '../capesStyleCheck'

assert.equal(CAPES_STYLE_SUBJECTS.length, 8)
assert.equal(CAPES_STYLE_LANES.length, 6)
assert.equal(CAPES_STYLE_CRITERIA.length, 4)
assert.equal(
  new Set(CAPES_STYLE_SUBJECTS.map((subject) => subject.seed)).size,
  8,
)
assert.equal(
  new Set(CAPES_STYLE_SUBJECTS.map((subject) => subject.key)).size,
  8,
)
assert.equal(new Set(CAPES_STYLE_LANES.map((lane) => lane.key)).size, 6)
assert.equal(
  new Set(
    CAPES_STYLE_SUBJECTS.flatMap((subject) =>
      CAPES_STYLE_LANES.map((lane) => capesStyleCellKey(subject.key, lane.key)),
    ),
  ).size,
  48,
)
assert.ok(CAPES_STYLE_DESIGNER.includes('Capes Style Check'))
assert.equal(CAPES_STYLE_DESIGNERS.length, 2)
assert.ok(
  CAPES_STYLE_SUBJECTS.some(
    (subject) => subject.key === 'academy-city-quad-map',
  ),
)
assert.ok(
  CAPES_STYLE_SUBJECTS.some(
    (subject) => subject.key === 'firewall-alert-portrait',
  ),
)
assert.deepEqual(
  new Set(CAPES_STYLE_LANES.map((lane) => lane.key)),
  new Set([
    'krea2',
    'arthemy',
    'nova-comic',
    'illustrij',
    'dreamshaper',
    'unstable',
  ]),
)
for (const lane of CAPES_STYLE_LANES) {
  assert.ok(
    !/furry|pony|flux/i.test(lane.model),
    lane.key + ' is an excluded model',
  )
  assert.equal(
    capesStyleLaneFromModel('models/' + lane.model + '.safetensors'),
    lane.key,
  )
}
assert.equal(capesStyleLaneFromModel('Flux2-Klein.gguf'), null)
assert.equal(capesStyleLaneFromModel('furrytoonmix_xlV3.safetensors'), null)
assert.equal(capesStyleLaneFromModel('ponyFaetality_v11.safetensors'), null)

// Source-ledger-linked private production receipts remain distinct from
// artist-approved delivery and the original 48 permanent identities.
assert.equal(CAPES_UNSTABLE_PRODUCTION.length, 14)
assert.equal(CAPES_PRODUCTION_IDENTITIES.length, 3)
assert.equal(
  new Set(CAPES_UNSTABLE_PRODUCTION.map((item) => item.key)).size,
  14,
)
assert.equal(
  new Set(CAPES_UNSTABLE_PRODUCTION.map((item) => item.asset)).size,
  14,
)
assert.equal(
  new Set(CAPES_UNSTABLE_PRODUCTION.map((item) => item.artJobId)).size,
  14,
)
assert.equal(
  new Set(CAPES_UNSTABLE_PRODUCTION.map((item) => item.artImageId)).size,
  14,
)
for (const identity of CAPES_PRODUCTION_IDENTITIES) {
  const group = capesProductionFor(identity.signature)
  assert.ok(group.length >= 4)
  assert.ok(group.some((item) => item.asset.includes('/model-hero-2x1')))
  assert.ok(group.some((item) => item.asset.includes('/model-villain-2x1')))
  for (const image of group) {
    assert.ok(image.artJobId > 50000)
    assert.ok(image.artImageId > 250000)
    assert.ok(
      image.asset.startsWith(
        `comet-city-academy/identities/${identity.signature}/`,
      ),
    )
  }
}
assert.equal(
  CAPES_UNSTABLE_PRODUCTION.find((item) => item.key === 'frog-villain-poster')
    ?.artImageId,
  258012,
)
assert.equal(
  CAPES_UNSTABLE_PRODUCTION.find(
    (item) => item.key === 'cornerstone-hero-standee',
  )?.artJobId,
  50549,
)
const gallery = readFileSync(
  new URL(
    '../../components/admin/capes-production-gallery.vue',
    import.meta.url,
  ),
  'utf8',
)
assert.match(gallery, /data-testid="capes-production-gallery"/)
assert.match(gallery, /capesProductionFor\(selected\.value\)/)
assert.match(gallery, /loadProductionImages\(signature\)/)
assert.match(gallery, /productionImageFor\(item\.artImageId\)/)
assert.match(gallery, /delivery unverified/)
assert.match(gallery, /data-testid="capes-export-production-qa"/)
assert.match(gallery, /data-testid="'capes-approve-' \+ item.key"/)
assert.match(gallery, /data-testid="'capes-reject-' \+ item.key"/)
assert.match(gallery, /if \(!store.productionImageFor\(artImageId\)\) return/)
assert.match(gallery, /decision === 'rejected' && !note/)
assert.match(gallery, /source: 'browser-local-art-qa'/)
assert.match(gallery, /productionApproved: false/)
assert.match(gallery, /localStorage.setItem\(REVIEW_STORAGE_KEY/)


const atlas = readFileSync(
  new URL('../../components/admin/capes-cast-atlas.vue', import.meta.url),
  'utf8',
)
assert.match(atlas, /data-testid="capes-cast-atlas"/)
assert.match(atlas, /data-testid="capes-cast-search"/)
assert.match(atlas, /IDENTITY_ARCS/)
assert.match(atlas, /henchmanForVillain/)
assert.match(atlas, /data-testid="capes-henchman-poster"/)
assert.match(atlas, /data-testid="capes-lieutenant-poster"/)
assert.match(atlas, /promArt\(group \+/)
assert.match(atlas, /campaignStagesFor/)
// Keep consistent with the merged outcome-art fallback #5505.
assert.match(atlas, /identityArtwork\(signature, role\)/)
assert.match(atlas, /Not attached/)
assert.match(atlas, /48 PERMANENT CHARACTERS/)

const page = readFileSync(
  new URL('../../pages/admin/capes.vue', import.meta.url),
  'utf8',
)
const api = readFileSync(
  new URL('../../server/api/capes/style-check.get.ts', import.meta.url),
  'utf8',
)
const store = readFileSync(
  new URL('../../stores/capesStyleCheckStore.ts', import.meta.url),
  'utf8',
)
const channel = readFileSync(
  new URL('../../content/channels/admin/capes.md', import.meta.url),
  'utf8',
)
assert.match(page, /data-testid="capes-style-check"/)
assert.match(page, /data-testid="'capes-lane-' \+ lane.key"/)
assert.match(page, /store\.scoreFor/)
assert.match(page, /store\.noteFor/)
assert.match(page, /store\.imageFor/)
assert.match(api, /requireMachineUser/)
assert.match(api, /auth\.isAdmin/)
assert.match(api, /CAPES_STYLE_DESIGNERS\.map/)
assert.match(api, /requireMachineUser/)
assert.match(store, /loadJobImage/)
assert.match(store, /localStorage\.setItem/)
assert.match(channel, /route: \/admin\/capes/)
assert.match(channel, /requiredRole: ADMIN/)
assert.match(channel, /tabKey: capes/)
assert.match(page, /'capes-section-' \+ section.key/)
assert.match(page, /key: 'cast'/)
assert.match(page, /<CapesCastAtlas/)
assert.match(page, /<CapesProductionGallery/)
assert.match(store, /loadProductionImages/)
assert.match(store, /artJobs\.loadJobImage\(entry\.artImageId\)/)
assert.match(page, /data-testid="capes-model-proposals"/)
assert.match(page, /data-testid="capes-asset-plan"/)

console.log(
  'Capes style gate: 48 slots, six approved models, live jobs, scoring and cast atlas: OK',
)
