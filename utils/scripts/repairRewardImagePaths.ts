// /utils/scripts/repairRewardImagePaths.ts
//
// Reward.imagePath lost its /images root, so 214 of 227 rewards render the
// HTML app shell instead of art.
//
// WHAT IS WRONG. Every stored Reward.imagePath begins `/rewards/...`. The real
// files live one level down, under `/images/rewards/...`, which Vercel 307s to
// the media host. Measured against production on 2026-08-04:
//
//     227  rewards with an imagePath
//      13  serve a real image today  (the only ones with a committed file
//          under public/rewards/, which is a separate, tracked directory)
//     214  serve text/html — a 142 KB Nuxt app shell, at HTTP 200
//     208  resolve to a real webp once /images is prefixed
//
// Rewriting the prefix fixes 195 and regresses ZERO: all 13 that work today
// also resolve under /images. The 19 that stay broken are genuinely absent
// from the media host — art backlog, not a path problem, and out of scope here.
//
// WHY NOTHING CAUGHT IT. `/rewards/anything.webp` does not 404. It falls
// through to the SPA catch-all and returns 200 with the app shell, so every
// status-code check — curl, monitors, link checkers — reads it as healthy.
// Only a consumer that tries to DECODE the bytes can tell, which is why the
// responsive-layout audit flagged just one reward (Molt-Jar, which has no
// imagePath at all and falls back to a path that genuinely 404s).
//
// THE RULE IS NOT NEW. server/utils/artJobNormalization.ts's
// normalizeKindRobotsImagePath already rewrites `rewards/` -> `images/rewards/`
// and has since art-job ingestion was written; it was simply never applied to
// the rows that predate it. This script reuses that same prefix rule rather
// than inventing a second definition of "legacy reward path".
//
//   npx tsx utils/scripts/repairRewardImagePaths.ts            # report only
//   npx tsx utils/scripts/repairRewardImagePaths.ts --apply    # write
//
// The database is not reachable from an agent sandbox (TCP to the ProxySQL
// port is blocked), so --apply runs from .github/workflows/repair-reward-image-paths.yml.
import 'dotenv/config'
import { PrismaClient } from './../../prisma/generated/prisma/client'
import { createDatabaseAdapter } from './../../server/utils/databaseAdapterConfig'

/** The legacy prefix, and the root it should have carried all along. */
const LEGACY_PREFIX = '/rewards/'
const CORRECT_PREFIX = '/images/rewards/'

/**
 * The single rewrite rule, pure so it can be tested without a database.
 *
 * Returns null when the value needs no change — already rooted at /images,
 * an absolute URL, an /api/art serving route (what cardPath/heroPath/iconPath
 * use), or empty. Only the bare legacy prefix is rewritten.
 */
export function repairedRewardImagePath(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const path = value.trim()
  if (!path.startsWith(LEGACY_PREFIX)) return null
  return `${CORRECT_PREFIX}${path.slice(LEGACY_PREFIX.length)}`
}

async function main(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) throw new Error('DATABASE_URL is missing')

  const apply = process.argv.includes('--apply')
  const prisma = new PrismaClient({
    adapter: createDatabaseAdapter(databaseUrl),
  })

  const rewards = await prisma.reward.findMany({
    select: { id: true, name: true, imagePath: true },
    orderBy: { id: 'asc' },
  })

  const repairs = rewards
    .map((reward) => ({
      reward,
      next: repairedRewardImagePath(reward.imagePath),
    }))
    .filter(
      (entry): entry is { reward: (typeof rewards)[number]; next: string } =>
        Boolean(entry.next),
    )

  const withPath = rewards.filter((reward) => reward.imagePath).length
  console.log(
    `📜 ${rewards.length} rewards, ${withPath} with an imagePath, ${repairs.length} still on the legacy /rewards root`,
  )

  if (!repairs.length) {
    console.log('✅ Nothing to repair.')
    await prisma.$disconnect()
    return
  }

  for (const { reward, next } of repairs.slice(0, 10)) {
    console.log(
      `   ${reward.id} ${reward.name ?? ''} — ${reward.imagePath} → ${next}`,
    )
  }
  if (repairs.length > 10) console.log(`   …and ${repairs.length - 10} more`)

  if (!apply) {
    console.log('\n🔍 Dry run. Re-run with --apply to write these changes.')
    await prisma.$disconnect()
    return
  }

  let updated = 0
  for (const { reward, next } of repairs) {
    await prisma.reward.update({
      where: { id: reward.id },
      data: { imagePath: next },
    })
    updated += 1
  }

  console.log(`✅ Updated ${updated} reward imagePath value(s).`)
  await prisma.$disconnect()
}

// Importable for the self-test without running the migration.
if (process.argv[1]?.endsWith('repairRewardImagePaths.ts')) {
  main().catch((error: unknown) => {
    console.error(
      `❌ ${error instanceof Error ? error.message : String(error)}`,
    )
    process.exitCode = 1
  })
}
