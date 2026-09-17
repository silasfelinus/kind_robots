// /server/api/art/entity-links.get.ts
//
// Resolve `entityType:entityId` references to a name and a link.
//
// An ArtJob payload carries only the reference -- `{ entityType: 'resource',
// entityId: 2726 }` -- so the queue card can say an image was made FOR
// something but not WHAT. This turns a page of references into labels.
//
// Batched per type deliberately. The queue browser shows up to 200 jobs, and a
// lookup per card is 200 round trips for what is nine queries at most.
//
// Query: ?refs=resource:2726,character:12,facet:3
import { createError, defineEventHandler, getQuery } from 'h3'
import prisma from '../../utils/prisma'
import { errorHandler } from '../../utils/error'
import { requireMachineUser } from '../../utils/authGuard'
import type { EntityArtType } from '../../utils/entityArt'
import { entityArtHref, entityArtRefKey } from '~/utils/entityArtLink'

const MAX_REFS = 400

/*
 * Where each type's display name lives, read off the schema rather than
 * guessed: Achievement has no `name` or `title` (it uses `label`), Scenario and
 * Facet have `title`, and everything else has `name`. A wrong column is a
 * silent 500 at runtime.
 */
type EntityLookup = {
  findMany: (ids: number[]) => Promise<Array<Record<string, unknown>>>
  label: (row: Record<string, unknown>) => string
  slug?: (row: Record<string, unknown>) => string | null
}

/*
 * Enough to render a card without a second round trip.
 *
 * Silas, 2026-09-17: a link that navigates away is a worse answer than a card
 * you can glance at and then follow. Character and Achievement have no
 * `description` column, so that field is simply absent for them rather than
 * faked.
 */
const CARD_FIELDS = {
  imagePath: true,
  artImageId: true,
  /*
   * The JOINED ArtImage's own paths, which is what actually renders in a
   * browser. `/api/art/images/:id/file` authenticates by Bearer token only, so
   * an <img> tag carrying a session cookie gets 403 on any mature or private
   * row -- the object card showed an empty preview for exactly that reason
   * while the resource page, which uses these static paths, rendered it fine.
   * Mirrors resource-card.vue's precedence.
   */
  ArtImage: {
    select: { id: true, thumbnailPath: true, imagePath: true, path: true },
  },
} as const

const LOOKUPS: Record<EntityArtType, EntityLookup> = {
  character: {
    findMany: (ids) => prisma.character.findMany({ where: { id: { in: ids } }, select: { id: true, name: true, ...CARD_FIELDS } }),
    label: (r) => String(r.name || ''),
  },
  scenario: {
    findMany: (ids) => prisma.scenario.findMany({ where: { id: { in: ids } }, select: { id: true, title: true, description: true, ...CARD_FIELDS } }),
    label: (r) => String(r.title || ''),
  },
  reward: {
    findMany: (ids) => prisma.reward.findMany({ where: { id: { in: ids } }, select: { id: true, name: true, description: true, ...CARD_FIELDS } }),
    label: (r) => String(r.name || ''),
  },
  bot: {
    findMany: (ids) => prisma.bot.findMany({ where: { id: { in: ids } }, select: { id: true, name: true, description: true, ...CARD_FIELDS } }),
    label: (r) => String(r.name || ''),
  },
  dream: {
    findMany: (ids) => prisma.dream.findMany({ where: { id: { in: ids } }, select: { id: true, title: true, description: true, ...CARD_FIELDS } }),
    label: (r) => String(r.title || ''),
  },
  resource: {
    findMany: (ids) =>
      prisma.resource.findMany({
        where: { id: { in: ids } },
        select: {
          id: true, name: true, description: true, previewImageUrl: true,
          isMature: true, resourceType: true, generation: true, ...CARD_FIELDS,
        },
      }),
    label: (r) => String(r.name || ''),
  },
  facet: {
    findMany: (ids) => prisma.facet.findMany({ where: { id: { in: ids } }, select: { id: true, title: true, slug: true, description: true, ...CARD_FIELDS } }),
    label: (r) => String(r.title || ''),
    slug: (r) => (r.slug ? String(r.slug) : null),
  },
  project: {
    findMany: (ids) => prisma.project.findMany({ where: { id: { in: ids } }, select: { id: true, title: true, description: true, ...CARD_FIELDS } }),
    label: (r) => String(r.title || ''),
  },
  achievement: {
    findMany: (ids) => prisma.achievement.findMany({ where: { id: { in: ids } }, select: { id: true, label: true, ...CARD_FIELDS } }),
    label: (r) => String(r.label || ''),
  },
}

function parseRefs(raw: unknown): Array<{ entityType: EntityArtType; entityId: number }> {
  const out = new Map<string, { entityType: EntityArtType; entityId: number }>()
  for (const part of String(raw || '').split(',')) {
    const [type, id] = part.split(':')
    const entityType = String(type || '').trim().toLowerCase() as EntityArtType
    const entityId = Number(id)
    if (!LOOKUPS[entityType]) continue
    if (!Number.isInteger(entityId) || entityId <= 0) continue
    out.set(entityArtRefKey(entityType, entityId), { entityType, entityId })
  }
  return [...out.values()]
}

export default defineEventHandler(async (event) => {
  try {
    await requireMachineUser(event)

    const refs = parseRefs(getQuery(event).refs)
    if (refs.length > MAX_REFS) {
      throw createError({
        statusCode: 400,
        message: `Too many references (${refs.length}); the limit is ${MAX_REFS}.`,
      })
    }

    const byType = new Map<EntityArtType, number[]>()
    for (const ref of refs) {
      byType.set(ref.entityType, [...(byType.get(ref.entityType) || []), ref.entityId])
    }

    const links: Record<string, unknown> = {}
    await Promise.all(
      [...byType.entries()].map(async ([entityType, ids]) => {
        const lookup = LOOKUPS[entityType]
        const rows = await lookup.findMany(ids)
        const found = new Map(rows.map((r) => [Number(r.id), r]))
        for (const id of ids) {
          const row = found.get(id)
          const key = entityArtRefKey(entityType, id)
          if (!row) {
            // The object was deleted after its art was queued. Say so rather
            // than linking to a page that will silently select nothing.
            links[key] = { entityType, entityId: id, label: null, href: null, exists: false }
            continue
          }
          const slug = lookup.slug?.(row) ?? null
          links[key] = {
            entityType,
            entityId: id,
            label: lookup.label(row) || `${entityType} ${id}`,
            href: entityArtHref(entityType, id, slug),
            exists: true,
            // Card fields. `isMature` rides along so the client can withhold
            // the image without a second lookup -- the maturity rule is an
            // account setting and this endpoint does not get to overrule it.
            description: typeof row.description === 'string' ? row.description : null,
            imagePath: typeof row.imagePath === 'string' ? row.imagePath : null,
            artImagePath: (() => {
              const art = row.ArtImage as Record<string, unknown> | null | undefined
              if (!art) return null
              for (const key of ['thumbnailPath', 'imagePath', 'path'] as const) {
                const value = art[key]
                if (typeof value === 'string' && value.trim()) return value
              }
              return null
            })(),
            artImageId: typeof row.artImageId === 'number' ? row.artImageId : null,
            previewImageUrl:
              typeof row.previewImageUrl === 'string' ? row.previewImageUrl : null,
            isMature: row.isMature === true,
            detail:
              [row.resourceType, row.generation].filter((v) => typeof v === 'string').join(' · ') ||
              null,
          }
        }
      }),
    )

    return {
      success: true,
      message: `${Object.keys(links).length} reference(s) resolved.`,
      data: { links },
      statusCode: 200,
    }
  } catch (error) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return {
      success: false,
      message: handled.message || 'Failed to resolve entity links.',
      data: null,
      statusCode: handled.statusCode || 500,
    }
  }
})
