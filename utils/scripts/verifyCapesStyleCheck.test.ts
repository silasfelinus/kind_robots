import assert from 'node:assert/strict'
import {
  CAPES_PRODUCTION_IDENTITIES,
  CAPES_UNSTABLE_PRODUCTION,
  CAPES_RUNTIME_REFILL_REVIEW,
  CAPES_CANON_CORRECTION_REVIEW,
  CAPES_FRANCHISE_SAFE_REVIEW,
  CAPES_REVIEWABLE_PRODUCTION,
  capesProductionFor,
} from '../capesProductionArt'
import { readFileSync } from 'node:fs'
import { IDENTITY_ARCS } from '../cometAcademy/identityArcs'
import {
  identityArtCandidateKeys,
  identityArtwork,
} from '../cometAcademy/artSlots'
import { promArt } from '../cometAcademy/artManifest'
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
assert.equal(CAPES_PRODUCTION_IDENTITIES.length, 8)
assert.equal(CAPES_RUNTIME_REFILL_REVIEW.length, 6)
assert.equal(CAPES_CANON_CORRECTION_REVIEW.length, 10)
assert.equal(CAPES_FRANCHISE_SAFE_REVIEW.length, 5)
assert.equal(CAPES_REVIEWABLE_PRODUCTION.length, 35)
for (const field of ['key', 'asset', 'artJobId', 'artImageId'] as const) {
  assert.equal(
    new Set(CAPES_REVIEWABLE_PRODUCTION.map((item) => item[field])).size,
    35,
    field + ' must be unique across all reviewable production images',
  )
}
assert.deepEqual(
  CAPES_CANON_CORRECTION_REVIEW.map((item) => [item.artJobId, item.artImageId]),
  [
    [76529, 278466],
    [76530, 278467],
    [76531, 278468],
    [76532, 278469],
    [76593, 278587],
    [76594, 278588],
    [76595, 278589],
    [76596, 278590],
    [76597, 278591],
    [76598, 278592],
  ],
)
assert.deepEqual(
  CAPES_FRANCHISE_SAFE_REVIEW.map((item) => [item.artJobId, item.artImageId]),
  [
    [50711, 258003],
    [50712, 258004],
    [50713, 258015],
    [50714, 258016],
    [50715, 258017],
  ],
)
assert.deepEqual(
  CAPES_RUNTIME_REFILL_REVIEW.map((item) => [item.artJobId, item.artImageId]),
  [
    [50734, 258141],
    [50735, 258142],
    [50754, 258161],
    [50755, 258162],
    [50784, 258191],
    [50785, 258192],
  ],
)
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
  assert.ok(group.length >= 2)
  if (
    identity.signature === 'accident-earth' ||
    identity.signature === 'accident-fire' ||
    identity.signature === 'tech-genius'
  ) {
    assert.ok(group.some((item) => item.asset.includes('/model-hero-2x1')))
    assert.ok(group.some((item) => item.asset.includes('/model-villain-2x1')))
  } else if (
    identity.signature === 'alien-discipline' ||
    identity.signature === 'mutant-earth'
  ) {
    assert.ok(group.some((item) => item.asset.endsWith('/hero')))
    assert.ok(group.some((item) => item.asset.endsWith('/villain')))
  } else if (
    identity.signature === 'mutant-discipline' ||
    identity.signature === 'magic-earth'
  ) {
    assert.ok(group.some((item) => item.asset.endsWith('/outcomes/hero')))
    assert.ok(group.some((item) => item.asset.endsWith('/outcomes/villain')))
  } else {
    assert.equal(identity.signature, 'franchise-safe')
    assert.equal(group.length, 5)
  }
  for (const image of group) {
    assert.ok(image.artJobId > 50000)
    assert.ok(image.artImageId > 250000)
    assert.ok(image.asset.startsWith('comet-city-academy/'))
    if (identity.signature !== 'franchise-safe') {
      assert.ok(
        image.asset.startsWith(
          `comet-city-academy/identities/${identity.signature}/`,
        ),
      )
    }
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
assert.match(atlas, /campaignStagesFor/)
// The atlas must resolve actual shipped files through the canonical identity
// resolver, not a particular source-level call shape or component refactor.
const shipped = { hero: 0, villain: 0 }
const canonSafe = { hero: 0, villain: 0 }
assert.equal(IDENTITY_ARCS.length, 48)
for (const identity of IDENTITY_ARCS) {
  for (const role of ['hero', 'villain'] as const) {
    const delivered = identityArtCandidateKeys(identity.signature, role)
      .map((key) => promArt(key))
      .filter((url): url is string => Boolean(url))
    // Count actual exported outcome plates, not a student fallback that merely
    // makes a role's display slot usable.
    if (promArt(`identities/${identity.signature}/outcomes/${role}`))
      shipped[role]++
    const resolved = identityArtwork(identity.signature, role)
    if (resolved) {
      canonSafe[role]++
      assert.ok(
        delivered.includes(resolved),
        identity.signature + '/' + role + ' must resolve a shipped file',
      )
    }
  }
}
assert.deepEqual(shipped, { hero: 48, villain: 47 })
assert.deepEqual(canonSafe, { hero: 47, villain: 47 })
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
assert.match(store, /CAPES_REVIEWABLE_PRODUCTION/)
assert.match(page, /data-testid="capes-model-proposals"/)
assert.match(page, /data-testid="capes-asset-plan"/)

console.log(
  'Capes style gate: 48 slots, six approved models, live jobs, scoring and cast atlas: OK',
)
