// /scripts/clear_retired_entity_art_slots.ts
//
// The last step of the entity-art collapse: clear the retired
// cardPath/heroPath/iconPath columns now that one primary render serves every
// view and the old renders live in the inspiration gallery.
//
// FAIL CLOSED. Clearing a slot is the only step of this migration that could
// lose something, so every slot must prove three things first, and any slot
// that cannot is skipped and reported rather than cleared:
//
//   1. The object has a primary render. Without one it would go blank.
//   2. The slot's ArtImage is linked in EntityArtImage, i.e. it is already
//      reachable as inspiration.
//   3. The ArtImage row actually exists.
//
// A slot holding a bare path with no ArtImage row behind it can satisfy none of
// these -- there is no id to link or verify -- so it is never cleared.
//
// RETAG BEFORE CLEAR. ArtImage.path carries `entity:<type>:<id>:current:<field>`
// and artImageFilePath.ts treats that tag as "the only record of which entity
// and slot an image serves ... without it every image would fall to the unfiled
// landing zone" -- which the triage pass deletes. So each image is first moved
// to the history form `entity:<type>:<id>:history:<field>:<timestamp>`, which
// the same tag regex still recognizes as belonging to the entity AND which
// keeps the original field name, so nothing about its provenance is lost.
//
// An image that is ALSO the object's primary (the promoted bots) is retagged to
// `current:imagePath` instead of history -- it is still a current slot, just a
// different one.
//
// Usage:
//   npx tsx scripts/clear_retired_entity_art_slots.ts
//   npx tsx scripts/clear_retired_entity_art_slots.ts --write

import 'dotenv/config'
import {
  createScriptPrismaClient,
  withDatabaseRetry,
} from './lib/databaseRetry'

const WRITE = process.argv.includes('--write')

const SLOTS = [
  { path: 'cardPath', fk: 'cardArtImageId' },
  { path: 'heroPath', fk: 'heroArtImageId' },
  { path: 'iconPath', fk: 'iconArtImageId' },
] as const

const ENTITIES = ['character', 'bot', 'scenario', 'reward', 'facet'] as const
type Entity = (typeof ENTITIES)[number]

type Row = Record<string, unknown>

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function positiveId(value: unknown): number | null {
  const id = Number(value)
  return Number.isInteger(id) && id > 0 ? id : null
}

export async function main(): Promise<void> {
  await withDatabaseRetry('Clear retired entity art slots', async () => {
    const prisma = createScriptPrismaClient()
    const client = prisma as unknown as Record<
      string,
      {
        findMany: (args: unknown) => Promise<Row[]>
        update: (args: unknown) => Promise<unknown>
      }
    >

    try {
      const summary: Record<string, Record<string, number>> = {}
      const skipped: Array<{
        entityType: string
        entityId: number
        field: string
        reason: string
      }> = []
      let cleared = 0
      let retaggedHistory = 0
      let retaggedPrimary = 0

      for (const entityType of ENTITIES) {
        const select: Record<string, boolean> = {
          id: true,
          imagePath: true,
          artImageId: true,
        }
        if (entityType === 'bot') select.avatarImage = true
        for (const slot of SLOTS) {
          select[slot.path] = true
          select[slot.fk] = true
        }

        const rows = await client[entityType as Entity]!.findMany({ select })
        const tally = { cleared: 0, skipped: 0 }
        summary[entityType] = tally

        /*
         * Batch the lookups. Asking per slot cost two sequential round trips
         * each, which over the tailnet ran ~40 slots a minute -- slower than
         * the job timeout allows for 1800 of them. Every id this entity type
         * could touch is fetched in two queries instead.
         */
        const slotIds = [
          ...new Set(
            rows.flatMap((row) =>
              SLOTS.map((slot) => positiveId(row[slot.fk])).filter(
                (id): id is number => id !== null,
              ),
            ),
          ),
        ]
        const artImages = new Map<number, string>()
        const linked = new Set<string>()
        for (let index = 0; index < slotIds.length; index += 500) {
          const chunk = slotIds.slice(index, index + 500)
          const [images, links] = await Promise.all([
            prisma.artImage.findMany({
              where: { id: { in: chunk } },
              select: { id: true, path: true },
            }) as Promise<Array<{ id: number; path: string | null }>>,
            prisma.entityArtImage.findMany({
              where: { entityType, artImageId: { in: chunk } },
              select: { entityId: true, artImageId: true },
            }) as Promise<Array<{ entityId: number; artImageId: number }>>,
          ])
          for (const image of images) artImages.set(image.id, image.path ?? '')
          for (const link of links)
            linked.add(`${link.entityId}:${link.artImageId}`)
        }

        for (const row of rows) {
          const entityId = Number(row.id)
          const primaryId = positiveId(row.artImageId)
          // Accumulated so a row's slots clear in ONE update, not three.
          const clearData: Record<string, null> = {}
          const hasPrimary =
            text(row.imagePath) ||
            primaryId ||
            (entityType === 'bot' ? text(row.avatarImage) : '')

          for (const slot of SLOTS) {
            const slotPath = text(row[slot.path])
            const slotArtImageId = positiveId(row[slot.fk])
            if (!slotPath && !slotArtImageId) continue

            if (!hasPrimary) {
              skipped.push({
                entityType,
                entityId,
                field: slot.path,
                reason: 'object has no primary render; clearing would blank it',
              })
              tally.skipped += 1
              continue
            }

            if (!slotArtImageId) {
              skipped.push({
                entityType,
                entityId,
                field: slot.path,
                reason:
                  'slot is a bare path with no ArtImage row; cannot verify it is preserved as inspiration',
              })
              tally.skipped += 1
              continue
            }

            const artImage = artImages.has(slotArtImageId)
              ? { path: artImages.get(slotArtImageId) ?? '' }
              : null
            const link = linked.has(`${entityId}:${slotArtImageId}`)

            if (!artImage) {
              skipped.push({
                entityType,
                entityId,
                field: slot.path,
                reason: 'ArtImage row is missing',
              })
              tally.skipped += 1
              continue
            }
            if (!link) {
              skipped.push({
                entityType,
                entityId,
                field: slot.path,
                reason:
                  'not linked as inspiration yet; run task=link-inspiration first',
              })
              tally.skipped += 1
              continue
            }

            // Retag before clearing, so the image never sits untagged.
            const isAlsoPrimary = primaryId === slotArtImageId
            const nextTag = isAlsoPrimary
              ? `entity:${entityType}:${entityId}:current:imagePath`
              : `entity:${entityType}:${entityId}:history:${slot.path}:${Date.now()}`
            const currentTag = text(artImage.path)
            const needsRetag =
              currentTag.startsWith(
                `entity:${entityType}:${entityId}:current:`,
              ) || !currentTag

            if (WRITE && needsRetag) {
              // Retag first: the image must never sit untagged, even for the
              // instant between these two writes.
              await prisma.artImage.update({
                where: { id: slotArtImageId },
                data: { path: nextTag },
              })
            }
            clearData[slot.path] = null
            clearData[slot.fk] = null

            if (needsRetag) {
              if (isAlsoPrimary) retaggedPrimary += 1
              else retaggedHistory += 1
            }
            cleared += 1
            tally.cleared += 1
          }

          if (WRITE && Object.keys(clearData).length) {
            await client[entityType as Entity]!.update({
              where: { id: entityId },
              data: clearData,
            })
          }
        }
      }

      console.log(
        JSON.stringify(
          {
            mode: WRITE ? 'write' : 'dry-run',
            [WRITE ? 'slotsCleared' : 'slotsWouldClear']: cleared,
            retagged: {
              toHistory: retaggedHistory,
              toPrimaryCurrent: retaggedPrimary,
            },
            skipped: skipped.length,
            byEntity: summary,
            skippedDetail: skipped.slice(0, 50),
            policy:
              'Fail closed: a slot is cleared only when the object has a primary, the ArtImage exists, and it is already linked as inspiration. Every image is retagged before its column is cleared, so it never sits untagged and cannot fall to the landing zone the triage pass deletes. No ArtImage is deleted.',
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
