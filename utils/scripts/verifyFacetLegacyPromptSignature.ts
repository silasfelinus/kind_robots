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
  v4PromptWasClauseDominated,
  v4RenderNeedsRepair,
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

// v4 persisted its own generated tail the same way v2/v3 did. Every clause has
// to be recognized, not only the two that misrendered: buildFacetIdentityPrompt
// returns an unrecognized stored prompt verbatim, so a missed clause is handed
// back to the prompt contract -- which now rejects the jargon -- and aborts the
// whole repair run instead of fixing it (2026-09-14).
const v4WrapperPrompts = [
  'Office Satire. Iconic scene, concrete focal subject, environment, action, strong atmosphere.',
  'Chaos Consultant. Single distinctive figure in action, readable tools, unmistakable silhouette, workplace cues.',
  'Blue-Footed Booby. One unmistakable full creature, recognizable anatomy, distinctive personality, habitat cues.',
  'Challenging. Character-centered visual metaphor, clear emotion through pose, expression, costume, and environment.',
  'Cathedralpunk. Polished sample of the visual treatment, coherent medium, linework, palette, lighting, and surface detail.',
  'Burnished Copper. Unmistakable palette or material behavior through lighting, texture, and a strong central form.',
  'Legendary. Premium collectible object or emblem, rarity expressed through materials and lighting, clean silhouette.',
  'Wildcard. Single clear subject or emblem, immediately legible at thumbnail size.',
  // A Facet WITH prose still carries the generated tail and must still be
  // rebuilt, or its stored jargon goes back to Krea untouched.
  'Surreal Horror. dream logic nightmare in a rain-black forest, wet oil paint. Iconic scene, concrete focal subject, environment, action, strong atmosphere.',
]
for (const prompt of v4WrapperPrompts) {
  assert.ok(
    isLegacyGeneratedFacetPrompt(prompt),
    `v4 generated tail must be recognized as provenance: ${prompt}`,
  )
}

// Which of those get a repair RENDER is a narrower question than which get a
// rebuilt prompt: v4 only misrendered where the clause was the whole prompt.
assert.equal(
  v4PromptWasClauseDominated({
    description: null,
    flavorText: null,
    examples: null,
  } as never),
  true,
  'a prose-less Facet is the cohort that rendered as a concrete bust',
)
for (const prose of [
  { description: 'Dream logic in a rain-black forest.', flavorText: null, examples: null },
  { description: null, flavorText: 'It never quite ends.', examples: null },
  { description: null, flavorText: null, examples: 'Jacobs Ladder, Annihilation' },
  { description: '   ', flavorText: null, examples: 'Jacobs Ladder' },
]) {
  assert.equal(
    v4PromptWasClauseDominated(prose as never),
    false,
    `a Facet with prose diluted the clause and rendered correctly: ${JSON.stringify(prose)}`,
  )
}
assert.equal(
  v4PromptWasClauseDominated({
    description: '   ',
    flavorText: '',
    examples: null,
  } as never),
  true,
  'whitespace is not prose',
)

// Which renders are actually RESUBMITTED needs both halves. A bare clause that
// names a real subject rendered correctly, and re-rolling it would trade a good
// image for a fresh random seed.
const bare = (artPrompt: string) => ({
  description: null,
  flavorText: null,
  examples: null,
  artPrompt,
}) as never
for (const broken of [
  'Office Satire. Iconic scene, concrete focal subject, environment, action, strong atmosphere.',
  'Chaos Consultant. Single distinctive figure in action, readable tools, unmistakable silhouette, workplace cues.',
]) {
  assert.equal(
    v4RenderNeedsRepair(bare(broken)),
    true,
    `an observed-bad v4 render must be resubmitted: ${broken}`,
  )
}
for (const fine of [
  // Rendered correctly: the title is the subject and the clause names a creature.
  'Blue-Footed Booby. One unmistakable full creature, recognizable anatomy, distinctive personality, habitat cues.',
  'Challenging. Character-centered visual metaphor, clear emotion through pose, expression, costume, and environment.',
  'Cathedralpunk. Polished sample of the visual treatment, coherent medium, linework, palette, lighting, and surface detail.',
]) {
  assert.equal(
    v4RenderNeedsRepair(bare(fine)),
    false,
    `a v4 clause with no contract violation must not be re-rolled: ${fine}`,
  )
}
assert.equal(
  v4RenderNeedsRepair({
    description: 'Dream logic in a rain-black forest.',
    flavorText: null,
    examples: null,
    artPrompt:
      'Surreal Horror. Dream logic in a rain-black forest. Iconic scene, concrete focal subject, environment, action, strong atmosphere.',
  } as never),
  false,
  'a Facet whose own prose carried the image is left alone even though its stored prompt has jargon',
)

const curatedPrompts = [
  'A surreal dreamscape where physics gently misbehaves, floating impossible objects, warm and uncanny.',
  'A hand-painted rescue buoy, its paint chipped down to bare metal along one whole side.',
  'A poster that says "Illustrate the Facet concept" in peeling letters on a brick wall.',
  'Facet of a cut gemstone, illustrate the refraction with prismatic light.',
  // Tail matching is anchored to the END of the prompt, so curated prose that
  // happens to describe an iconic scene is untouched.
  'An iconic scene from the harbour festival, lanterns strung between masts.',
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
