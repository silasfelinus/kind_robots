// /scripts/cancel_entity_art_slot_jobs.ts
//
// Cancel still-PENDING entity-art ArtJobs that target art slots we are
// retiring. Written for the card/hero/icon collapse (Silas, 2026-09-05:
// "we really don't need three different images just so we can show a hero
// view, card view, icon view"), where the 2026-09-05 Krea semantic repair had
// already enqueued ~1800 replacements for exactly the slots being dropped.
// Rendering those costs days of GPU time to produce art the migration deletes.
//
// Safety:
// - dry-run by default; --write is required to mutate anything
// - PENDING only. A RUNNING job is left to finish (killing it mid-render
//   strands the relay's output), and a DONE job is never touched, so no
//   existing ArtImage or entity slot is altered by this script at all.
// - by default only jobs carrying the `kreaSemanticRepair` marker (the
//   replacements this migration made moot) are cancelled; --include-unmarked
//   widens to every pending job for those slots
// - cancellation is reversible: nothing is deleted, and the same coverage can
//   be re-enqueued by the ordinary producers if the migration is abandoned
//
// Usage:
//   npx tsx scripts/cancel_entity_art_slot_jobs.ts
//   npx tsx scripts/cancel_entity_art_slot_jobs.ts --write
//   npx tsx scripts/cancel_entity_art_slot_jobs.ts --fields cardPath,iconPath --write

import 'dotenv/config'
import { parseArtJobPayload } from '../server/utils/artJobPayload'
import {
  createScriptPrismaClient,
  withDatabaseRetry,
} from './lib/databaseRetry'

const WRITE = process.argv.includes('--write')
const INCLUDE_UNMARKED = process.argv.includes('--include-unmarked')
const DEFAULT_FIELDS = ['cardPath', 'heroPath', 'iconPath']

function targetFields(): string[] {
  const argument = process.argv.find((value) => value.startsWith('--fields='))
  if (!argument) return DEFAULT_FIELDS
  const fields = argument
    .slice('--fields='.length)
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)
  return fields.length ? fields : DEFAULT_FIELDS
}

type JsonRecord = Record<string, unknown>

function asRecord(value: unknown): JsonRecord {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as JsonRecord)
    : {}
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

export async function main(): Promise<void> {
  const fields = new Set(targetFields())

  await withDatabaseRetry('Entity art slot job cancellation', async () => {
    const prisma = createScriptPrismaClient()
    try {
      const rows = (await prisma.artJob.findMany({
        where: {
          status: 'PENDING',
          payload: { contains: '"entityArt"' },
        },
        orderBy: { id: 'asc' },
        select: { id: true, payload: true, projectSlug: true },
      })) as Array<{ id: number; payload: string; projectSlug: string | null }>

      const marked: number[] = []
      const unmarked: number[] = []
      const byField: Record<string, number> = {}
      const byEntityType: Record<string, number> = {}

      for (const row of rows) {
        const payload = parseArtJobPayload(row.payload) as JsonRecord
        const entityArt = asRecord(payload.entityArt)
        const field = text(entityArt.field)
        if (!fields.has(field)) continue

        const entityType = text(entityArt.entityType).toLowerCase()
        const isRepairReplacement =
          asRecord(payload.kreaSemanticRepair).version === 1
        if (isRepairReplacement) marked.push(row.id)
        else unmarked.push(row.id)

        if (isRepairReplacement || INCLUDE_UNMARKED) {
          byField[field] = (byField[field] ?? 0) + 1
          byEntityType[entityType] = (byEntityType[entityType] ?? 0) + 1
        }
      }

      const cancelling = INCLUDE_UNMARKED ? [...marked, ...unmarked] : marked

      if (WRITE && cancelling.length) {
        // Re-assert status: 'PENDING' in the update filter so a job the relay
        // claimed between the read above and this write is not yanked out from
        // under an in-flight render.
        for (let index = 0; index < cancelling.length; index += 200) {
          const chunk = cancelling.slice(index, index + 200)
          await prisma.artJob.updateMany({
            where: { id: { in: chunk }, status: 'PENDING' },
            data: {
              status: 'CANCELLED',
              claimedAt: null,
              claimedBy: null,
              error:
                'Cancelled by entity-art slot cleanup: the card/hero/icon slots are being retired in favour of one primary image plus a tagged inspiration gallery.',
            },
          })
        }
      }

      console.log(
        JSON.stringify(
          {
            mode: WRITE ? 'write' : 'dry-run',
            fields: [...fields],
            includeUnmarked: INCLUDE_UNMARKED,
            scannedPendingEntityArtJobs: rows.length,
            repairReplacements: marked.length,
            otherPendingJobsForTheseSlots: unmarked.length,
            cancelled: WRITE ? cancelling.length : 0,
            wouldCancel: WRITE ? 0 : cancelling.length,
            byField,
            byEntityType,
            policy:
              'PENDING only. RUNNING jobs finish, DONE jobs and every existing ArtImage are untouched. Cancellation is reversible: the ordinary producers can re-enqueue this coverage.',
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
