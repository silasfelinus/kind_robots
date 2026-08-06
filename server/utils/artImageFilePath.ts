// /server/utils/artImageFilePath.ts
//
// Where a generated image belongs on the media share.
//
// THE CONVENTION, from conductor's URL-MAPPING.md (Silas, 2026-07-05):
//
//   /images/{context}/{slug}/{slug}-{utility}-{n}.webp
//
//   {context}  the KR schema the image serves — bots, characters, scenarios,
//              rewards, facets, projects, achievements. "There is almost
//              always a relevant one — figure it out rather than defaulting to
//              a dump folder."
//   {slug}     the entity's slug, lowercase-hyphenated. A slug folder's
//              contents ARE that slug's art collection.
//   {utility}  what the image is for: avatar, portrait, icon, card, hero.
//   {n}        the next available number. "Numbering never overwrites: a new
//              icon candidate for a slug that already has slug-icon-1.webp
//              becomes slug-icon-2.webp."
//
// Silas, 2026-08-06: "we can't just rewrite everything as art-image-2846.webp
// and expect that to be good enough."
//
// HOW AN ArtImage KNOWS WHERE IT BELONGS. Nothing had to be invented for this:
// applyEntityArtImage already stamps ArtImage.path with a tag naming the
// entity and slot it serves —
//
//   entity:character:42:current:cardPath
//
// — and EntityArtImage rows link images to entities independently. So context,
// slug and utility are all recoverable from data already being written; this
// module just reads them back.
//
// THE LANDING ZONE. Art with no entity behind it (free generation, unfiled
// experiments) goes to `generated/<year>/<month>/`, which URL-MAPPING.md names
// as an engine landing zone — "not final homes — an image that turns out to
// matter gets re-filed per Section 1". That is the honest destination for an
// image nothing has claimed, and it stays visibly distinguishable from filed
// art so re-filing can find it later.
import { readdir } from 'node:fs/promises'
import path from 'node:path'
import {
  ENTITY_FIELDS,
  cleanSlug,
  getEntityArtRecord,
  normalizeEntityArtType,
  recordTitle,
  type EntityArtDb,
  type EntityArtType,
} from './entityArt'

/** entity:<type>:<id>:current:<field>  |  entity:<type>:<id>:history:<...> */
const ENTITY_TAG = /^entity:([a-z]+):(\d+):(current|history):(.*)$/

/*
 * Schema name → folder. Plural, matching the existing public/images tree and
 * the schema names URL-MAPPING.md lists (dreams, bots, characters, scenarios,
 * rewards, milestones…).
 */
const CONTEXT_FOLDER: Record<EntityArtType, string> = {
  bot: 'bots',
  character: 'characters',
  scenario: 'scenarios',
  reward: 'rewards',
  facet: 'facets',
  project: 'projects',
  achievement: 'achievements',
}

export type ResolvedArtFilePath = {
  /** Share-relative, e.g. `characters/nova/nova-portrait-3.webp`. */
  relative: string
  /** False when this landed in the engine landing zone awaiting re-filing. */
  filed: boolean
  context: string
  slug: string
  utility: string
}

type TagParts = { entityType: EntityArtType; entityId: number; field: string }

function parseEntityTag(value: unknown): TagParts | null {
  const match = String(value ?? '').match(ENTITY_TAG)
  if (!match) return null

  try {
    const entityType = normalizeEntityArtType(match[1])
    const entityId = Number(match[2])
    if (!Number.isInteger(entityId) || entityId <= 0) return null

    /*
     * A history tag's trailing segment is a timestamped label rather than a
     * field name, so it carries no usable utility — the entity is still known,
     * which is what matters for placement.
     */
    const field = match[3] === 'current' ? String(match[4] || '') : ''
    return { entityType, entityId, field }
  } catch {
    return null
  }
}

/**
 * The `{utility}` token. Uses the same `label` the art UI shows for the slot
 * ('Avatar', 'Portrait', 'Icon', 'Card', 'Hero'), so a filename and the
 * interface agree on what the image is without a second vocabulary to keep in
 * sync. Falls back to `art` for images linked to an entity but not to a slot.
 */
function utilityFor(entityType: EntityArtType, field: string): string {
  const config = field ? ENTITY_FIELDS[entityType]?.[field] : null
  return cleanSlug(config?.label, 'art')
}

/**
 * Next free `{n}` for this slug+utility, by reading what is already there.
 *
 * Deliberately filesystem-derived rather than database-derived: the share is
 * the thing being written to, other tools (distribute_images.py) write into
 * the same folders, and a number chosen from the database alone would happily
 * overwrite a file it had never heard of. Numbering never overwrites.
 */
async function nextIndex(
  directory: string,
  slug: string,
  utility: string,
): Promise<number> {
  const entries = await readdir(directory).catch(() => [] as string[])
  const pattern = new RegExp(
    `^${slug.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}-${utility}-(\\d+)\\.`,
    'i',
  )

  let highest = 0
  for (const entry of entries) {
    const found = Number(entry.match(pattern)?.[1])
    if (Number.isInteger(found) && found > highest) highest = found
  }

  return highest + 1
}

export async function resolveArtImageFilePath(
  db: EntityArtDb,
  image: { id: number; path: string | null },
  extension: string,
  shareRoot: string,
  contentTag: string,
): Promise<ResolvedArtFilePath> {
  const landingZone = (): ResolvedArtFilePath => {
    const now = new Date()
    const year = String(now.getUTCFullYear())
    const month = String(now.getUTCMonth() + 1).padStart(2, '0')
    return {
      /*
       * The content hash matters HERE and not in the filed case: the landing
       * zone has no {n} to increment, so an overwrite retry reusing the same
       * ArtImage id would otherwise replace a file at a URL that browsers and
       * the CDN have already cached, and keep serving the old art.
       */
      relative: path.posix.join(
        'generated',
        year,
        month,
        `artimage-${image.id}-${contentTag}.${extension}`,
      ),
      filed: false,
      context: 'generated',
      slug: `artimage-${image.id}`,
      utility: 'art',
    }
  }

  const tag = parseEntityTag(image.path)

  /*
   * EntityArtImage is the fallback when no tag was stamped — older rows, and
   * links made outside applyEntityArtImage. It knows the entity but not the
   * slot, which is why utilityFor() degrades to 'art' rather than guessing.
   */
  const link = tag
    ? null
    : await db.entityArtImage
        .findFirst({
          where: { artImageId: image.id },
          // EntityArtImage has a composite primary key and no id column, so
          // the earliest link is the oldest createdAt.
          orderBy: { createdAt: 'asc' },
        })
        .catch(() => null)

  let entityType: EntityArtType
  let entityId: number
  let field: string

  if (tag) {
    ;({ entityType, entityId, field } = tag)
  } else if (link) {
    try {
      entityType = normalizeEntityArtType(link.entityType)
    } catch {
      return landingZone()
    }
    entityId = Number(link.entityId)
    field = ''
    if (!Number.isInteger(entityId) || entityId <= 0) return landingZone()
  } else {
    return landingZone()
  }

  const record = await getEntityArtRecord(db, entityType, entityId).catch(
    () => null,
  )

  /*
   * A tag pointing at a deleted entity is not a reason to lose the bytes. The
   * landing zone takes it, visibly unfiled.
   */
  if (!record) return landingZone()

  const context = CONTEXT_FOLDER[entityType]
  const slug = cleanSlug(
    recordTitle(entityType, record),
    `${entityType}-${entityId}`,
  )
  const utility = utilityFor(entityType, field)

  const directory = path.join(shareRoot, context, slug)
  const index = await nextIndex(directory, slug, utility)

  return {
    relative: path.posix.join(
      context,
      slug,
      `${slug}-${utility}-${index}.${extension}`,
    ),
    filed: true,
    context,
    slug,
    utility,
  }
}
