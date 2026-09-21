// Static contract for the public Facet Gallery surface.
//
// The gallery is a read-only, taxonomy-grouped showcase built on the canonical
// Facet catalog. It must source from facetCatalogStore.byTaxonomy, stay
// read-only, and keep artwork mutation in the Facet manager's shared ArtJob
// entity-art flow rather than exposing a second request backend here.
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { containsCode } from './lib/sourceText'

const root = process.cwd()

async function source(path: string): Promise<string> {
  return readFile(resolve(root, path), 'utf8')
}

function requireText(path: string, text: string, fragment: string): void {
  if (!text.includes(fragment)) {
    throw new Error(
      `${path} is missing Facet gallery contract text: ${fragment}`,
    )
  }
}

function forbidText(path: string, text: string, fragment: string): void {
  if (containsCode(text, fragment)) {
    throw new Error(
      `${path} contains forbidden Facet gallery text: ${fragment}`,
    )
  }
}

async function main(): Promise<void> {
  // content/facet-gallery.md is gone. It was a `redirect: /facets` stub kept
  // from when facet-gallery.vue had no route of its own; /facets now reaches
  // the gallery through facet-manager -> facet-interact, so the stub was a
  // second front door for one object and verifyRouteGalleryContract.ts's
  // Rule 2 exists to forbid exactly that. Silas, 2026-08-06: "that
  // facet-gallery endpoint was specifically marked for deletion ... we are in
  // alpha, I'm the only user, and we are not preserving stale routes just in
  // case someone bookmarked it."
  const files = {
    gallery: 'components/facets/facet-gallery.vue',
    page: 'content/facets.md',
    channelTab: 'content/channels/play/facets.md',
  } as const

  const text = Object.fromEntries(
    await Promise.all(
      Object.entries(files).map(
        async ([key, path]) => [key, await source(path)] as const,
      ),
    ),
  ) as Record<keyof typeof files, string>

  requireText(files.gallery, text.gallery, 'useFacetCatalogStore')
  requireText(files.gallery, text.gallery, 'FACET_TAXONOMIES')

  /*
   * TAXONOMY FIRST (2026-09-21). `byTaxonomy` used to be required here, and it
   * meant one specific thing: load the whole catalog, then group it in the
   * browser. That is what this file was written to pin, and it is exactly what
   * Silas asked to stop doing -- "wouldn't it be better to be getting the types
   * first, then loading the appropriate collection when a user selects to move
   * down a level?" -- after 1,736 rows and 1,717 cards in one scroll made the
   * gallery unusable on a phone.
   *
   * The intent the old assertion protected is unchanged and still pinned: the
   * gallery sources from the canonical catalog and nothing else. What it now
   * reads is the taxonomy index and one slice at a time.
   */
  requireText(files.gallery, text.gallery, '/api/facets/taxonomies')
  requireText(files.gallery, text.gallery, 'fetchCatalogSlice')
  forbidText(files.gallery, text.gallery, 'byTaxonomy')

  /*
   * A slice must never be assigned to the shared store. fetchCatalog replaces
   * `entries` wholesale, so a narrowed call would leave the builder decks,
   * facetForValue and the random pickers holding one taxonomy and believing it
   * to be the catalog.
   */
  forbidText(files.gallery, text.gallery, 'catalog.fetchCatalog(')

  // /facets has two pieces of navigation metadata: its page document and the
  // Play channel tab that resolves that route. The channel-tab value wins when
  // pageStore builds the dashboard shell, so both must point at the gallery.
  // A stale `dashboardTab: library` here made the admin count/create panel the
  // apparent Facets landing page even though the page and dashboard defaults
  // both said gallery.
  requireText(files.page, text.page, 'dashboardTab: gallery')
  requireText(files.channelTab, text.channelTab, 'dashboardTab: gallery')

  forbidText(files.gallery, text.gallery, 'useFacetArtRequestStore')
  forbidText(files.gallery, text.gallery, 'requestPrimaryArtwork')
  forbidText(files.gallery, text.gallery, 'canRequestArt')

  for (const mutation of [
    'createFacet',
    'updateFacet',
    'archiveFacet',
    'FacetProfileEditor',
  ]) {
    forbidText(files.gallery, text.gallery, mutation)
  }

  process.stdout.write(
    'Facet gallery verified: read-only taxonomy showcase on the canonical catalog.\n',
  )
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
