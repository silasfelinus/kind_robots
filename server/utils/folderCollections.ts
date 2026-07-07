// /server/utils/folderCollections.ts
//
// Folder-based art collections: every image sitting in a slug's folder under
// public/images/ IS part of that slug's collection just by existing there
// (Silas, 2026-07-04). Conductor's image pipeline maintains a gallery.json
// manifest per folder and a master public/images/collections.json index
// (slug -> folder path) so the collection can be resolved on Vercel, where
// public/ lives on the CDN and the filesystem is not readable.
//
// Placement convention (Silas, 2026-07-05): the canonical home is nested,
// public/images/{context}/{slug}/ - context being the most relevant schema or
// project - with flat public/images/{slug}/ still valid as the degenerate
// case, and artcollections/{slug}/ as the legacy/unsorted fallback. Both the
// single-slug resolver and the enumeration below follow that order.
//
// Shared by GET /api/art/collection/folder/[slug], GET
// /api/art/collection/folders, and POST /api/art/collection/folder/[slug]/sync
// so all three agree on exactly what "the folder's images" means.
import { promises as fs } from 'node:fs'
import path from 'node:path'

const IMAGE_EXTENSIONS = new Set([
  '.webp',
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.svg',
])

export const SLUG_PATTERN = /^[a-z0-9][a-z0-9_-]*$/

export type FolderCollection = {
  slug: string
  images: string[]
}

export function isImageFile(name: string): boolean {
  const ext = name.toLowerCase().match(/\.[a-z0-9]+$/)?.[0] ?? ''
  return IMAGE_EXTENSIONS.has(ext)
}

// Containers that are not themselves a collection slug (they hold folders).
const NON_SLUG_DIRS = new Set(['images', 'artcollections'])

/**
 * Split an ArtImage's public URL into its folder collection {slug, subFolder}.
 * By the folder convention slug === the directory that holds the file (the leaf,
 * which is the collection's unique key); subFolder is everything before it under
 * public/images/ (null when top-level). Returns null when the image sits loose
 * in /images/ or the leaf isn't slug-shaped — callers fall back to "unsorted".
 *   /images/artcollections/sketchy/sketchy-card.webp -> { slug: "sketchy", subFolder: "artcollections" }
 *   /images/rewards/duct-tape/x.webp                 -> { slug: "duct-tape", subFolder: "rewards" }
 *   /images/art/collections/unsorted/x.webp          -> { slug: "unsorted", subFolder: "art/collections" }
 *   /images/comfy/comfy-1.webp                        -> { slug: "comfy", subFolder: null }
 *   /images/loose.webp                                -> null
 */
export function folderPathFromImageUrl(
  url: string | null | undefined,
): { slug: string; subFolder: string | null } | null {
  if (!url) return null
  const parts = url.split('?')[0]?.split('/').filter(Boolean) ?? []
  if (parts.length && /\.[a-z0-9]+$/i.test(parts[parts.length - 1] ?? '')) parts.pop()
  if (parts[0] === 'images') parts.shift() // drop the public URL prefix
  const slug = parts[parts.length - 1]
  if (!slug || NON_SLUG_DIRS.has(slug) || !SLUG_PATTERN.test(slug)) return null
  const parents = parts.slice(0, -1)
  return { slug, subFolder: parents.length ? parents.join('/') : null }
}

/** Just the slug from an image URL (see folderPathFromImageUrl). */
export function folderSlugFromImageUrl(url: string | null | undefined): string | null {
  return folderPathFromImageUrl(url)?.slug ?? null
}

async function listImages(
  folder: string,
  urlPrefix: string,
): Promise<string[] | null> {
  try {
    const entries = await fs.readdir(folder, { withFileTypes: true })
    const images = entries
      .filter((entry) => entry.isFile() && isImageFile(entry.name))
      .map((entry) => `${urlPrefix}/${entry.name}`)
      .sort()
    return images.length ? images : null
  } catch {
    return null
  }
}

async function imagesFromFilesystem(slug: string): Promise<string[] | null> {
  const imagesRoot = path.resolve(process.cwd(), 'public/images')

  // 1. Nested: public/images/{context}/{slug}/
  try {
    const contexts = await fs.readdir(imagesRoot, { withFileTypes: true })
    for (const ctx of contexts) {
      if (!ctx.isDirectory() || ctx.name === slug || ctx.name === 'artcollections')
        continue
      const nested = path.join(imagesRoot, ctx.name, slug)
      const images = await listImages(nested, `/images/${ctx.name}/${slug}`)
      if (images) return images
    }
  } catch {
    return null // images root unreadable: CDN mode, use manifests
  }

  // 2. Flat: public/images/{slug}/
  const flat = await listImages(path.join(imagesRoot, slug), `/images/${slug}`)
  if (flat) return flat

  // 3. Legacy/unsorted: public/images/artcollections/{slug}/
  return listImages(
    path.join(imagesRoot, 'artcollections', slug),
    `/images/artcollections/${slug}`,
  )
}

async function fetchJson(url: string): Promise<unknown | null> {
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

function stemsToUrls(stems: unknown, urlPrefix: string): string[] | null {
  if (!Array.isArray(stems)) return null
  const urls = stems
    .filter((stem): stem is string => typeof stem === 'string' && stem.length > 0)
    .map((stem) =>
      isImageFile(stem) ? `${urlPrefix}/${stem}` : `${urlPrefix}/${stem}.webp`,
    )
    .sort()
  return urls.length ? urls : null
}

async function imagesFromManifest(
  slug: string,
  origin: string,
): Promise<string[] | null> {
  // 1. Master index: public/images/collections.json -> { [slug]: "context/slug" | "slug" }
  const index = await readCollectionsIndex(origin)
  const folder = index[slug]
  if (typeof folder === 'string' && /^[a-z0-9][a-z0-9_/-]*$/.test(folder)) {
    const stems = await fetchJson(`${origin}/images/${folder}/gallery.json`)
    const urls = stemsToUrls(stems, `/images/${folder}`)
    if (urls) return urls
  }

  // 2. Flat per-folder manifest (pre-index deployments)
  const flat = stemsToUrls(
    await fetchJson(`${origin}/images/${slug}/gallery.json`),
    `/images/${slug}`,
  )
  if (flat) return flat

  // 3. Legacy artcollections manifest
  return stemsToUrls(
    await fetchJson(`${origin}/images/artcollections/${slug}/gallery.json`),
    `/images/artcollections/${slug}`,
  )
}

/**
 * Read the master slug -> folder index. Prefers the local filesystem (dev),
 * falls back to fetching the CDN copy (Vercel). Returns {} when neither is
 * available so callers can degrade gracefully.
 */
async function readCollectionsIndex(
  origin: string,
): Promise<Record<string, string>> {
  const local = path.resolve(process.cwd(), 'public/images/collections.json')
  try {
    const raw = await fs.readFile(local, 'utf8')
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, string>
    }
  } catch {
    // not on disk (CDN mode) - fall through to HTTP
  }

  const remote = await fetchJson(`${origin}/images/collections.json`)
  if (remote && typeof remote === 'object' && !Array.isArray(remote)) {
    return remote as Record<string, string>
  }
  return {}
}

/**
 * Resolve every image URL belonging to a slug's folder collection. Filesystem
 * first (dev), master index + per-folder manifest second (CDN). Returns null
 * when no folder collection exists for the slug.
 */
export async function resolveFolderImages(
  slug: string,
  origin: string,
): Promise<string[] | null> {
  const fromDisk = await imagesFromFilesystem(slug)
  if (fromDisk !== null) return fromDisk
  return imagesFromManifest(slug, origin)
}

/**
 * Enumerate every folder slug the site can see WITHOUT resolving its images.
 * Cheap: one master-index read plus a dev filesystem scan. Callers that need
 * images resolve them per-slug (so large sites can page instead of resolving
 * every folder's manifest in one shot — which times out on serverless).
 */
export async function listFolderSlugs(origin: string): Promise<string[]> {
  const slugs = new Set<string>()

  const index = await readCollectionsIndex(origin)
  for (const key of Object.keys(index)) {
    if (SLUG_PATTERN.test(key)) slugs.add(key)
  }

  // Dev fallback: pick up folders that hold images but aren't indexed yet.
  const imagesRoot = path.resolve(process.cwd(), 'public/images')
  try {
    const contexts = await fs.readdir(imagesRoot, { withFileTypes: true })
    for (const ctx of contexts) {
      if (!ctx.isDirectory()) continue
      if (ctx.name === 'artcollections') {
        // legacy: artcollections/{slug}/
        await addChildDirsAsSlugs(path.join(imagesRoot, ctx.name), slugs)
        continue
      }
      // flat: {slug}/ (only if it directly holds images)
      if (SLUG_PATTERN.test(ctx.name)) {
        const direct = await listImages(path.join(imagesRoot, ctx.name), '')
        if (direct) slugs.add(ctx.name)
      }
      // nested: {context}/{slug}/
      await addChildDirsAsSlugs(path.join(imagesRoot, ctx.name), slugs)
    }
  } catch {
    // images root unreadable (CDN mode): the index above is all we have.
  }

  return [...slugs].sort()
}

/**
 * Enumerate every folder collection the site can see, WITH resolved image URLs.
 * Slugs come from listFolderSlugs; each folder's images are resolved from the
 * filesystem (dev) or master index + manifest (CDN). Note: this resolves every
 * folder's manifest, so it is O(folders) network calls — fine for listing, but
 * bulk mutations should page over listFolderSlugs instead.
 */
export async function listFolderCollections(
  origin: string,
): Promise<FolderCollection[]> {
  const slugs = await listFolderSlugs(origin)

  const collections: FolderCollection[] = []
  for (const slug of slugs) {
    const images = await resolveFolderImages(slug, origin)
    if (images && images.length) collections.push({ slug, images })
  }
  return collections
}

async function addChildDirsAsSlugs(dir: string, slugs: Set<string>) {
  try {
    const children = await fs.readdir(dir, { withFileTypes: true })
    for (const child of children) {
      if (child.isDirectory() && SLUG_PATTERN.test(child.name)) {
        slugs.add(child.name)
      }
    }
  } catch {
    // not a directory / unreadable - ignore
  }
}
