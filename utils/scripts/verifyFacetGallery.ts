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
  } as const

  const text = Object.fromEntries(
    await Promise.all(
      Object.entries(files).map(
        async ([key, path]) => [key, await source(path)] as const,
      ),
    ),
  ) as Record<keyof typeof files, string>

  requireText(files.gallery, text.gallery, 'useFacetCatalogStore')
  requireText(files.gallery, text.gallery, 'byTaxonomy')
  requireText(files.gallery, text.gallery, 'FACET_TAXONOMIES')

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
