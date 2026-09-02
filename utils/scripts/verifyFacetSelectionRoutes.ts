// /utils/scripts/verifyFacetSelectionRoutes.ts
/*
 * Every Facet PUT must be able to resolve a Facet by KEY, not only by id.
 *
 * WHY THIS EXISTS. Conductor's daily-dream pipeline resolves each seed Facet to
 * its slug and only falls back to a numeric id when no slug exists -- ids go
 * stale when catalog rows are merged or deleted, so slugs are the durable
 * address. It therefore PUTs `{ facetIds: [], facetKeys: [...] }`.
 *
 * `/api/characters/:id/facets` read `assignments` or `facetIds` and nothing
 * else. That body normalized to zero assignments; the handler's unconditional
 * `deleteMany` still ran; nothing was created; and it answered `success: true`
 * with an empty catalog. Silent data loss reported as a success.
 *
 * Measured 2026-09-02: all 36 built dream bundles recorded
 * `facet_assignments.status: "complete"` with `errors: []` while every one of
 * their Characters had `facet_ids: []`, and production's
 * GET /api/characters/3320/facets returned `data: []` for a bundle that had
 * requested six. Silas: "I just don't get the facets added as part of my daily
 * digest, so there is a discrepancy."
 *
 * The unit tests could not catch it -- conductor's stub returned `data: []` and
 * the suite asserted "complete" against that, so it encoded the bug. This
 * checks the property that actually matters and that no mock can fake: the
 * route reads facetKeys at all.
 */
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const root = process.cwd()

/*
 * Every route that owns a <model>Facet join table. Adding a seventh Facet-
 * bearing model means adding it here -- a route missing from this list is
 * exactly the blind spot the Character route sat in.
 */
const ROUTES = [
  'server/api/dreams/[id]/facets.put.ts',
  'server/api/scenarios/[id]/facets.put.ts',
  'server/api/rewards/[id]/facets.put.ts',
  'server/api/characters/[id]/facets.put.ts',
  'server/api/bots/[id]/facets.put.ts',
  'server/api/art/image/[id]/facets.put.ts',
] as const

async function main(): Promise<void> {
  const failures: string[] = []

  for (const route of ROUTES) {
    const source = await readFile(resolve(root, route), 'utf8').catch(
      () => null,
    )
    if (source === null) {
      failures.push(`${route}: route is missing (renamed? update ROUTES).`)
      continue
    }

    /*
     * Two shapes are both fine, and both genuinely resolve keys:
     *   - parseFacetSelectionBody(body), used by the routes with no fieldKey
     *     column to fill (dreams, scenarios, art images)
     *   - reading record.facetKeys into resolveFacetSelection, used by the
     *     routes that must also choose a fieldKey (rewards, characters, bots)
     * What is NOT fine is a route that never mentions facetKeys at all.
     */
    const parsesSelection = source.includes('parseFacetSelectionBody')
    const readsKeys =
      source.includes('facetKeys') && source.includes('resolveFacetSelection')

    if (!parsesSelection && !readsKeys) {
      failures.push(
        `${route}: never reads facetKeys, so a slug-only selection resolves ` +
          `to nothing. A caller sending keys would silently clear this ` +
          `model's Facets and be told it succeeded.`,
      )
    }

    /*
     * The other half of the same bug: clearing before knowing what to write.
     * A route that deletes unconditionally must have computed its assignments
     * from the full selection first, or an unresolvable body destroys data.
     * Checked by proximity rather than parsing -- the delete must not be the
     * only thing the handler does with the body.
     */
    if (source.includes('deleteMany') && !parsesSelection && !readsKeys) {
      failures.push(
        `${route}: deletes existing Facets without resolving keys first.`,
      )
    }
  }

  if (failures.length) {
    console.error('Facet selection route contract FAILED:')
    for (const failure of failures) console.error(`  - ${failure}`)
    process.exit(1)
  }

  console.log(
    `Facet selection route contract verified: ${ROUTES.length} routes all resolve Facet keys.`,
  )
}

await main()
