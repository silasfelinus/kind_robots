// /utils/scripts/verifyObjectArtHistory.test.ts
//
// Every primary object keeps every image it has ever carried, and every
// surface where you LOOK at that object can reach them.
//
// Silas, 2026-09-21: "All of our primary objects should have support for
// multiple images. When we generate new images ... the new image should be
// primary, but any previous should still be viewable when looking at the
// object. I think we have this fully supported via schema ... but I don't
// think we have it supported in the individual object cards."
//
// That was exactly the shape of it. The archive half has worked all along --
// `preserveOriginal` defaults to true, so every recreate writes the prior
// image into EntityArtImage, which is the only reason the 2026-09-20 Facet
// repair could be undone. What was missing was every path back OUT:
//
//   - kr-card-back.vue, shared by six galleries, drew one frame.
//   - facet-profile.vue drew one frame; the history was reachable only from
//     the Library tab's admin editor, not from the card you open by tapping
//     a Facet in the gallery.
//   - `dream` was a valid EntityArtType on the server with no surface at all
//     mounting the manager -- and entity-art-manager.vue's own hand-kept copy
//     of the union had fallen behind, so a Dream mount would not even compile.
//
// A history with no way to see it reads the same as no history.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read = (path: string): string => readFileSync(path, 'utf8')

/* ── The archive half: nothing may quietly stop preserving. ─────────────── */

const entityArt = read('server/utils/entityArt.ts')
assert.ok(
  /preserveOriginal:\s*safeBoolean\(\s*(?:request|raw)\.preserveOriginal,\s*true\s*\)/.test(
    entityArt,
  ),
  'preserveOriginal must default to TRUE -- a recreate that does not archive ' +
    'the prior image is an unrecoverable overwrite',
)
assert.ok(
  entityArt.includes('archiveCurrentEntityArt'),
  'entityArt must archive the current image before replacing it',
)

/* ── The reading half: the shared card back shows the whole loop. ───────── */

const cardBack = read('components/gallery/kr-card-back.vue')
for (const needle of [
  '/api/art/entities/${entityType}/${entityId}',
  'artFrames',
  'activeFrameIndex',
  'activeArtSrc',
]) {
  assert.ok(
    cardBack.includes(needle),
    `kr-card-back must load and render the object's art history: ${needle}`,
  )
}
assert.ok(
  /v-if="artFrames\.length > 1"/.test(cardBack),
  'the history strip must appear only when there is more than one frame',
)
/*
 * `path` is entityArt.ts's own tag (`entity:character:3304:current:imagePath`),
 * not a URL. It is truthy, so using it as a fallback both renders a 404 AND
 * shadows the id-based source that works. Two in five sampled history rows
 * carry no imagePath at all and are reachable only by id.
 */
for (const [path, source] of [
  ['components/gallery/kr-card-back.vue', cardBack],
  [
    'components/art/entity-art-manager.vue',
    read('components/art/entity-art-manager.vue'),
  ],
] as const) {
  assert.ok(
    /\/api\/art\/images\/\$\{(?:row|item)\.id\}\/file/.test(source),
    `${path} must fall back to the ArtImage id for a history row with no imagePath`,
  )
  assert.ok(
    !/imagePath\s*\|\|\s*(?:row|item)\.path/.test(source),
    `${path} must never use an EntityArtImage \`path\` tag as an image source`,
  )
}

assert.ok(
  cardBack.includes("clean.split('?')[0]"),
  'frames must dedupe on the path, not the URL -- `?v=<updatedAt>` otherwise ' +
    'makes one picture look like two',
)

/* ── ...and every gallery that mounts it says which entity it is. ───────── */

for (const [path, entityType] of [
  ['components/bots/bot-gallery.vue', 'bot'],
  ['components/characters/character-gallery.vue', 'character'],
  ['components/dreams/dream-gallery.vue', 'dream'],
  ['components/rewards/reward-gallery.vue', 'reward'],
  ['components/scenarios/scenario-gallery.vue', 'scenario'],
  ['components/resources/resource-gallery.vue', 'resource'],
] as const) {
  assert.ok(
    read(path).includes(`entity-type="${entityType}"`),
    `${path} must tell kr-card-back which entity it is, or the back cannot ` +
      "find that object's art history",
  )
}

/* ── The two surfaces that had no history at all. ───────────────────────── */

const facetProfile = read('components/facets/facet-profile.vue')
assert.ok(
  facetProfile.includes('<EntityArtManager entity-type="facet"'),
  'facet-profile.vue is the surface a visitor reaches by tapping a Facet; it ' +
    "must show the Facet's art history, not a single plate",
)

const dreamNarration = read('components/dreams/dream-narration.vue')
assert.ok(
  dreamNarration.includes('entity-type="dream"'),
  'dream-narration.vue must mount the entity art manager -- `dream` has ' +
    'always been a valid EntityArtType with no surface that could reach it',
)

/* ── One union, imported, never restated. ───────────────────────────────── */

const manager = read('components/art/entity-art-manager.vue')
assert.ok(
  manager.includes(
    "import type { EntityArtType } from '@/server/utils/entityArt'",
  ),
  'entity-art-manager.vue must import the canonical EntityArtType',
)
const serverUnion = entityArt.match(
  /export type EntityArtType =([\s\S]*?)\n\nexport type EntityArtMode/,
)
assert.ok(
  serverUnion?.[1],
  'the server EntityArtType union could not be located',
)
const types = [...serverUnion[1].matchAll(/'([a-z]+)'/g)].map((m) => m[1])
for (const required of ['dream', 'resource', 'facet']) {
  assert.ok(
    types.includes(required),
    `${required} must remain a valid EntityArtType`,
  )
}

console.log(
  `verifyObjectArtHistory: ok (archive preserved, ${types.length} entity types, ` +
    '6 galleries + facet profile + dream reach their history)',
)
