// Static contract for the public Facet Gallery surface.
//
// The gallery is a read-only, taxonomy-grouped showcase built on the canonical
// Facet catalog. It must source from facetCatalogStore.byTaxonomy, stay
// read-only, and gate any art-request affordance behind admin + the shared
// facetArtRequestStore rather than inventing a new request path.
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const root = process.cwd()

async function source(path: string): Promise<string> {
  return readFile(resolve(root, path), 'utf8')
}

function requireText(path: string, text: string, fragment: string): void {
  if (!text.includes(fragment)) {
    throw new Error(`${path} is missing Facet gallery contract text: ${fragment}`)
  }
}

function forbidText(path: string, text: string, fragment: string): void {
  if (text.includes(fragment)) {
    throw new Error(`${path} contains forbidden Facet gallery text: ${fragment}`)
  }
}

async function main(): Promise<void> {
  const files = {
    gallery: 'components/facets/facet-gallery.vue',
    content: 'content/facet-gallery.md',
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

  requireText(files.gallery, text.gallery, 'useFacetArtRequestStore')
  requireText(files.gallery, text.gallery, 'requestPrimaryArtwork')
  requireText(files.gallery, text.gallery, 'canRequestArt')
  requireText(files.gallery, text.gallery, 'userStore.isAdmin')

  for (const mutation of [
    'createFacet',
    'updateFacet',
    'archiveFacet',
    'FacetProfileEditor',
  ]) {
    forbidText(files.gallery, text.gallery, mutation)
  }

  const mountsGallery = text.content.includes(':facet-gallery')
  const redirectsToCanonicalGallery = text.content.includes('redirect: /facets')
  if (!mountsGallery && !redirectsToCanonicalGallery) {
    throw new Error(
      `${files.content} must mount :facet-gallery or redirect to the canonical /facets route`,
    )
  }

  process.stdout.write(
    'Facet gallery verified: read-only taxonomy showcase on the canonical catalog with admin-gated art requests.\n',
  )
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
