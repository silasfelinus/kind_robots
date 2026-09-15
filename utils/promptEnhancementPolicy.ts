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
 * Chosen so one frame can carry every technique in the kept group: an organic
 * surface for subsurface scattering and soft light, glass for refraction and
 * ray tracing, two objects at different depths for depth of field and bokeh,
 * and a plain wall for the "clean background" family. Concrete nouns only --
 * no art-direction vocabulary, no negation, no format words. See
 * server/utils/artPromptContract.ts for why that matters.
 *
 * It is deliberately CONSTANT. The comparison only works if the subject never
 * moves, so changing this string re-rolls the meaning of all 46 cards.
 */
export const ENHANCEMENT_SWATCH_SUBJECT =
  'A still life of one ripe pear and one clear glass marble on a bare wooden table, a plain pale wall behind them.'
