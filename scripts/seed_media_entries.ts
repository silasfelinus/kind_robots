// scripts/seed_media_entries.ts
//
// One-time historical backfill of Silas's media log into the MediaEntry table
// (media-watchlist/t-009). Reads data/media-entries.json (2,440 validated
// entries, 2014-2026 — see conductor projects/media-watchlist/data/import-report.md)
// and bulk-inserts via createMany. This is a single historical migration, not
// an ongoing sync: going forward, new entries are added through the app UI.
//
// Guarded by a pre-check (see conductor
// projects/media-watchlist/docs/t-008-final-schema-and-browse-api.md §4):
// there is no unique constraint to dedupe on (two genuinely identical
// same-day rewatches without an "x2" marker in the source are valid rows),
// so refuses to run if the table is already non-empty unless --force is passed.
//
// Usage:
//   npx tsx scripts/seed_media_entries.ts            # dry run (default)
//   npx tsx scripts/seed_media_entries.ts --write     # apply
//   npx tsx scripts/seed_media_entries.ts --write --force  # apply even if rows already exist

import 'dotenv/config'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join, dirname } from 'node:path'
import { PrismaClient, MediaType } from '../prisma/generated/prisma/client'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url))
const DATA_PATH = join(SCRIPT_DIR, '..', 'data', 'media-entries.json')

type ImportedEntry = {
  line: number
  year: number
  mediaType: string
  title: string
  starred: boolean
  releaseYear: number | null
  season: number | null
  author: string | null
  watchedMonth: number | null
  watchedDay: number | null
  dateRaw: string | null
  pageCount: number | null
  durationHours: number | null
  issueCount: number | null
  issueRange: string | null
  rewatch: number | null
  notes: string | null
  raw: string
  sourceFile: string | null
}

const VALID_MEDIA_TYPES = new Set(Object.values(MediaType) as string[])

function loadEntries(): ImportedEntry[] {
  const raw = readFileSync(DATA_PATH, 'utf-8')
  const parsed = JSON.parse(raw) as ImportedEntry[]
  if (!Array.isArray(parsed)) {
    throw new Error(`${DATA_PATH} did not parse to an array`)
  }
  return parsed
}

export function validateEntries(entries: ImportedEntry[]): void {
  for (const entry of entries) {
    if (!VALID_MEDIA_TYPES.has(entry.mediaType)) {
      throw new Error(
        `Entry at source line ${entry.line} has unknown mediaType "${entry.mediaType}"`,
      )
    }
    if (!entry.title || !entry.title.trim()) {
      throw new Error(`Entry at source line ${entry.line} is missing a title`)
    }
    if (!Number.isInteger(entry.year)) {
      throw new Error(`Entry at source line ${entry.line} is missing a year`)
    }
  }
}

// Field mapping JSON -> Prisma per t-008's spec §4. `line`/`raw` are dropped
// (no durable meaning post-import); `rewatch` maps directly (already an Int
// in the source, not the Boolean BROWSE-UX.md originally proposed).
function toCreateInput(entry: ImportedEntry) {
  return {
    userId: 1,
    year: entry.year,
    mediaType: entry.mediaType as MediaType,
    title: entry.title,
    starred: entry.starred,
    rewatch: entry.rewatch,
    releaseYear: entry.releaseYear,
    watchedMonth: entry.watchedMonth,
    watchedDay: entry.watchedDay,
    dateRaw: entry.dateRaw,
    season: entry.season,
    author: entry.author,
    pageCount: entry.pageCount,
    durationHours: entry.durationHours,
    issueCount: entry.issueCount,
    issueRange: entry.issueRange,
    notes: entry.notes,
    sourceFile: entry.sourceFile,
  }
}

function createSeedPrismaClient(): PrismaClient {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) throw new Error('DATABASE_URL is missing')
  return new PrismaClient({ adapter: new PrismaMariaDb(databaseUrl) })
}

async function main() {
  const WRITE = process.argv.includes('--write')
  const FORCE = process.argv.includes('--force')

  const entries = loadEntries()
  validateEntries(entries)
  console.log(`Parsed ${entries.length} media entries from ${DATA_PATH}.`)

  if (!WRITE) {
    console.log(
      `[dry run] Data is valid. Would insert ${entries.length} MediaEntry rows. Re-run with --write to apply.`,
    )
    return
  }

  const prisma = createSeedPrismaClient()
  try {
    const existing = await prisma.mediaEntry.count()
    if (existing > 0 && !FORCE) {
      throw new Error(
        `MediaEntry already has ${existing} row(s). This is a one-time historical backfill with no dedupe key -- re-running would create duplicate rows for genuine re-watches. Pass --force to insert anyway.`,
      )
    }

    const result = await prisma.mediaEntry.createMany({
      data: entries.map(toCreateInput),
    })

    const after = await prisma.mediaEntry.count()
    console.log(
      `Inserted ${result.count} rows. Total MediaEntry rows now: ${after}.`,
    )
  } finally {
    await prisma.$disconnect()
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
}
