// /scripts/ensure_entity_primary_art.ts
//
// Give every entity a primary render, so the slot collapse can finish.
//
// The collapse retires cardPath/heroPath/iconPath in favour of one primary
// image plus the inspiration gallery. Clearing those columns is only safe once
// nothing depends on them for display -- an object whose ONLY art lives in a
// retired slot would otherwise go blank. Two gaps stand in the way, both data:
//
//   1. Bot keeps its render in `avatarImage` while every other entity uses
//      `imagePath`. Code already resolves both (utils/artImageSrc.ts), but the
//      column stays split until it is backfilled, which keeps every DB-level
//      query and future migration having to special-case Bot.
//   2. A handful of objects have secondary art but no primary at all. They need
//      one of their own images promoted rather than being left to blank out.
//
// Safety:
// - dry-run by default; --write is required to change anything
// - only ever FILLS an empty primary. An existing primary is never overwritten,
//   so this cannot replace art anyone chose.
// - promotion reuses the object's own existing ArtImage. Nothing is generated,
//   copied or deleted, and the promoted image stays in the inspiration gallery
//   as well -- being the primary and being an inspiration entry are not
//   exclusive.
//
// Usage:
//   npx tsx scripts/ensure_entity_primary_art.ts
//   npx tsx scripts/ensure_entity_primary_art.ts --write

import 'dotenv/config'
import {
  createScriptPrismaClient,
  withDatabaseRetry,
} from './lib/databaseRetry'

const WRITE = process.argv.includes('--write')

/** Preference order when promoting: card is closest to a general portrait. */
const SECONDARY_SLOTS = [
  { path: 'cardPath', fk: 'cardArtImageId' },
  { path: 'heroPath', fk: 'heroArtImageId' },
  { path: 'iconPath', fk: 'iconArtImageId' },
] as const

const PROMOTABLE = ['character', 'bot', 'scenario', 'reward', 'facet'] as const
type Promotable = (typeof PROMOTABLE)[number]

type Row = Record<string, unknown>

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function positiveId(value: unknown): number | null {
  const id = Number(value)
  return Number.isInteger(id) && id > 0 ? id : null
}

export async function main(): Promise<void> {
  await withDatabaseRetry('Ensure entity primary art', async () => {
    const prisma = createScriptPrismaClient()
    const client = prisma as unknown as Record<
      string,
      {
        findMany: (args: unknown) => Promise<Row[]>
        update: (args: unknown) => Promise<unknown>
      }
    >

    try {
      // ── 1. Bot: avatarImage -> imagePath ───────────────────────────────────
      const bots = await client.bot!.findMany({
        select: { id: true, avatarImage: true, imagePath: true },
      })
      const botBackfill = bots.filter(
        (bot) => !text(bot.imagePath) && text(bot.avatarImage),
      )

      if (WRITE) {
        for (const bot of botBackfill) {
          await client.bot!.update({
            where: { id: Number(bot.id) },
            data: { imagePath: text(bot.avatarImage) },
          })
        }
      }

      // ── 2. Promote a secondary render for objects with no primary ─────────
      const promotions: Array<{
        entityType: string
        entityId: number
        from: string
        artImageId: number | null
        path: string
      }> = []

      for (const entityType of PROMOTABLE) {
        const select: Record<string, boolean> = {
          id: true,
          imagePath: true,
          artImageId: true,
        }
        if (entityType === 'bot') select.avatarImage = true
        for (const slot of SECONDARY_SLOTS) {
          select[slot.path] = true
          select[slot.fk] = true
        }

        const rows = await client[entityType as Promotable]!.findMany({
          select,
        })

        for (const row of rows) {
          const hasPrimary =
            text(row.imagePath) ||
            positiveId(row.artImageId) ||
            (entityType === 'bot' ? text(row.avatarImage) : '')
          if (hasPrimary) continue

          const source = SECONDARY_SLOTS.find(
            (slot) => text(row[slot.path]) || positiveId(row[slot.fk]),
          )
          if (!source) continue

          const entityId = Number(row.id)
          const artImageId = positiveId(row[source.fk])
          const path = text(row[source.path])

          if (WRITE) {
            const data: Record<string, unknown> = {}
            if (path) data.imagePath = path
            if (artImageId) data.artImageId = artImageId
            if (entityType === 'bot' && path) data.avatarImage = path
            if (Object.keys(data).length) {
              await client[entityType as Promotable]!.update({
                where: { id: entityId },
                data,
              })
            }
          }

          promotions.push({
            entityType,
            entityId,
            from: source.path,
            artImageId,
            path: path.slice(0, 80),
          })
        }
      }

      console.log(
        JSON.stringify(
          {
            mode: WRITE ? 'write' : 'dry-run',
            botPrimaryBackfill: {
              [WRITE ? 'updated' : 'wouldUpdate']: botBackfill.length,
              botIds: botBackfill.map((bot) => Number(bot.id)).slice(0, 100),
            },
            secondaryPromotions: {
              [WRITE ? 'promoted' : 'wouldPromote']: promotions.length,
              detail: promotions.slice(0, 50),
            },
            policy:
              "Fills an empty primary only; an existing primary is never overwritten. Promotion reuses the object's own ArtImage, which also stays in the inspiration gallery. Nothing is generated, copied or deleted.",
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
