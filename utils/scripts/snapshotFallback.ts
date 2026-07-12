// utils/scripts/snapshotFallback.ts
//
// Nightly public-content snapshot for graceful degradation.
//
// Dumps the public rows of each registered model to stores/fallback/<key>.json
// so the frontend can render real content while the database is unreachable
// (the conductorStore fallback pattern, generalized). Snapshots are committed
// by .github/workflows/fallback-snapshot.yml, so git history doubles as a
// rolling, versioned record of public content.
//
// Privacy rules, enforced by construction:
//   - every model uses an explicit `select` allowlist — new schema fields
//     stay OUT of snapshots until someone adds them here on purpose
//   - models with an isPublic flag are filtered to isPublic: true
//   - no relations, no blob columns (ArtImage.imageData never appears),
//     no localPath/secretNotes-style server internals, and no User rows
//
// Usage (tsx, not ts-node — the repo is ESM and ts-node can't resolve the
// generated client's extensionless imports under Node's ESM loader):
//   npx tsx utils/scripts/snapshotFallback.ts            # write snapshots
//   npx tsx utils/scripts/snapshotFallback.ts --dry-run  # report only

import 'dotenv/config'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { PrismaClient } from './../../prisma/generated/prisma/client'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) throw new Error('DATABASE_URL is missing')

// The mariadb driver's default connectTimeout is 1000ms, and GitHub-hosted
// runners take longer than that to open a socket to the database host — every
// model failed with "failed to create socket" until this was raised. Query
// params survive the adapter's mysql:// → mariadb:// rewrite.
const withConnectTimeout = (url: string, ms: number): string => {
  const parsed = new URL(url)
  if (!parsed.searchParams.has('connectTimeout')) {
    parsed.searchParams.set('connectTimeout', String(ms))
  }
  return parsed.toString()
}

const prisma = new PrismaClient({
  adapter: new PrismaMariaDb(withConnectTimeout(databaseUrl, 30_000)),
})

const dryRun = process.argv.includes('--dry-run')

const OUT_DIR = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../stores/fallback',
)

type SnapshotSpec = {
  /** stores/fallback/<key>.json */
  key: string
  /** prisma delegate name */
  delegate: string
  /** row filter — include isPublic: true wherever the model has the flag */
  where?: Record<string, unknown>
  /** explicit field allowlist */
  select: Record<string, true>
  /** newest rows win when the cap is hit */
  cap: number
}

const fields = (...names: string[]): Record<string, true> =>
  Object.fromEntries(names.map((name) => [name, true]))

const SNAPSHOTS: SnapshotSpec[] = [
  {
    key: 'bots',
    delegate: 'bot',
    where: { isPublic: true },
    cap: 200,
    select: fields(
      'id',
      'createdAt',
      'updatedAt',
      'BotType',
      'name',
      'slug',
      'subtitle',
      'description',
      'avatarImage',
      'botIntro',
      'userIntro',
      'prompt',
      'theme',
      'personality',
      'modules',
      'sampleResponse',
      'tagline',
      'isPublic',
      'underConstruction',
      'userId',
      'imagePath',
      'designer',
      'isMature',
      'isActive',
      'artPrompt',
      'chatBorderImage',
    ),
  },
  {
    key: 'prompts',
    delegate: 'prompt',
    where: { isPublic: true },
    cap: 300,
    select: fields(
      'id',
      'createdAt',
      'updatedAt',
      'prompt',
      'userId',
      'botId',
      'isMature',
      'isPublic',
      'isActive',
      'imagePath',
      'artPrompt',
    ),
  },
  {
    key: 'characters',
    delegate: 'character',
    where: { isPublic: true },
    cap: 200,
    select: fields(
      'id',
      'createdAt',
      'updatedAt',
      'name',
      'slug',
      'achievements',
      'alignment',
      'experience',
      'level',
      'class',
      'species',
      'backstory',
      'drive',
      'quirks',
      'genre',
      'isPublic',
      'userId',
      'honorific',
      'imagePath',
      'designer',
      'personality',
      'isMature',
      'isActive',
      'charm',
      'empathy',
      'grace',
      'luck',
      'might',
      'wits',
      'presentation',
      'role',
      'title',
      'gender',
      'artPrompt',
    ),
  },
  {
    key: 'scenarios',
    delegate: 'scenario',
    where: { isPublic: true },
    cap: 200,
    // secretNotes intentionally omitted — it is authored as hidden GM notes
    select: fields(
      'id',
      'createdAt',
      'updatedAt',
      'title',
      'slug',
      'description',
      'intros',
      'userId',
      'imagePath',
      'locations',
      'artPrompt',
      'genres',
      'inspirations',
      'isMature',
      'isPublic',
      'isActive',
      'difficulty',
      'tier',
      'group',
      'cast',
      'outputType',
    ),
  },
  {
    key: 'rewards',
    delegate: 'reward',
    where: { isPublic: true },
    cap: 500,
    select: fields(
      'id',
      'createdAt',
      'updatedAt',
      'name',
      'slug',
      'description',
      'flavorText',
      'effect',
      'icon',
      'collection',
      'rarity',
      'rewardType',
      'userId',
      'imagePath',
      'artPrompt',
      'isMature',
      'isPublic',
      'isActive',
    ),
  },
  {
    // Achievements have no isPublic flag — every row is a game definition
    key: 'achievements',
    delegate: 'achievement',
    cap: 500,
    select: fields(
      'id',
      'createdAt',
      'updatedAt',
      'label',
      'message',
      'icon',
      'karma',
      'pageHint',
      'subtleHint',
      'triggerCode',
      'tooltip',
      'isActive',
      'isRepeatable',
      'imagePath',
      'artPrompt',
    ),
  },
  {
    key: 'themes',
    delegate: 'theme',
    where: { isPublic: true },
    cap: 100,
    select: fields(
      'id',
      'createdAt',
      'name',
      'values',
      'userId',
      'isPublic',
      'tagline',
      'room',
      'colorScheme',
      'prefersDark',
      'isActive',
      'artPrompt',
    ),
  },
  {
    key: 'resources',
    delegate: 'resource',
    where: { isPublic: true },
    cap: 200,
    // localPath intentionally omitted — server filesystem detail
    select: fields(
      'id',
      'createdAt',
      'updatedAt',
      'name',
      'slug',
      'customLabel',
      'MediaPath',
      'customUrl',
      'civitaiUrl',
      'huggingUrl',
      'description',
      'isMature',
      'resourceType',
      'userId',
      'imagePath',
      'generation',
      'supportedServer',
      'isPublic',
      'isActive',
      'artPrompt',
    ),
  },
  {
    // Component catalog has no isPublic flag — it describes the UI itself
    key: 'components',
    delegate: 'component',
    cap: 500,
    select: fields(
      'id',
      'createdAt',
      'updatedAt',
      'folderName',
      'componentName',
      'isWorking',
      'underConstruction',
      'isBroken',
      'title',
      'notes',
    ),
  },
  {
    key: 'smartIcons',
    delegate: 'smartIcon',
    where: { isPublic: true },
    cap: 500,
    select: fields(
      'id',
      'createdAt',
      'updatedAt',
      'title',
      'type',
      'designer',
      'userId',
      'icon',
      'label',
      'link',
      'component',
      'isPublic',
      'description',
      'category',
      'modelType',
      'isMature',
    ),
  },
]

const jsonReplacer = (_key: string, value: unknown): unknown =>
  typeof value === 'bigint' ? value.toString() : value

type AnyDelegate = {
  findMany: (args: {
    where?: Record<string, unknown>
    select: Record<string, true>
    orderBy: Record<string, string>
    take: number
  }) => Promise<Record<string, unknown>[]>
}

async function snapshotModel(spec: SnapshotSpec): Promise<string> {
  const delegate = (prisma as unknown as Record<string, AnyDelegate>)[
    spec.delegate
  ]
  if (!delegate?.findMany) {
    throw new Error(`Unknown prisma delegate: ${spec.delegate}`)
  }

  const rows = await delegate.findMany({
    where: spec.where,
    select: spec.select,
    orderBy: { id: 'desc' },
    take: spec.cap,
  })

  // Stored oldest-first so diffs stay stable as new rows append
  rows.reverse()

  const payload = {
    model: spec.key,
    rowCount: rows.length,
    cap: spec.cap,
    rows,
  }

  const outPath = path.join(OUT_DIR, `${spec.key}.json`)
  const json = JSON.stringify(payload, jsonReplacer, 2) + '\n'

  if (!dryRun) {
    fs.writeFileSync(outPath, json)
  }

  const kb = (Buffer.byteLength(json) / 1024).toFixed(1)
  const capped = rows.length >= spec.cap ? ' (CAPPED — older rows dropped)' : ''
  return `${spec.key}: ${rows.length} rows, ${kb} KB${capped}`
}

async function main() {
  if (!dryRun) fs.mkdirSync(OUT_DIR, { recursive: true })

  const failures: string[] = []

  for (const spec of SNAPSHOTS) {
    try {
      console.log(`✅ ${await snapshotModel(spec)}`)
    } catch (error) {
      failures.push(spec.key)
      console.error(`❌ ${spec.key}:`, error)
    }
  }

  await prisma.$disconnect()

  if (failures.length) {
    console.error(`Snapshot failed for: ${failures.join(', ')}`)
    process.exit(1)
  }

  console.log(dryRun ? 'Dry run complete.' : `Snapshots written to ${OUT_DIR}`)
}

main()
