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
}

function emptyReport(): Report {
  return {
    linked: 0,
    alreadyLinked: 0,
    pathOnlyNoArtImage: 0,
    missingArtImageRow: 0,
  }
}

export async function main(): Promise<void> {
  await withDatabaseRetry('Entity art inspiration linking', async () => {
    const prisma = createScriptPrismaClient()
    const client = prisma as unknown as Record<
      string,
      { findMany: (args: unknown) => Promise<Array<Record<string, unknown>>> }
    >

    try {
      const byEntity: Record<string, Record<string, Report>> = {}
      const totals = emptyReport()

      for (const entityType of Object.keys(SLOT_FKS) as EntityKey[]) {
        const fields = SLOT_FKS[entityType]
        byEntity[entityType] = {}

        const select: Record<string, boolean> = { id: true }
        for (const [pathField, fkField] of Object.entries(fields)) {
          select[pathField] = true
          select[fkField] = true
        }

        const rows = await client[DELEGATE[entityType]]!.findMany({ select })

        for (const [pathField, fkField] of Object.entries(fields)) {
          const report = emptyReport()

          const candidates = rows.filter((row) => {
            const id = Number(row[fkField])
            const path =
              typeof row[pathField] === 'string' ? row[pathField] : ''
            if (Number.isInteger(id) && id > 0) return true
            // Populated as a bare path with no ArtImage behind it: not linkable.
            if (path) report.pathOnlyNoArtImage += 1
            return false
          })

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
            policy:
              'Insert-only. Every card/hero/icon render becomes an inspiration entry via one EntityArtImage join row. No ArtImage, entity row, slot column or path is modified, and no image is deleted.',
            note: 'pathOnlyNoArtImage slots hold a bare path with no ArtImage row to join to. They must be resolved before any slot column is cleared, or those images would end up unreferenced.',
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
