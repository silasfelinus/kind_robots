// Static contract for the public Facet Gallery surface.
//
// The gallery is a read-only, taxonomy-grouped showcase built on the canonical
// Facet catalog. It must source from facetCatalogStore.byTaxonomy, stay
// read-only, and keep artwork mutation in the Facet manager's shared ArtJob
// entity-art flow rather than exposing a second request backend here.
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

/*
 * Comments are stripped before every forbid- scan.
 *
 * A contract that a doc comment can fail is a contract that punishes explaining
 * it. This file already did that once: a comment in facet-gallery.vue naming the
 * very helpers this contract forbids -- so a reader would know why the picker
 * emits a selection instead of mutating anything -- failed the build, while the
 * forbidden call itself was nowhere in the file. Same class of bug as the
 * `role="log"` comment that tripped verifyNarrativeAccessibility.mjs.
 *
 * Only forbid- scans strip. requireText keeps reading the raw source, so a
 * required token cannot be satisfied by a comment claiming it is there.
 */
function stripComments(text: string): string {
  return text
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:'"`\\])\/\/[^\n]*/g, '$1')
}

function forbidText(path: string, text: string, fragment: string): void {
  if (stripComments(text).includes(fragment)) {
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

  const mountsGallery = text.content.includes(':facet-gallery')
  const redirectsToCanonicalGallery = text.content.includes('redirect: /facets')
  if (!mountsGallery && !redirectsToCanonicalGallery) {
    throw new Error(
      `${files.content} must mount :facet-gallery or redirect to the canonical /facets route`,
    )
  }

  process.stdout.write(
    'Facet gallery verified: read-only taxonomy showcase on the canonical catalog.\n',
  )
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
