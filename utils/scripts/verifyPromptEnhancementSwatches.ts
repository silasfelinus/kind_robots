// /utils/scripts/verifyPromptEnhancementSwatches.ts
//
// The "✨ Make Pretty Enhancements" pack split in two on 2026-09-15: quality
// incantations withdrawn, real techniques rendered as a fixed-subject swatch.
// Both halves are asserted here, plus the thing that is easy to break by
// accident -- that splitting them changed nothing for any OTHER taxonomy.
import assert from 'node:assert/strict'
import { checkArtPromptContract } from '../../server/utils/artPromptContract'
import {
  ENHANCEMENT_SWATCH_SUBJECT,
  RETIRED_PROMPT_ENHANCEMENT_SLUGS,
  isRetiredPromptEnhancement,
} from '../promptEnhancementPolicy'
import {
  buildFacetIdentityPrompt,
  buildFacetVariantPrompt,
  isLegacyGeneratedFacetPrompt,
  v4RenderNeedsRepair,
} from '../../scripts/generate_facet_art_v4'

const facet = (over: Record<string, unknown> = {}) =>
  ({
    id: 1,
    title: 'depth of field',
    slug: 'depth-of-field',
    description: null,
    flavorText: null,
    examples: null,
    artPrompt: null,
    ...over,
  }) as never

const profile = (taxonomy: string) =>
  ({ facetId: 1, taxonomy, metadata: null }) as never

// ── The retired half ────────────────────────────────────────────────────────

assert.equal(RETIRED_PROMPT_ENHANCEMENT_SLUGS.length, 13)
for (const slug of RETIRED_PROMPT_ENHANCEMENT_SLUGS) {
  assert.ok(
    isRetiredPromptEnhancement({ slug, title: null }),
    `${slug} must be recognized as retired`,
  )
}
// Re-casing a title during a curation pass must not silently un-retire a row.
assert.ok(isRetiredPromptEnhancement({ slug: null, title: 'Trending On ArtStation' }))
assert.ok(isRetiredPromptEnhancement({ slug: null, title: '  masterpiece  ' }))

// ── The kept half ───────────────────────────────────────────────────────────

for (const kept of [
  { slug: 'depth-of-field', title: 'depth of field' },
  { slug: 'subsurface-scattering', title: 'subsurface scattering' },
  { slug: 'oil-on-canvas-effect', title: 'oil on canvas effect' },
  { slug: 'film-grain', title: 'film grain' },
]) {
  assert.equal(
    isRetiredPromptEnhancement(kept),
    false,
    `${kept.slug} is a real technique and must keep its art`,
  )
}

// An empty facet must never match by accident — that would silently retire the
// whole pack the first time a row arrived without a slug or title.
assert.equal(isRetiredPromptEnhancement({ slug: null, title: null }), false)
assert.equal(isRetiredPromptEnhancement({ slug: '', title: '' }), false)

// ── The swatch itself ───────────────────────────────────────────────────────

const swatch = buildFacetIdentityPrompt(facet(), profile('PROMPT_ENHANCEMENT'))
assert.ok(
  swatch.startsWith('depth of field.'),
  'the technique leads: the first words are the strongest position in a caption',
)
assert.ok(
  swatch.includes(ENHANCEMENT_SWATCH_SUBJECT),
  'a modifier is not a subject, so the swatch must supply one',
)
assert.deepEqual(
  checkArtPromptContract({ prompt: swatch, engine: 'krea2', steps: 8, cfg: 1 }),
  [],
  'the swatch prompt must pass the art prompt contract',
)

// The comparison only works if the subject is identical across all 46 cards.
const other = buildFacetIdentityPrompt(
  facet({ id: 2, title: 'film grain', slug: 'film-grain' }),
  profile('PROMPT_ENHANCEMENT'),
)
assert.equal(
  swatch.replace('depth of field.', ''),
  other.replace('film grain.', ''),
  'every swatch must differ ONLY by the technique named',
)

// ── The tail, and the blast radius of changing it ───────────────────────────

const swatchFull = buildFacetVariantPrompt(
  facet(),
  profile('PROMPT_ENHANCEMENT'),
  swatch,
  { field: 'imagePath', composition: 'A square picture with the subject large and centred.' } as never,
)
assert.ok(
  !swatchFull.includes('Polished fantasy illustration'),
  'half this group is photographic; "fantasy illustration" fights the technique being shown',
)

// Every other taxonomy keeps the exact tail the 204 queued repairs were
// dry-run against. If this fails, a validated repair queue silently changed.
for (const taxonomy of ['GENRE', 'THEME', 'SETTING', 'OCCUPATION', 'ROLE', 'ARCHETYPE', 'ANIMAL', 'STYLE']) {
  const prompt = buildFacetVariantPrompt(
    facet({ title: 'Office Satire', slug: 'office-satire' }),
    profile(taxonomy),
    'Office Satire. A scene of this kind underway.',
    { field: 'imagePath', composition: 'A square picture with the subject large and centred.' } as never,
  )
  assert.ok(
    prompt.endsWith(
      'Polished fantasy illustration. Rich controlled lighting. Clean unmarked surfaces.',
    ),
    `${taxonomy} must keep the unchanged house tail`,
  )
}

// ── The kept swatches must actually be RE-RENDERED ──────────────────────────
//
// They fail the jargon test: v4 gave the pack the STYLE clause, which trips
// nothing in the contract. If repair selection asked only about jargon, all 46
// would keep their wrong art forever and this whole change would be a no-op on
// everything already in the catalog.
const v4StylePrompt =
  'film grain. Polished sample of the visual treatment, coherent medium, linework, palette, lighting, and surface detail.'
assert.equal(
  v4RenderNeedsRepair(
    facet({ title: 'film grain', slug: 'film-grain', artPrompt: v4StylePrompt }),
    'PROMPT_ENHANCEMENT',
  ),
  true,
  'a subject-less enhancement render must be resubmitted even though it trips no jargon rule',
)
// The same prompt shape under STYLE stays put: Cathedralpunk and 3D Render
// rendered correctly, because there the title IS the subject.
assert.equal(
  v4RenderNeedsRepair(
    facet({ title: 'Cathedralpunk', slug: 'cathedralpunk', artPrompt:
      'Cathedralpunk. Polished sample of the visual treatment, coherent medium, linework, palette, lighting, and surface detail.' }),
    'STYLE',
  ),
  false,
  'STYLE renders are correct and must not be re-rolled',
)
// A facet with prose of its own is still left alone, whatever its taxonomy.
assert.equal(
  v4RenderNeedsRepair(
    facet({ description: 'Visible silver-halide grain.', artPrompt: v4StylePrompt }),
    'PROMPT_ENHANCEMENT',
  ),
  false,
  'prose means the render had a real subject and is not this bug',
)

// A stored swatch prompt is GENERATED, and must be recognized as such. It lives
// in promptEnhancementPolicy.ts rather than the taxonomy tables, which is how it
// was missed once: buildFacetIdentityPrompt returns an unrecognized stored
// prompt verbatim, so the subject could be edited here forever without any
// render changing. The subject is the likeliest thing to need changing -- it is
// a bet that one pear and one marble can carry 46 techniques.
assert.ok(
  isLegacyGeneratedFacetPrompt(`film grain. ${ENHANCEMENT_SWATCH_SUBJECT}`),
  'a stored swatch prompt must be rebuildable, or the subject is frozen forever',
)
assert.equal(
  isLegacyGeneratedFacetPrompt(
    'A still life a painter set up herself, one pear and one marble she chose.',
  ),
  false,
  'curated prose that merely resembles the swatch stays curated',
)

// ── What the swatch scene has to contain ────────────────────────────────────
//
// v1 was correct and inert: it rendered fine and demonstrated almost nothing,
// because flat light, one distance, one material and no palette leave most of
// the 45 techniques with nothing to act on. These assert the properties the
// scene exists for, so a future simplification cannot quietly undo them.
const subject = ENHANCEMENT_SWATCH_SUBJECT.toLowerCase()
for (const [need, words] of [
  ['a light source in frame, for the twelve light and shadow techniques', ['lamp', 'flame', 'burning']],
  ['depth, for depth of field and bokeh', ['behind', 'back of', 'falls away']],
  ['a translucent organic surface, for subsurface scattering', ['pear']],
  ['glass, for refraction and ray tracing', ['glass', 'marble']],
  ['woven texture, for intricate patterning and luxurious textures', ['silk', 'embroidered', 'cloth']],
  ['a reflective plane, for cool and neon reflections', ['polished', 'reflection']],
  ['saturated colour, for the five colour techniques', ['peacock-blue', 'brass', 'spectrum']],
] as [string, string[]][]) {
  assert.ok(
    words.some((word) => subject.includes(word)),
    `the swatch scene must provide ${need}`,
  )
}
assert.ok(
  ENHANCEMENT_SWATCH_SUBJECT.split(/\s+/).length >= 40,
  'a scene thin enough to be short is a scene thin enough to demonstrate nothing',
)
assert.deepEqual(
  checkArtPromptContract({
    prompt: `volumetric light. ${ENHANCEMENT_SWATCH_SUBJECT}`,
    engine: 'krea2',
    steps: 8,
    cfg: 1,
  }),
  [],
  'the swatch scene must pass the prompt contract',
)

console.log('Prompt-enhancement swatch and retirement policy verified.')
