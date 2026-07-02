// utils/scripts/backfillSlugs.ts
//
// One-time backfill for the tier-1 optional slugs:
//   - ArtCollection.slug  ← slugified label (curated collections only by default)
//   - Scenario.slug       ← slugified title
//   - Resource.slug       ← slugified customLabel, falling back to name
//   - Milestone.triggerCode is backfilled by the migration itself.
//
// Slugs are optional, so collisions are skipped rather than suffixed — the
// first record wins and the rest stay unslugged for a human to resolve.
//
// Usage:
//   npx ts-node utils/scripts/backfillSlugs.ts            # dry run (default)
//   npx ts-node utils/scripts/backfillSlugs.ts --write    # apply
//   npx ts-node utils/scripts/backfillSlugs.ts --write --collections-all
//     (also slug per-user generated collections, scoped as <slug>-u<userId>)

import 'dotenv/config'
import { PrismaClient } from './../../prisma/generated/prisma/client'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import { slugify } from '../slugify'

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) throw new Error('DATABASE_URL is missing')

const prisma = new PrismaClient({ adapter: new PrismaMariaDb(databaseUrl) })

const WRITE = process.argv.includes('--write')
const ALL_COLLECTIONS = process.argv.includes('--collections-all')

// Auto-generated per-user collections that shouldn't claim global slugs.
const GENERATED_LABEL_PATTERNS = [/^generated art$/i, /'s art$/i]

type Plan = {
  model: string
  id: number
  from: string
  slug: string
}

function isGeneratedLabel(label: string): boolean {
  return GENERATED_LABEL_PATTERNS.some((pattern) => pattern.test(label.trim()))
}

async function planArtCollections(taken: Set<string>): Promise<Plan[]> {
  const rows = await prisma.artCollection.findMany({
    where: { slug: null },
    select: { id: true, userId: true, label: true },
    orderBy: { id: 'asc' },
  })

  const plans: Plan[] = []

  for (const row of rows) {
    const label = row.label?.trim()
    if (!label) continue

    const generated = isGeneratedLabel(label)
    if (generated && !ALL_COLLECTIONS) continue

    const slug = generated ? `${slugify(label)}-u${row.userId}` : slugify(label)

    if (!slug || taken.has(slug)) continue
    taken.add(slug)
    plans.push({ model: 'ArtCollection', id: row.id, from: label, slug })
  }

  return plans
}

async function planScenarios(taken: Set<string>): Promise<Plan[]> {
  const rows = await prisma.scenario.findMany({
    where: { slug: null },
    select: { id: true, title: true },
    orderBy: { id: 'asc' },
  })

  const plans: Plan[] = []

  for (const row of rows) {
    const slug = slugify(row.title)
    if (!slug || taken.has(slug)) continue
    taken.add(slug)
    plans.push({ model: 'Scenario', id: row.id, from: row.title, slug })
  }

  return plans
}

async function planResources(taken: Set<string>): Promise<Plan[]> {
  const rows = await prisma.resource.findMany({
    where: { slug: null },
    select: { id: true, name: true, customLabel: true },
    orderBy: { id: 'asc' },
  })

  const plans: Plan[] = []

  for (const row of rows) {
    const source = row.customLabel?.trim() || row.name
    // Resource names are often literal model filenames — drop the extension
    // so "dreamshaperXL.safetensors" slugs as "dreamshaperxl".
    const slug = slugify(source.replace(/\.(safetensors|ckpt|pt|bin)$/i, ''))
    if (!slug || taken.has(slug)) continue
    taken.add(slug)
    plans.push({ model: 'Resource', id: row.id, from: source, slug })
  }

  return plans
}

async function apply(plans: Plan[]) {
  for (const plan of plans) {
    if (plan.model === 'ArtCollection') {
      await prisma.artCollection.update({
        where: { id: plan.id },
        data: { slug: plan.slug },
      })
    } else if (plan.model === 'Scenario') {
      await prisma.scenario.update({
        where: { id: plan.id },
        data: { slug: plan.slug },
      })
    } else if (plan.model === 'Resource') {
      await prisma.resource.update({
        where: { id: plan.id },
        data: { slug: plan.slug },
      })
    }
  }
}

async function existingSlugs(): Promise<Set<string>> {
  const [collections, scenarios, resources] = await Promise.all([
    prisma.artCollection.findMany({
      where: { slug: { not: null } },
      select: { slug: true },
    }),
    prisma.scenario.findMany({
      where: { slug: { not: null } },
      select: { slug: true },
    }),
    prisma.resource.findMany({
      where: { slug: { not: null } },
      select: { slug: true },
    }),
  ])

  // Slug namespaces are per-table, but sharing one taken-set keeps the
  // ecosystem collision-free (a scenario and collection with the same slug is
  // legal, just confusing) — first-come-first-served within this run.
  return new Set(
    [...collections, ...scenarios, ...resources]
      .map((row) => row.slug)
      .filter((slug): slug is string => Boolean(slug)),
  )
}

async function main() {
  const taken = await existingSlugs()

  const plans = [
    ...(await planArtCollections(taken)),
    ...(await planScenarios(taken)),
    ...(await planResources(taken)),
  ]

  if (!plans.length) {
    console.log('Nothing to backfill — all eligible records already slugged.')
    return
  }

  for (const plan of plans) {
    console.log(`${plan.model} #${plan.id}: "${plan.from}" → ${plan.slug}`)
  }

  if (!WRITE) {
    console.log(
      `\nDry run: ${plans.length} slug(s) planned. Re-run with --write to apply.`,
    )
    return
  }

  await apply(plans)
  console.log(`\nApplied ${plans.length} slug(s).`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
