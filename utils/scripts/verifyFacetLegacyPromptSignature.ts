// /utils/scripts/verifyFacetLegacyPromptSignature.ts
//
// The v2/v3 Facet art producers persisted a generated wrapper into
// Facet.artPrompt. The v4 repair must recognize every shape of that wrapper
// (so it regenerates a semantic prompt) while never touching a curated prompt.
//
// 2026-09-05: the first production `--repair-tainted --write` run aborted on
// ten Facets whose titles contain straight quotes inside the curly-quoted
// wrapper ("Carries a candle everywhere "just in case.""). The old signature
// used one character class excluding both quote styles, so those prompts read
// as curated, went to Krea verbatim, and the prompt contract rejected them.
import assert from 'node:assert/strict'
import { checkArtPromptContract } from '../../server/utils/artPromptContract'
import {
  buildFacetIdentityPrompt,
  isLegacyGeneratedFacetPrompt,
} from '../../scripts/generate_facet_art_v4'

const wrapperPrompts = [
  'Illustrate the Facet concept “Surreal Horror”. A dream logic nightmare. Build one iconic scene.',
  'Illustrate the Facet concept "Surreal Horror". A dream logic nightmare.',
  'Illustrate the Facet concept “Carries a candle everywhere "just in case."”. The case has arrived twice. Use a character-centered visual metaphor with a clear emotional read and no written explanation.',
  'Illustrate the Facet concept “Clone #47 — the one who finally asked "why?"”. Forty-six of them did not ask.',
  'Illustrate the Facet concept “Keeps an invisible "force field" around themselves.”. Maintains a precise personal radius.',
  '  Illustrate the Facet concept “Aardvark”.  ',
]
for (const prompt of wrapperPrompts) {
  assert.ok(
    isLegacyGeneratedFacetPrompt(prompt),
    `generated wrapper must be recognized as legacy provenance: ${prompt}`,
  )
}

const curatedPrompts = [
  'A surreal dreamscape where physics gently misbehaves, floating impossible objects, warm and uncanny.',
  'A hand-painted rescue buoy, its paint chipped down to bare metal along one whole side.',
  'A poster that says "Illustrate the Facet concept" in peeling letters on a brick wall.',
  'Facet of a cut gemstone, illustrate the refraction with prismatic light.',
  '',
  null,
  undefined,
]
for (const prompt of curatedPrompts) {
  assert.equal(
    isLegacyGeneratedFacetPrompt(prompt),
    false,
    `curated or empty prompt must never be treated as the generated wrapper: ${String(prompt)}`,
  )
}

// FacetProfile.metadata.artworkPrompt is seed-time provenance for the old
// contextual producers. It must never reach the identity prompt when it names
// the app or asks for a card format (2026-09-05 repair run: 28 Facets rejected
// by the format-vocabulary rule), while a metadata prompt that is a usable
// caption on its own is still honoured.
const seedFacet = {
  id: 1757,
  title: 'Art',
  slug: 'art',
  description:
    'A visual seed for image generation, mood boards, covers, and weird little art goblins.',
  flavorText: null,
  examples: null,
  artPrompt: 'Illustrate the Facet concept “Art”. A visual seed for image generation.',
  userId: 1,
  isPublic: true,
  isMature: false,
}
const seedProfile = (artworkPrompt: string) => ({
  facetId: 1757,
  taxonomy: 'DREAM_TYPE',
  canonicalValue: 'art',
  groupKey: null,
  groupLabel: null,
  isRandomizable: false,
  randomWeight: 0,
  artRequired: true,
  sourceRank: null,
  metadata: JSON.stringify({ source: 'seed', artworkPrompt }),
})

const provenanceIdentity = buildFacetIdentityPrompt(
  seedFacet as never,
  seedProfile(
    'Kind Robots premium Builder card illustration for Dream Types: Art. A visual seed for image generation. Single centered subject or emblem, polished fantasy-software dashboard art, readable silhouette, no text, WebP.',
  ) as never,
)
assert.doesNotMatch(provenanceIdentity, /Kind Robots|card illustration|WebP/i)
assert.match(provenanceIdentity, /^Art\. A visual seed for image generation/)
assert.deepEqual(
  checkArtPromptContract({
    prompt: provenanceIdentity,
    engine: 'krea2',
    steps: 8,
    cfg: 1,
  }),
  [],
  'a seed-provenance metadata prompt must not leak into the identity prompt',
)

const cardIdentity = buildFacetIdentityPrompt(
  seedFacet as never,
  seedProfile(
    'Expressive inclusive character-card illustration representing non-binary identity, confident and specific.',
  ) as never,
)
assert.doesNotMatch(cardIdentity, /card illustration/i)

const captionIdentity = buildFacetIdentityPrompt(
  seedFacet as never,
  seedProfile(
    'A paint-splattered easel under a skylight, brushes fanned in a jar, one canvas turned to the wall.',
  ) as never,
)
assert.match(
  captionIdentity,
  /paint-splattered easel under a skylight/,
  'a metadata prompt that is a usable caption on its own is still honoured',
)

console.log('Facet legacy prompt signature contract verified.')
