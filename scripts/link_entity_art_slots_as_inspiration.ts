// /scripts/link_entity_art_slots_as_inspiration.ts
//
// Turn the retired card/hero/icon renders into inspiration entries.
//
// Entity art is collapsing to one primary render plus the inspiration gallery
// (Silas, 2026-09-05). The ~1800 images already rendered into the retired slots
// are NOT discarded by that collapse -- they become inspiration, exactly as
// Silas asked: "we aren't deleting anything, we are turning them into
// inspiration entries."
//
// Mechanically that is one join row each. listEntityArtHistory reads
// EntityArtImage (interface-vision/t-079: "one join row is how an ArtImage
// becomes visible in an entity's history ... not ArtImage.path prefixes"), so
// inserting the link is the whole job and the ArtImage itself is never copied,
// moved or touched.
//
// Safety:
// - dry-run by default; --write is required to insert anything
// - INSERT ONLY. No ArtImage, entity row, slot column or path is modified, so
//   there is nothing here to roll back beyond deleting join rows.
// - skipCreateMany-style dedupe: a slot already linked (the repair's
//   preserveOriginal archiving linked many of them today) is counted, not
//   re-inserted.
// - a slot holding only a path string with no ArtImage row cannot be linked --
//   there is no id to join to. Those are reported, never invented, and must be
//   resolved before any column is cleared or they would become unreferenced.
//
// Usage:
//   npx tsx scripts/link_entity_art_slots_as_inspiration.ts
//   npx tsx scripts/link_entity_art_slots_as_inspiration.ts --write

import 'dotenv/config'
import {
  createScriptPrismaClient,
  withDatabaseRetry,
} from './lib/databaseRetry'

const WRITE = process.argv.includes('--write')
/**
 * Adopt slots holding a bare path with no ArtImage row behind them.
 *
 * These are legacy static assets -- Facet 16 "Circus" points its cardPath at
 * /images/adventure/genre/carnival.webp, written before this table tracked art.
 * They cannot be linked as inspiration because there is no id to join to, so
 * the clearing guard refuses to touch them and dropping the column would
 * silently discard the reference. Adopting gives the path a real ArtImage row
 * (the same thing createHistoryReference does for this exact legacy case),
 * links it as inspiration, and points the slot at it, so the ordinary
 * clear-slots path can then handle it like any other slot.
 */
const ADOPT_PATH_ONLY = process.argv.includes('--adopt-path-only')

/**
 * Only these carry per-slot ArtImage foreign keys. Dream's secondary slots are
 * path-only and, per the live census, entirely unpopulated -- so there is
 * nothing to link there and inventing rows for it would be fabrication.
 */
const SLOT_FKS = {
  character: {
    cardPath: 'cardArtImageId',
    heroPath: 'heroArtImageId',
    iconPath: 'iconArtImageId',
  },
  bot: {
    cardPath: 'cardArtImageId',
    heroPath: 'heroArtImageId',
    iconPath: 'iconArtImageId',
  },
  scenario: {
    cardPath: 'cardArtImageId',
    heroPath: 'heroArtImageId',
    iconPath: 'iconArtImageId',
  },
  reward: {
    cardPath: 'cardArtImageId',
    heroPath: 'heroArtImageId',
    iconPath: 'iconArtImageId',
  },
  facet: {
    cardPath: 'cardArtImageId',
    heroPath: 'heroArtImageId',
    iconPath: 'iconArtImageId',
  },
} as const

type EntityKey = keyof typeof SLOT_FKS

const DELEGATE: Record<EntityKey, string> = {
  character: 'character',
  bot: 'bot',
  scenario: 'scenario',
  reward: 'reward',
  facet: 'facet',
}

type Report = {
  linked: number
  alreadyLinked: number
  pathOnlyNoArtImage: number
  missingArtImageRow: number
  adopted: number
}

function emptyReport(): Report {
  return {
    linked: 0,
    alreadyLinked: 0,
    pathOnlyNoArtImage: 0,
    missingArtImageRow: 0,
    adopted: 0,
  }
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function fileTypeFromPath(path: string): string {
  const match = /\.([a-z0-9]+)(?:\?|$)/i.exec(path)
  return match?.[1]?.toLowerCase() || 'webp'
}

export async function main(): Promise<void> {
  await withDatabaseRetry('Entity art inspiration linking', async () => {
    const prisma = createScriptPrismaClient()
    const client = prisma as unknown as Record<
      string,
      {
        findMany: (args: unknown) => Promise<Array<Record<string, unknown>>>
        update: (args: unknown) => Promise<unknown>
      }
    >

    try {
      const byEntity: Record<string, Record<string, Report>> = {}
      const totals = emptyReport()

      for (const entityType of Object.keys(SLOT_FKS) as EntityKey[]) {
        const fields = SLOT_FKS[entityType]
        byEntity[entityType] = {}

        const select: Record<string, boolean> = {
          id: true,
          userId: true,
          isPublic: true,
          isMature: true,
        }
        for (const [pathField, fkField] of Object.entries(fields)) {
          select[pathField] = true
          select[fkField] = true
        }

        const rows = await client[DELEGATE[entityType]]!.findMany({ select })

        for (const [pathField, fkField] of Object.entries(fields)) {
          const report = emptyReport()

          const pathOnly: Array<{ entityId: number; path: string }> = []
          const candidates = rows.filter((row) => {
            const id = Number(row[fkField])
            const path = text(row[pathField])
            if (Number.isInteger(id) && id > 0) return true
            // Populated as a bare path with no ArtImage behind it: not linkable
            // as-is. --adopt-path-only gives it a real row so it can be.
            if (path) {
              report.pathOnlyNoArtImage += 1
              pathOnly.push({ entityId: Number(row.id), path })
            }
            return false
          })

          /*
           * Adopt legacy static-asset slots. Mirrors createHistoryReference's
           * handling of the same case: a bare path needs a real ArtImage row
           * before anything can link to it. The row is tagged straight into the
           * history form, since this slot is being retired, and the entity's FK
           * is pointed at it so the ordinary clear-slots guard can then verify
           * and clear it like any other slot.
           */
          if (ADOPT_PATH_ONLY && pathOnly.length) {
            for (const orphan of pathOnly) {
              if (!WRITE) {
                report.adopted += 1
                continue
              }
              const owner = rows.find(
                (row) => Number(row.id) === orphan.entityId,
              )
              const created = (await prisma.artImage.create({
                data: {
                  userId: Number(owner?.userId) || 1,
                  fileName: `${entityType}-${orphan.entityId}-${pathField}-adopted-${Date.now()}`,
                  fileType: fileTypeFromPath(orphan.path),
                  imagePath: orphan.path,
                  path: `entity:${entityType}:${orphan.entityId}:history:${pathField}:${Date.now()}`,
                  artPrompt: `Legacy ${pathField} asset retained as inspiration`,
                  seed: -1,
                  cfg: 3,
                  designer: 'Kind Robots',
                  isPublic: Boolean(owner?.isPublic ?? true),
                  isMature: Boolean(owner?.isMature ?? false),
                  isActive: true,
                },
                select: { id: true },
              })) as { id: number }

              await prisma.entityArtImage.createMany({
                data: [
                  {
                    entityType,
                    entityId: orphan.entityId,
                    artImageId: created.id,
                  },
                ],
                skipDuplicates: true,
              })
              await client[DELEGATE[entityType]]!.update({
                where: { id: orphan.entityId },
                data: { [fkField]: created.id },
              })
              report.adopted += 1
            }
          }

          const artImageIds = [
            ...new Set(candidates.map((row) => Number(row[fkField]))),
          ]

          // Only link ArtImage rows that actually exist. A dangling FK would
          // otherwise fail the insert and abort an otherwise clean run.
          const existing = new Set(
            (
              (await prisma.artImage.findMany({
                where: { id: { in: artImageIds } },
                select: { id: true },
              })) as Array<{ id: number }>
            ).map((row) => row.id),
          )

          const alreadyLinked = new Set(
            (
              (await prisma.entityArtImage.findMany({
                where: {
                  entityType,
                  artImageId: { in: artImageIds },
                },
                select: { entityId: true, artImageId: true },
              })) as Array<{ entityId: number; artImageId: number }>
            ).map((row) => `${row.entityId}:${row.artImageId}`),
          )

          const toLink: Array<{
            entityType: string
            entityId: number
            artImageId: number
          }> = []

          for (const row of candidates) {
            const entityId = Number(row.id)
            const artImageId = Number(row[fkField])
            if (!existing.has(artImageId)) {
              report.missingArtImageRow += 1
              continue
            }
            if (alreadyLinked.has(`${entityId}:${artImageId}`)) {
              report.alreadyLinked += 1
              continue
            }
            toLink.push({ entityType, entityId, artImageId })
          }

          if (WRITE && toLink.length) {
            for (let index = 0; index < toLink.length; index += 500) {
              const chunk = toLink.slice(index, index + 500)
              await prisma.entityArtImage.createMany({
                data: chunk,
                skipDuplicates: true,
              })
            }
          }
          report.linked = toLink.length

          byEntity[entityType][pathField] = report
          totals.linked += report.linked
          totals.alreadyLinked += report.alreadyLinked
          totals.pathOnlyNoArtImage += report.pathOnlyNoArtImage
          totals.missingArtImageRow += report.missingArtImageRow
          totals.adopted += report.adopted
        }
      }

      console.log(
        JSON.stringify(
          {
            mode: WRITE ? 'write' : 'dry-run',
            totals: {
              ...totals,
              linked: WRITE ? totals.linked : 0,
              wouldLink: WRITE ? 0 : totals.linked,
            },
            byEntity,
            adoptPathOnly: ADOPT_PATH_ONLY,
            policy:
              'Insert-only for linking: an existing render becomes an inspiration entry via one EntityArtImage join row, and no ArtImage, entity row, slot column or path is modified. --adopt-path-only additionally CREATES an ArtImage row for a legacy bare-path slot and points the slot at it, so that reference survives the column drop. No image is ever deleted.',
            note: 'pathOnlyNoArtImage slots hold a bare path with no ArtImage row to join to. Without --adopt-path-only they are reported and left alone, and the clearing guard refuses to touch them -- so dropping the column would discard the reference.',
          },
          null,
          2,
        ),
      )
    } finally {
      await prisma.$disconnect()
    }
  })
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
}
