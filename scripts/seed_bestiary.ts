// scripts/seed_bestiary.ts
//
// cthulhuquarium/t-008 -- seed the fish bible into the Monster table.
//
// The bible (silasfelinus/cthulhuquarium, fish/*.yaml) is the canonical source
// of truth for all 151 creatures; this table is DOWNSTREAM of it, never the
// other way around. Re-running after a bible edit updates rows rather than
// duplicating them, because every upsert is keyed on the unique `slug`.
//
// It NEVER deletes. A creature dropped from the bible gets `isActive: false`,
// per the bible's own rule -- someone's save may reference it. That also means
// a bible path typo cannot wipe the bestiary: see the SAFETY RAIL below.
//
// Fish tagged `ruler-hooked` are seeded here too. That IS the whole shared
// bestiary mechanism -- sharing is the `games` column on the row, not
// membership in a second table -- so it costs nothing extra.
//
// Usage:
//   npx tsx scripts/seed_bestiary.ts                    # dry run (default)
//   npx tsx scripts/seed_bestiary.ts --write            # apply
//   npx tsx scripts/seed_bestiary.ts --bible <path>     # explicit bible dir
//   npx tsx scripts/seed_bestiary.ts --strict           # exit 1 on any warning

import 'dotenv/config'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse as parseYaml } from 'yaml'
import type { PrismaClient } from '../prisma/generated/prisma/client'
import {
  createScriptPrismaClient,
  withDatabaseRetry,
} from './lib/databaseRetry'

// The bible lives in a sibling checkout whose location differs between a local
// clone and a remote session container, so look in several places rather than
// guessing one. Same approach as conductor's build_cthulhuquarium_art_queue.py.
const BIBLE_CANDIDATES = [
  resolve(process.cwd(), '../cthulhuquarium/fish'),
  join(homedir(), 'cthulhuquarium', 'fish'),
  '/home/user/cthulhuquarium/fish',
]

// SAFETY RAIL. Deactivation is the one destructive-ish thing this script does,
// and the way it goes wrong is a bible that failed to load: zero species parsed
// means every row in the table looks "dropped from the bible" and the whole
// bestiary gets switched off in one run. A floor makes that impossible to reach
// by accident. 151 is the authored count; 100 leaves room for the bible to
// legitimately shrink without ever letting a near-empty read through.
const MIN_EXPECTED_SPECIES = 100

type Rarity = 'COMMON' | 'UNCOMMON' | 'RARE' | 'EPIC' | 'LEGENDARY' | 'MYTHIC'

interface Species {
  slug: string
  name: string
  species?: string
  class?: string
  field_note?: string
  quirks?: string
  alignment?: string
  rarity: Rarity
  stats: Record<'charm' | 'empathy' | 'grace' | 'might' | 'wits', Rarity>
  size: number
  yield: number
  interval: number
  unlock_cost: number
  behavior: string
  hue: number
  games: string[]
  art_prompt?: string
  evolves_to?: string
  evolution_kind?: 'growth' | 'breeding' | 'secret'
  // cthulhuquarium/t-042: three bible fields that had nowhere to land until
  // Monster grew dedicated columns for them. `tier` here is the bible's OWN
  // 1-5 "how deep into the game" integer -- unrelated to `rarity` above,
  // which is what actually lands on Monster.tier.
  tier?: number
  diet_role?: string
  school_role?: string
}

const warnings: string[] = []
const warn = (message: string) => {
  warnings.push(message)
  console.warn(`  ! ${message}`)
}

function findBible(explicit?: string): string {
  const candidates = explicit ? [resolve(explicit)] : BIBLE_CANDIDATES
  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate
  }
  throw new Error(
    `fish bible not found. Clone silasfelinus/cthulhuquarium beside this repo, ` +
      `or pass --bible <repo>/fish. Looked in: ${candidates.join(', ')}`,
  )
}

function loadBible(dir: string): Species[] {
  const files = readdirSync(dir).filter(
    (f) => f.endsWith('.yaml') && f !== 'SCHEMA.md',
  )
  const species: Species[] = []
  for (const file of files.sort()) {
    const doc = parseYaml(readFileSync(join(dir, file), 'utf8')) as Species
    if (!doc?.slug) continue // SCHEMA.md and any non-species file
    species.push(doc)
  }
  return species
}

// The bible's `rarity` is the collection/economy tier and lands on Monster.tier,
// which is the field aquariumEconomy.ts's deriveFishRarityTier has been waiting
// on. Note this is NOT the bible's own `tier`, which is an unrelated 1-5 "how
// deep into the game" integer with its own `depth` column (cthulhuquarium/t-042).
//
// `luck` gets the same value because the bible has no per-species luck stat and
// SCHEMA.md's field table has always mapped `rarity` onto it. If the bible ever
// authors stats.luck, that should win here.
function toUpsertData(fish: Species) {
  // cthulhuquarium/t-042 added EvolutionKind.SECRET, so all three bible
  // values now map straight across -- no more silent null + warning for
  // 'secret'.
  const kind =
    fish.evolution_kind === 'growth'
      ? ('GROWTH' as const)
      : fish.evolution_kind === 'breeding'
        ? ('BREEDING' as const)
        : fish.evolution_kind === 'secret'
          ? ('SECRET' as const)
          : null

  return {
    name: fish.name,
    species: fish.species ?? null,
    class: fish.class ?? null,
    fieldNote: fish.field_note?.trim() ?? null,
    quirks: fish.quirks?.trim() ?? null,
    alignment: fish.alignment ?? null,
    tier: fish.rarity,
    charm: fish.stats.charm,
    empathy: fish.stats.empathy,
    grace: fish.stats.grace,
    luck: fish.rarity,
    might: fish.stats.might,
    wits: fish.stats.wits,
    size: fish.size,
    yieldPerTick: fish.yield,
    tickIntervalSeconds: fish.interval,
    unlockCost: fish.unlock_cost,
    behavior: fish.behavior,
    // cthulhuquarium/t-042: depth is the bible's own numeric `tier`, and
    // dietRole/schoolRole are its diet_role/school_role -- three fields
    // that previously had no column to land in.
    depth: fish.tier ?? null,
    dietRole: fish.diet_role ?? null,
    schoolRole: fish.school_role ?? null,
    hue: fish.hue,
    games: fish.games.join(','),
    artPrompt: fish.art_prompt?.trim() ?? null,
    evolutionKind: kind,
    isActive: true,
  }
}

async function seed(prisma: PrismaClient, bible: Species[], write: boolean) {
  const bySlug = new Map(bible.map((f) => [f.slug, f]))

  // Pass 1: every row exists before any evolution edge is drawn, because
  // evolvesToId is an FK to Monster.id and a chain's target may sort after its
  // source. Deliberately two passes rather than one clever ordering pass -- the
  // bible has 55 lines and a topological sort here would be all risk, no gain.
  let created = 0
  let updated = 0
  for (const fish of bible) {
    const data = toUpsertData(fish)
    if (!write) {
      const existing = await prisma.monster.findUnique({
        where: { slug: fish.slug },
      })
      if (existing) updated++
      else created++
      continue
    }
    const before = await prisma.monster.findUnique({
      where: { slug: fish.slug },
    })
    await prisma.monster.upsert({
      where: { slug: fish.slug },
      create: { slug: fish.slug, ...data },
      update: data,
    })
    if (before) updated++
    else created++
  }

  // Pass 2: evolution edges, by slug -> id.
  let edges = 0
  if (write) {
    const rows = await prisma.monster.findMany({
      where: { slug: { in: bible.map((f) => f.slug) } },
      select: { id: true, slug: true },
    })
    const idBySlug = new Map(rows.map((r) => [r.slug, r.id]))
    for (const fish of bible) {
      const target = fish.evolves_to ? idBySlug.get(fish.evolves_to) : null
      if (fish.evolves_to && !target) {
        warn(`${fish.slug}: evolves_to '${fish.evolves_to}' has no seeded row`)
        continue
      }
      await prisma.monster.update({
        where: { slug: fish.slug },
        data: { evolvesToId: target ?? null },
      })
      if (target) edges++
    }
  } else {
    edges = bible.filter((f) => f.evolves_to && bySlug.has(f.evolves_to)).length
  }

  // Deactivate, never delete. A creature dropped from the bible may still be
  // referenced by somebody's save.
  const known = bible.map((f) => f.slug)
  const orphans = await prisma.monster.findMany({
    where: { slug: { notIn: known }, isActive: true },
    select: { slug: true },
  })
  if (orphans.length && write) {
    await prisma.monster.updateMany({
      where: { slug: { notIn: known }, isActive: true },
      data: { isActive: false },
    })
  }

  return { created, updated, edges, orphans: orphans.map((o) => o.slug) }
}

async function main() {
  const argv = process.argv.slice(2)
  const write = argv.includes('--write')
  const strict = argv.includes('--strict')
  const bibleFlag = argv.indexOf('--bible')
  const bibleDir = findBible(bibleFlag >= 0 ? argv[bibleFlag + 1] : undefined)

  const bible = loadBible(bibleDir)
  console.log(`bible: ${bibleDir} (${bible.length} species)`)

  if (bible.length < MIN_EXPECTED_SPECIES) {
    throw new Error(
      `only ${bible.length} species parsed from ${bibleDir}, below the floor of ` +
        `${MIN_EXPECTED_SPECIES}. Refusing to run: a partial read would deactivate ` +
        `most of the bestiary. Check the bible path and that the files parse.`,
    )
  }

  const slugs = new Set(bible.map((f) => f.slug))
  if (slugs.size !== bible.length) {
    throw new Error(
      'duplicate slug in the bible -- run its validate_fish.py first',
    )
  }

  const prisma = createScriptPrismaClient()
  try {
    const result = await withDatabaseRetry('seed_bestiary', () =>
      seed(prisma, bible, write),
    )
    console.log(
      `${write ? 'applied' : 'DRY RUN'}: ${result.created} to create, ` +
        `${result.updated} to update, ${result.edges} evolution edges`,
    )
    if (result.orphans.length) {
      console.log(
        `  ${result.orphans.length} row(s) no longer in the bible ` +
          `${write ? 'deactivated' : 'would be deactivated'}: ${result.orphans.join(', ')}`,
      )
    }
    if (warnings.length) {
      console.log(`\n${warnings.length} warning(s)`)
      if (strict) process.exitCode = 1
    }
    if (!write) console.log('\nre-run with --write to apply')
  } finally {
    await prisma.$disconnect()
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error)
    process.exit(1)
  })
}

export { findBible, loadBible, toUpsertData, MIN_EXPECTED_SPECIES }
