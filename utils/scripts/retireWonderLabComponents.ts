// /utils/scripts/retireWonderLabComponents.ts
//
// Step (b) of docs/wonderlab-component-retirement-policy.md: set a deleted
// component's Component row to RETIRED with a statusReason.
//
// The policy describes this as an admin-UI action, which made it the one part
// of interface-vision t-074 an agent session could not finish -- the files were
// deleted and merged, but the rows still read as "missing" rather than
// deliberately retired. It does not have to be a UI action: it is three column
// writes, and a script can be reviewed, repeated and run from CI where the
// database is actually reachable.
//
// SAFETY. This script only ever sets `status` and `statusReason`, only on rows
// it matches by exact componentName, and never deletes anything -- the museum
// record (the Component row and its Reactions) is the point of the policy and
// survives untouched. It is idempotent: a row already RETIRED is reported and
// skipped. Pass --dry-run to see the plan without writing.
//
// Usage:
//   npx tsx utils/scripts/retireWonderLabComponents.ts --dry-run
//   npx tsx utils/scripts/retireWonderLabComponents.ts
//
// Needs DATABASE_URL (plus the DATABASE_SSL_CA* the ProxySQL handshake wants).
// Run it from the `Retire WonderLab Components` workflow when you have no
// direct route to the database.

import { PrismaClient } from '~/prisma/generated/prisma/client'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import { buildDatabaseConfig } from '~/server/utils/databaseAdapterConfig'

/**
 * componentName -> why it went. The reason is the durable half: a RETIRED row
 * with no explanation is only marginally better than a missing one.
 */
const RETIREMENTS: Record<string, string> = {
  SlotReelGallery:
    'Retired 2026-08-04 (interface-vision t-074). Lost its only production mount when the gallery-vocabulary consolidation dropped dream-gallery’s private reel/hero/swipe modes for the shared Cards/Heroes/Icons. Superseded by kr-gallery + the object card. Source deleted in kind_robots; reviews preserved here.',
  HeroShowcase:
    'Retired 2026-08-04 (interface-vision t-074). Unmounted by the same gallery-vocabulary consolidation; the hero presentation it offered is now the shared gallery’s Heroes mode. Source deleted in kind_robots; reviews preserved here.',
  SwipeDeck:
    'Retired 2026-08-04 (interface-vision t-074). Unmounted by the same consolidation, and reviewed by Silas in its own header: "makes me think I’m at risk of deleting something instead of navigating." Source deleted in kind_robots; reviews preserved here.',
}

const dryRun = process.argv.includes('--dry-run')

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) {
  console.error('❌ DATABASE_URL is missing.')
  process.exit(2)
}

const db = new PrismaClient({
  adapter: new PrismaMariaDb(buildDatabaseConfig(databaseUrl)),
})

const names = Object.keys(RETIREMENTS)
const rows = await db.component.findMany({
  where: { componentName: { in: names } },
  select: { id: true, componentName: true, status: true, isDiscovered: true },
})

const seen = new Set(rows.map((r) => r.componentName))
for (const missing of names.filter((n) => !seen.has(n))) {
  // Not an error: a component that was never discovered has no row to retire.
  console.log(`⚠️  ${missing}: no Component row, nothing to retire`)
}

let changed = 0
for (const row of rows) {
  if (row.status === 'RETIRED') {
    console.log(`✅ ${row.componentName}: already RETIRED, left alone`)
    continue
  }

  if (dryRun) {
    console.log(`🔎 ${row.componentName}: would set ${row.status} -> RETIRED`)
    changed += 1
    continue
  }

  await db.component.update({
    where: { id: row.id },
    data: {
      status: 'RETIRED',
      statusReason: RETIREMENTS[row.componentName],
    },
  })
  console.log(`🗿 ${row.componentName}: ${row.status} -> RETIRED`)
  changed += 1
}

console.log(
  dryRun
    ? `\n🔎 Dry run: ${changed} row(s) would change. Reviews and rows are never deleted.`
    : `\n🗿 Retired ${changed} component(s). isDiscovered flips on the next reconcile.`,
)

await db.$disconnect()
