// /server/api/art/collection/folder/[slug].get.ts
//
// Folder-based art collection: every image in public/images/{slug}/ is part of
// that slug's collection just by existing there. Conductor's image pipeline
// drops inspiration files into these folders ({slug}-inspiration-{n}.webp) and
// keeps a gallery.json manifest alongside them, which serves as the fallback
// when the filesystem isn't readable (e.g. on Vercel, where public/ assets are
// served from the CDN rather than bundled with the server).
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { defineEventHandler, getRouterParam, getRequestURL, createError } from 'h3'
import { errorHandler } from '~/server/utils/error'

const IMAGE_EXTENSIONS = new Set(['.webp', '.png', '.jpg', '.jpeg', '.gif', '.svg'])

function isImageFile(name: string): boolean {
  const ext = name.toLowerCase().match(/\.[a-z0-9]+$/)?.[0] ?? ''
  return IMAGE_EXTENSIONS.has(ext)
}

async function imagesFromFilesystem(slug: string): Promise<string[] | null> {
  const folder = path.resolve(process.cwd(), 'public/images', slug)
  try {
    const entries = await fs.readdir(folder, { withFileTypes: true })
    return entries
      .filter((entry) => entry.isFile() && isImageFile(entry.name))
      .map((entry) => `/images/${slug}/${entry.name}`)
      .sort()
  } catch {
    return null
  }
}

async function imagesFromManifest(slug: string, origin: string): Promise<string[] | null> {
  try {
    const res = await fetch(`${origin}/images/${slug}/gallery.json`)
    if (!res.ok) return null
    const stems = (await res.json()) as unknown
    if (!Array.isArray(stems)) return null
    return stems
      .filter((stem): stem is string => typeof stem === 'string' && stem.length > 0)
      .map((stem) => `/images/${slug}/${stem}.webp`)
      .sort()
  } catch {
    return null
  }
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
