// /utils/promptEnhancementPolicy.ts
//
// PROMPT_ENHANCEMENT Facets are the "✨ Make Pretty Enhancements" pack: prompt
// FRAGMENTS, appended last to a composed prompt (artFacetPrompt.ts gives the
// taxonomy priority 90, "where diffusion models weight them best"). None of
// them carries a description, so the Facet art producer had only the title to
// work with and every one of them rendered as an unrelated picture -- "4k
// render" came back as two anime women in gold-trimmed armour.
//
// The pack splits in two, and the split is the whole policy (Silas, 2026-09-15:
// "If they are useless, kill them. The others do the swatch branch"):
//
//   RETIRED -- a quality incantation with no depictable content. There is no
//   image of "masterpiece"; any render is an arbitrary picture wearing a label.
//   These are cargo-cult in the PROMPT too, not only in the picker, which is
//   why they are withdrawn from the randomizer rather than just left unpainted.
//   facetCatalogAudit already flagged three of them as prompt-cargo-cult ->
//   suppress-random; this is that hint, applied, to the whole group.
//
//   SWATCH -- a real visual technique. "depth of field", "subsurface
//   scattering" and "oil on canvas effect" can all be shown; they just cannot
//   be shown in the abstract. They get a demonstration swatch instead: one
//   fixed subject, rendered with that technique, so the technique is the only
//   thing that varies across the 46 cards and the picker becomes a comparison
//   rather than a gallery of unrelated art.
//
// Titles are matched case-insensitively and by slug, so a curation pass that
// re-cases a title does not silently un-retire it.

/**
 * Quality incantations with nothing to depict. Withdrawn from the randomizer
 * and from art, never hard-deleted: RewardFacet links, ArtImage facet
 * snapshots, and saved Builder sheets still reference these rows, and deleting
 * them would orphan that history to save nothing.
 */
export const RETIRED_PROMPT_ENHANCEMENT_SLUGS = [
  '4k-render',
  'award-winning',
  'award-winning-concept-art',
  'gallery-worthy',
  'illustration-quality',
  'masterpiece',
  'maximum-detail',
  'perfect-anatomy',
  'perfect-resolution',
  'post-processed-magic',
  'rendered-in-unreal-engine',
  'trending-on-artstation',
  'unreal-clarity',
] as const

/** Same rows by title, for records whose slug is null or hand-edited. */
export const RETIRED_PROMPT_ENHANCEMENT_TITLES = [
  '4k render',
  'award-winning',
  'award-winning concept art',
  'gallery-worthy',
  'illustration quality',
  'masterpiece',
  'maximum detail',
  'perfect anatomy',
  'perfect resolution',
  'post-processed magic',
  'rendered in Unreal Engine',
  'trending on ArtStation',
  'unreal clarity',
] as const

const retiredSlugs = new Set<string>(RETIRED_PROMPT_ENHANCEMENT_SLUGS)
const retiredTitles = new Set<string>(
  RETIRED_PROMPT_ENHANCEMENT_TITLES.map((title) => title.toLowerCase()),
)

/**
 * True for a prompt-modifier Facet that depicts nothing. The producer refuses
 * to queue art for these and the retirement script withdraws them; both ask
 * here so they can never disagree about which rows are in the group.
 */
export function isRetiredPromptEnhancement(facet: {
  slug?: string | null
  title?: string | null
}): boolean {
  const slug = String(facet.slug || '').trim().toLowerCase()
  if (slug && retiredSlugs.has(slug)) return true
  const title = String(facet.title || '').trim().toLowerCase()
  return Boolean(title) && retiredTitles.has(title)
}

/**
 * The fixed subject every enhancement swatch renders.
 *
 * v1 was "one ripe pear and one clear glass marble on a bare wooden table, a
 * plain pale wall behind them". It held the subject still, which is the point,
 * and it rendered correctly -- but it gave most of the 45 techniques nothing to
 * act on. Flat even light and a blank wall mean "dramatic shadows", "precise
 * rim light", "volumetric light" and "warm highlights" have no source to key
 * off; two objects at the same distance leave "depth of field" and "bokeh
 * background" almost nothing to separate; one matte skin and one glass ball
 * cannot show "gilded shimmer", "luxurious textures" or "intricate patterning";
 * and nothing in frame is saturated, so the five colour techniques have no
 * palette to grade. Side by side the cards differed. At card size they were 45
 * pictures of a pear.
 *
 * v2 is built backwards from what the 45 actually have to demonstrate:
 *
 *   a burning lamp IN FRAME       -> the twelve light and shadow techniques get
 *                                    a real source, a direction, and a falloff
 *   a dark room receding behind   -> depth of field, bokeh, moody atmosphere
 *   pear / glass / gilt / silk    -> subsurface, refraction, specular metal,
 *                                    woven texture: four surfaces that answer
 *                                    light differently in the same frame
 *   a spectrum cast by the marble -> prismatic and holographic glow, and a
 *                                    caustic is the thing ray tracing is FOR
 *   polished tabletop             -> cool reflections, neon reflections
 *   peacock blue against warm gilt-> a real palette for the colour five
 *
 * Still one scene, still identical across all 45, because the comparison is
 * the entire value: the technique has to be the only variable. The weakest
 * coverage is the four composition techniques -- "epic scene composition" on a
 * tabletop will always be a stretch -- and that is a known limit, not an
 * oversight.
 *
 * Changing this re-renders all 45. ENHANCEMENT_SWATCH_SUBJECTS keeps every
 * previous wording so a stored prompt written by an older version is still
 * recognized as generator output and gets rebuilt; drop one and that cohort
 * freezes forever with no error.
 */
export const ENHANCEMENT_SWATCH_SUBJECT =
  'A small brass oil lamp burning at the back of a dark polished table, its light reaching across a ripe pear, a clear glass marble, and a folded length of peacock-blue embroidered silk; the marble casts a thin band of spectrum onto the cloth, the tabletop holds a soft reflection of the flame, and the room behind falls away into shadow.'

/** Every swatch subject this producer has ever emitted, newest first. */
export const ENHANCEMENT_SWATCH_SUBJECTS: readonly string[] = [
  ENHANCEMENT_SWATCH_SUBJECT,
  // v1, 2026-09-15. Correct but inert: nothing in it for most of the 45.
  'A still life of one ripe pear and one clear glass marble on a bare wooden table, a plain pale wall behind them.',
]

/** True for a swatch prompt written by this or any earlier subject. */
export function isEnhancementSwatchPrompt(prompt: string): boolean {
  return ENHANCEMENT_SWATCH_SUBJECTS.some((subject) => prompt.endsWith(subject))
}
