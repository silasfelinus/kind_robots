// /server/api/art/collection/assign-orphans.post.ts
//
// Reverse parity, phase 1 (DB-only, Vercel-safe): give every ArtImage that has
// NO collection a home. For each orphan we derive its collection from its image
// path (folder === slug, the folder convention); when the path doesn't imply a
// folder, we file it under a per-user "unsorted-u{userId}" collection so nothing
// stays homeless. Complements the folders sync (files -> rows); this is rows ->
// a collection.
//
// Bounded by an id cursor so it can't hit the serverless time limit: syncs a
// page and returns nextCursor; the caller loops until done. Machine-auth,
// idempotent (only touches images that currently have zero collections).
//
// Note: this assigns COLLECTIONS only. Materializing missing files, PNG->WebP
// conversion, and thumbnails happen in the relay-side phase 2 job (the app
// filesystem is read-only on Vercel).
import { defineEventHandler, getRequestURL, readBody } from 'h3'
import prisma from '~/server/utils/prisma'
import { errorHandler } from '~/server/utils/error'
import { requireMachineUser } from '~/server/utils/authGuard'
import { folderPathFromImageUrl } from '~/server/utils/folderCollections'

const DEFAULT_LIMIT = 200
const MAX_LIMIT = 1000

function clampInt(value: unknown, fallback: number, min: number, max: number): number {
  const n = Number(value)
  if (!Number.isFinite(n)) return fallback
  return Math.min(max, Math.max(min, Math.trunc(n)))
}

function labelFromSlug(slug: string): string {
  return slug
    .split(/[-_]/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireMachineUser(event)
    getRequestURL(event) // (parity with sibling routes; origin not needed here)

    const body = (await readBody(event).catch(() => ({}))) as {
      limit?: unknown
      cursorId?: unknown
    }
    const limit = clampInt(body?.limit, DEFAULT_LIMIT, 1, MAX_LIMIT)
    const cursorId = clampInt(body?.cursorId, 0, 0, Number.MAX_SAFE_INTEGER)

    // Page over collection-less images by ascending id (stable cursor).
    const orphans = await prisma.artImage.findMany({
      where: {
        ArtCollections: { none: {} },
        ...(cursorId ? { id: { gt: cursorId } } : {}),
      },
      select: { id: true, imagePath: true, path: true, userId: true },
      orderBy: { id: 'asc' },
      take: limit,
    })

    if (orphans.length === 0) {
      return {
        success: true,
        message: 'No collection-less ArtImages remain.',
        data: { processed: 0, assigned: 0, derived: 0, unsorted: 0, createdCollections: 0, nextCursor: null, done: true },
        statusCode: 200,
      }
    }

    // Decide each orphan's target slug: derived from its path, else per-user unsorted.
    const bySlug = new Map<string, number[]>()
    const subFolderBySlug = new Map<string, string | null>()
    let derived = 0
    let unsorted = 0
    for (const img of orphans) {
      const parsed = folderPathFromImageUrl(img.imagePath || img.path)
      const slug = parsed?.slug ?? `unsorted-u${img.userId ?? 10}`
      if (parsed) derived += 1
      else unsorted += 1
      if (!subFolderBySlug.has(slug)) subFolderBySlug.set(slug, parsed?.subFolder ?? null)
      const list = bySlug.get(slug)
      if (list) list.push(img.id)
      else bySlug.set(slug, [img.id])
    }

    // Ensure every target collection exists (create the missing ones).
    const targetSlugs = [...bySlug.keys()]
    const existing = await prisma.artCollection.findMany({
      where: { slug: { in: targetSlugs } },
      select: { id: true, slug: true },
    })
    const existingSlugs = new Set(existing.map((c) => c.slug))
    const missing = targetSlugs.filter((s) => !existingSlugs.has(s))

    if (missing.length > 0) {
      await prisma.artCollection.createMany({
        data: missing.map((slug) => {
          const subFolder = subFolderBySlug.get(slug) ?? null
          return {
            slug,
            label: slug.startsWith('unsorted-u') ? 'Unsorted' : labelFromSlug(slug),
            description: slug.startsWith('unsorted-u')
              ? 'Images not yet filed into a folder collection.'
              : `Folder collection (${slug}).`,
            userId: auth.user.id,
            isPublic: true,
            ...(subFolder ? { subFolder } : {}),
          }
        }),
        skipDuplicates: true,
      })
    }

    // Re-read to get every target collection's id (created + pre-existing).
    const collections = await prisma.artCollection.findMany({
      where: { slug: { in: targetSlugs } },
      select: { id: true, slug: true },
    })
    const idBySlug = new Map(collections.map((c) => [c.slug, c.id]))

    // Connect each group of images to its collection (one write per collection).
    let assigned = 0
    for (const [slug, ids] of bySlug) {
      const collectionId = idBySlug.get(slug)
      if (!collectionId) continue
      await prisma.artCollection.update({
        where: { id: collectionId },
        data: { ArtImages: { connect: ids.map((id) => ({ id })) } },
      })
      assigned += ids.length
    }

    const nextCursor = orphans[orphans.length - 1]?.id ?? null
    const done = orphans.length < limit

    return {
      success: true,
      message: `Assigned ${assigned} image(s) (${derived} by path, ${unsorted} to unsorted), ${missing.length} new collection(s).${done ? ' Done.' : ''}`,
      data: {
        processed: orphans.length,
        assigned,
        derived,
        unsorted,
        createdCollections: missing.length,
        nextCursor: done ? null : nextCursor,
        done,
      },
      statusCode: 200,
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    const statusCode = handled.statusCode || 500

    event.node.res.statusCode = statusCode

    return {
      success: false,
      message: handled.message || 'Failed to assign orphan images.',
      statusCode,
    }
  }
})
