// /server/api/art/collection/folder/[slug].get.ts
//
// Folder-based art collection: every image in a slug's folder is part of
// that slug's collection just by existing there. Conductor's image pipeline
// maintains a gallery.json manifest per folder and a master
// public/images/collections.json index (slug -> folder path).
//
// Placement convention (Silas, 2026-07-05): the canonical home is nested,
// public/images/{context}/{slug}/ - context being the most relevant schema
// or project - with flat public/images/{slug}/ still valid as the
// degenerate case, and artcollections/{slug}/ as the legacy/unsorted
// fallback. Resolution order here follows that: nested -> flat ->
// artcollections. Filesystem is used when readable (dev); on Vercel the
// public/ assets live on the CDN, so resolution falls back to the master
// index + per-folder manifests over HTTP.
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { defineEventHandler, getRouterParam, getRequestURL, createError } from 'h3'
import { errorHandler } from '~/server/utils/error'

const IMAGE_EXTENSIONS = new Set(['.webp', '.png', '.jpg', '.jpeg', '.gif', '.svg'])

function isImageFile(name: string): boolean {
  const ext = name.toLowerCase().match(/\.[a-z0-9]+$/)?.[0] ?? ''
  return IMAGE_EXTENSIONS.has(ext)
}

async function listImages(folder: string, urlPrefix: string): Promise<string[] | null> {
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
      if (!ctx.isDirectory() || ctx.name === slug || ctx.name === 'artcollections') continue
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
    .map((stem) => (isImageFile(stem) ? `${urlPrefix}/${stem}` : `${urlPrefix}/${stem}.webp`))
    .sort()
  return urls.length ? urls : null
}

async function imagesFromManifest(slug: string, origin: string): Promise<string[] | null> {
  // 1. Master index: public/images/collections.json -> { [slug]: "context/slug" | "slug" }
  const index = await fetchJson(`${origin}/images/collections.json`)
  if (index && typeof index === 'object' && !Array.isArray(index)) {
    const folder = (index as Record<string, unknown>)[slug]
    if (typeof folder === 'string' && /^[a-z0-9][a-z0-9_/-]*$/.test(folder)) {
      const stems = await fetchJson(`${origin}/images/${folder}/gallery.json`)
      const urls = stemsToUrls(stems, `/images/${folder}`)
      if (urls) return urls
    }
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

export default defineEventHandler(async (event) => {
  try {
    const slug = String(getRouterParam(event, 'slug') || '').trim().toLowerCase()

    if (!/^[a-z0-9][a-z0-9_-]*$/.test(slug)) {
      throw createError({ statusCode: 400, message: 'Invalid collection slug.' })
    }

    let images = await imagesFromFilesystem(slug)

    if (images === null) {
      const origin = getRequestURL(event).origin
      images = await imagesFromManifest(slug, origin)
    }

    if (images === null) {
      throw createError({
        statusCode: 404,
        message: `No folder collection found for "${slug}".`,
      })
    }

    return {
      success: true,
      message: `Folder collection for ${slug}.`,
      data: { slug, images },
      statusCode: 200,
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    const statusCode = handled.statusCode || 500

    event.node.res.statusCode = statusCode

    return {
      success: false,
      message: handled.message || 'Failed to load folder collection.',
      statusCode,
    }
  }
})
