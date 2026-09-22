// /utils/scripts/verifyLoraCategoryProvenance.test.ts
//
// A category is only as trustworthy as whatever produced it, so the grid that
// reviews categories has to be able to see that. The 2026-09-22 sweep made the
// spread concrete: CHARACTER and STYLE came off Civitai tags and sampled clean
// across 1,231 rows, while CREATURE and OBJECT came off title keywords and are
// roughly half wrong. Same column, wildly different trust.
//
// `loraCategorySource` carries that, and it has to ride the LIST select --
// /api/resources, the one whole-catalog fetch the triage grid loads from. It
// did not, while resourceGalleryStore.loadResources() typed that response as
// ResourceGalleryRecord, which DOES declare the field. So every
// `resource.loraCategorySource` in client code typechecked and arrived
// undefined, and loraTriageStore.suggestCategories() guards human decisions
// with `canReclassify(resource.loraCategorySource)` -- which, undefined not
// being HUMAN, always said yes. Shadowed today by the check one line above it,
// live the moment anyone re-suggests over already-categorised rows.
//
// A type that promises a field the endpoint never sends cannot fail loudly, so
// this asserts the two selects agree about it instead.
import assert from 'node:assert/strict'
import {
  resourceGallerySelect,
  resourceListSelect,
} from '../../server/api/resources/gallery'
import {
  LORA_CATEGORY_SOURCES,
  normalizeLoraCategorySource,
} from '../loraCategory'

// The list select is what /api/resources returns and what the triage grid reads.
assert.equal(
  (resourceListSelect as Record<string, unknown>).loraCategory,
  true,
  'resourceListSelect must carry loraCategory; the grid filters and badges on it.',
)
assert.equal(
  (resourceListSelect as Record<string, unknown>).loraCategorySource,
  true,
  'resourceListSelect must carry loraCategorySource. Without it the client cannot tell a Civitai tag from a title guess, and canReclassify() silently stops protecting human decisions.',
)

// Both selects are typed ResourceGalleryRecord by the store, so a field on one
// and not the other is the exact shape of the bug above.
for (const field of ['loraCategory', 'loraCategorySource'] as const) {
  assert.equal(
    (resourceGallerySelect as Record<string, unknown>)[field],
    (resourceListSelect as Record<string, unknown>)[field],
    `resourceGallerySelect and resourceListSelect disagree about ${field}; loadResources() types /api/resources as ResourceGalleryRecord, so any gap there is a field that typechecks and never arrives.`,
  )
}

// The three sources the badge renders. A new one added to the enum without a
// label would render as "unknown" on every card carrying it.
assert.deepEqual(
  [...LORA_CATEGORY_SOURCES].sort(),
  ['CIVITAI', 'HEURISTIC', 'HUMAN'],
  'lora-triage.vue maps each source to a label, a hint and a badge colour; a new source needs all three.',
)
assert.equal(normalizeLoraCategorySource(undefined), null)
assert.equal(
  normalizeLoraCategorySource('human'),
  'HUMAN',
  'Normalisation must be case-insensitive: the filter compares against the stored value.',
)

console.log('verifyLoraCategoryProvenance: ok')
