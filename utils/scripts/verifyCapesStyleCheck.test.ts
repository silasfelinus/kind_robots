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
import {
  CAPES_ADDITIONAL_REFILL_REVIEW,
  CAPES_REFILL_GROUPS,
} from '../capesRuntimeRefillArt'
import { readFileSync } from 'node:fs'
import { IDENTITY_ARCS } from '../cometAcademy/identityArcs'
import {
  identityArtCandidateKeys,
  identityArtwork,
} from '../cometAcademy/artSlots'
import { promArt } from '../cometAcademy/artManifest'
import { henchmanForVillain } from '../cometAcademy/villainHenchmen'
import {
  CREW_TELL_ART,
  CREW_TELL_BEATS,
  crewTellKindForVillain,
} from '../everyVillainTactics/crewTelegraphArt'
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
assert.equal(CAPES_PRODUCTION_IDENTITIES.length, 17)
assert.equal(CAPES_REFILL_GROUPS.length, 9)
assert.equal(CAPES_ADDITIONAL_REFILL_REVIEW.length, 142)
assert.equal(CAPES_RUNTIME_REFILL_REVIEW.length, 6)
assert.equal(CAPES_CANON_CORRECTION_REVIEW.length, 10)
assert.equal(CAPES_FRANCHISE_SAFE_REVIEW.length, 5)
assert.equal(CAPES_REVIEWABLE_PRODUCTION.length, 177)
for (const field of ['key', 'asset', 'artJobId', 'artImageId'] as const) {
  assert.equal(
    new Set(CAPES_REVIEWABLE_PRODUCTION.map((item) => item[field])).size,
    177,
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
for (const identity of CAPES_PRODUCTION_IDENTITIES.filter(
  (entry) => !entry.signature.startsWith('refill-'),
)) {
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
// All original refill slots are represented once, with exact receipt pairs.
const allRefills = [
  ...CAPES_RUNTIME_REFILL_REVIEW,
  ...CAPES_ADDITIONAL_REFILL_REVIEW,
]
assert.equal(allRefills.length, 148)
assert.equal(new Set(allRefills.map((item) => item.asset)).size, 148)
assert.deepEqual(
  allRefills.map((item) => item.artJobId).sort((a, b) => a - b),
  [
    50716, 50717, 50718, 50719, 50720, 50721, 50722, 50723, 50724, 50725, 50726,
    50727, 50728, 50729, 50730, 50731, 50732, 50733, 50734, 50735, 50736, 50737,
    50738, 50739, 50740, 50741, 50742, 50743, 50744, 50745, 50746, 50747, 50748,
    50749, 50750, 50751, 50752, 50753, 50754, 50755, 50756, 50757, 50758, 50759,
    50760, 50761, 50762, 50763, 50764, 50765, 50766, 50767, 50768, 50769, 50770,
    50771, 50772, 50773, 50774, 50775, 50776, 50777, 50778, 50779, 50780, 50781,
    50782, 50783, 50784, 50785, 50786, 50787, 50788, 50789, 50790, 50791, 50792,
    50793, 50794, 50795, 50796, 50797, 50798, 50799, 50800, 50801, 50802, 50803,
    50804, 50805, 50806, 50807, 50808, 50809, 50810, 50811, 50812, 50813, 50814,
    50815, 50816, 50817, 50818, 50819, 50820, 50821, 50822, 50823, 50824, 50825,
    50826, 50827, 50828, 50829, 50830, 50831, 50832, 50833, 50834, 50835, 50836,
    50837, 50838, 50839, 50840, 50841, 50842, 50843, 50844, 50845, 50846, 50847,
    50848, 50849, 50850, 50851, 51771, 51772, 51773, 51774, 51775, 51776, 51777,
    51778, 51779, 51780, 51781, 51782,
  ],
)
const refillImageByJob = new Map(
  allRefills.map((item) => [item.artJobId, item.artImageId]),
)
for (const [job, image] of [
  [50716, 258018],
  [50717, 258019],
  [50718, 258020],
  [50719, 258021],
  [50720, 258022],
  [50721, 258023],
  [50722, 258024],
  [50723, 258025],
  [50724, 258026],
  [50725, 258027],
  [50726, 258028],
  [50727, 258029],
  [50728, 258030],
  [50729, 258136],
  [50730, 258137],
  [50731, 258138],
  [50732, 258139],
  [50733, 258140],
  [50734, 258141],
  [50735, 258142],
  [50736, 258143],
  [50737, 258144],
  [50738, 258145],
  [50739, 258146],
  [50740, 258147],
  [50741, 258148],
  [50742, 258149],
  [50743, 258150],
  [50744, 258151],
  [50745, 258152],
  [50746, 258153],
  [50747, 258154],
  [50748, 258155],
  [50749, 258156],
  [50750, 258157],
  [50751, 258158],
  [50752, 258159],
  [50753, 258160],
  [50754, 258161],
  [50755, 258162],
  [50756, 258163],
  [50757, 258164],
  [50758, 258165],
  [50759, 258166],
  [50760, 258167],
  [50761, 258168],
  [50762, 258169],
  [50763, 258170],
  [50764, 258171],
  [50765, 258172],
  [50766, 258173],
  [50767, 258174],
  [50768, 258175],
  [50769, 258176],
  [50770, 258177],
  [50771, 258178],
  [50772, 258179],
  [50773, 258180],
  [50774, 258181],
  [50775, 258182],
  [50776, 258183],
  [50777, 258184],
  [50778, 258185],
  [50779, 258186],
  [50780, 258187],
  [50781, 258188],
  [50782, 258189],
  [50783, 258190],
  [50784, 258191],
  [50785, 258192],
  [50786, 258193],
  [50787, 258194],
  [50788, 258195],
  [50789, 258196],
  [50790, 258197],
  [50791, 258198],
  [50792, 258199],
  [50793, 258200],
  [50794, 258201],
  [50795, 258202],
  [50796, 258203],
  [50797, 258204],
  [50798, 258205],
  [50799, 258206],
  [50800, 258207],
  [50801, 258208],
  [50802, 258209],
  [50803, 258210],
  [50804, 258211],
  [50805, 258212],
  [50806, 258213],
  [50807, 258214],
  [50808, 258215],
  [50809, 258216],
  [50810, 258217],
  [50811, 258218],
  [50812, 258219],
  [50813, 258220],
  [50814, 258221],
  [50815, 258222],
  [50816, 258223],
  [50817, 258224],
  [50818, 258225],
  [50819, 258226],
  [51771, 258327],
  [51772, 258328],
  [51773, 258329],
  [51774, 258330],
  [51775, 258331],
  [51776, 258332],
  [51777, 258333],
  [51778, 258334],
  [51779, 258335],
  [51780, 258336],
  [51781, 258337],
  [51782, 258338],
  [50820, 258227],
  [50821, 258228],
  [50822, 258229],
  [50823, 258230],
  [50824, 258231],
  [50825, 258232],
  [50826, 258233],
  [50827, 258234],
  [50828, 258235],
  [50829, 258236],
  [50830, 258237],
  [50831, 258238],
  [50832, 258239],
  [50833, 258240],
  [50834, 258241],
  [50835, 258242],
  [50836, 258243],
  [50837, 258244],
  [50838, 258245],
  [50839, 258246],
  [50840, 258247],
  [50841, 258248],
  [50842, 258249],
  [50843, 258250],
  [50844, 258251],
  [50845, 258252],
  [50846, 258253],
  [50847, 258254],
  [50848, 258255],
  [50849, 258256],
  [50850, 258257],
  [50851, 258258],
] as const) {
  assert.equal(refillImageByJob.get(job), image, 'ArtJob ' + job)
}
const refillGroupSizes = {
  'refill-accident': 14,
  'refill-mutant': 12,
  'refill-tech': 14,
  'refill-magic': 16,
  'refill-alien': 14,
  'refill-psychic': 16,
  'refill-incidents': 30,
  'refill-returns': 24,
  'refill-endings': 2,
} as const
for (const group of CAPES_REFILL_GROUPS) {
  const entries = capesProductionFor(group.signature)
  assert.equal(entries.length, refillGroupSizes[group.signature])
  for (const entry of entries) {
    const [, family, slot] = entry.asset.split('/')
    assert.equal(entry.size, '1344x768')
    assert.equal(
      group.signature,
      'refill-' + (family === 'identities' ? slot?.split('-')[0] : family),
    )
  }
}
const gallery = readFileSync(
  new URL(
    '../../components/admin/capes-production-gallery.vue',
    import.meta.url,
  ),
  'utf8',
)
assert.match(gallery, /data-testid="capes-production-gallery"/)
assert.match(gallery, /CAPES_PRODUCTION_IDENTITIES\.length/)
assert.match(gallery, /CAPES_REVIEWABLE_PRODUCTION\.length/)
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
assert.match(atlas, /data-testid="capes-crew-private-gallery"/)
assert.match(atlas, /CREW_TELL_BEATS/)
assert.match(atlas, /paintedArt\.ensure\(receipt\.imageId\)/)
assert.match(atlas, /paintedArt\.retry\(crewProofReceipt\(beat\)\.imageId\)/)
assert.match(atlas, /useEveryVillainTacticsArtStore/)
assert.match(atlas, /viewer\.isAdmin/)
assert.match(atlas, /selectedCrewPrivateSrc/)
assert.doesNotMatch(atlas, /\/api\/art\/images\//)
const sourceCrewSignatures = {
  burrow: 'accident-earth',
  phase: 'alien-discipline',
  windup: 'accident-birthright',
} as const
const privateCrewImages = new Set<number>()
const privateCrewJobs = new Set<number>()
const privateCrewKeys = new Set<string>()
for (const [kind, signature] of Object.entries(sourceCrewSignatures)) {
  assert.equal(
    crewTellKindForVillain(
      signature as Parameters<typeof crewTellKindForVillain>[0],
    ),
    kind,
  )
  assert.equal(
    henchmanForVillain(signature as Parameters<typeof henchmanForVillain>[0])
      .name,
    CREW_TELL_ART[kind as keyof typeof CREW_TELL_ART].name,
  )
  for (const beat of CREW_TELL_BEATS) {
    const receipt =
      CREW_TELL_ART[kind as keyof typeof CREW_TELL_ART].beats[beat]
    privateCrewImages.add(receipt.imageId)
    privateCrewJobs.add(receipt.jobId)
    privateCrewKeys.add(receipt.artKey)
    assert.ok(receipt.artKey.includes('/' + signature + '/'))
  }
}
assert.equal(crewTellKindForVillain('tech-genius'), null)
assert.equal(privateCrewImages.size, 12)
assert.equal(privateCrewJobs.size, 12)
assert.equal(privateCrewKeys.size, 12)
assert.deepEqual(
  [...privateCrewImages].sort((a, b) => a - b),
  Array.from({ length: 12 }, (_, i) => 277786 + i),
)
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
