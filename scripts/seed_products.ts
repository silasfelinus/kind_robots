// scripts/seed_products.ts
//
// Idempotent seed for the digital-storefront v1 catalog (Product table).
// Upserts by `slug` (unique), so re-running never creates duplicates and
// always brings existing rows in sync with this file.
//
// Step 1 of digital-storefront/t-011's build order (SPEC.md §9): only the
// Mermaids of Venice PDF product is seeded here. Later steps (webhook,
// secure download route, subscription/mana-topup/DLC/POD products) extend
// this catalog array rather than introducing a second seed mechanism.
//
// Usage:
//   npx tsx scripts/seed_products.ts            # dry run (default)
//   npx tsx scripts/seed_products.ts --write    # apply

import 'dotenv/config'
import { fileURLToPath } from 'node:url'
import { PrismaClient } from '../prisma/generated/prisma/client'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'

function createSeedPrismaClient(): PrismaClient {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) throw new Error('DATABASE_URL is missing')
  return new PrismaClient({ adapter: new PrismaMariaDb(databaseUrl) })
}

type ProductSeed = {
  slug: string
  type:
    'DIGITAL_PDF' | 'POD' | 'SUBSCRIPTION' | 'MANA_TOPUP' | 'DLC' | 'DONATION'
  title: string
  priceCents: number
}

// PRICE cleared by Silas 2026-07-05 (digital-storefront/t-010): $9.99, second
// edition manuscript. File is served from authenticated server-side storage,
// never public/ — wiring that delivery path is t-011's next step, not here.
const productCatalog: ProductSeed[] = [
  {
    slug: 'mermaids-of-venice-pdf',
    type: 'DIGITAL_PDF',
    title: 'Mermaids of Venice (Second Edition, PDF)',
    priceCents: 999,
  },
]

export function validateCatalog(): void {
  const slugs = productCatalog.map((p) => p.slug)
  if (slugs.some((slug) => !slug)) {
    throw new Error('Every product must have a slug')
  }
  if (new Set(slugs).size !== slugs.length) {
    throw new Error('Duplicate slugs in productCatalog')
  }
}

export async function upsertProduct(
  prisma: PrismaClient,
  product: ProductSeed,
): Promise<void> {
  const { slug, ...data } = product
  await prisma.product.upsert({
    where: { slug },
    update: data,
    create: { slug, ...data },
  })
}

async function main() {
  const WRITE = process.argv.includes('--write')

  validateCatalog()
  console.log(`Parsed ${productCatalog.length} products from the catalog.`)

  // A dry run only validates the catalog, so it never needs a database.
  if (!WRITE) {
    console.log(
      `[dry run] Catalog is valid. Would upsert ${productCatalog.length} product(s) by slug. Re-run with --write to apply.`,
    )
    return
  }

  const prisma = createSeedPrismaClient()
  try {
    const before = await prisma.product.count()
    console.log(`Existing products in DB: ${before}`)

    let done = 0
    for (const product of productCatalog) {
      await upsertProduct(prisma, product)
      done += 1
      console.log(`  ...${done}/${productCatalog.length} ${product.slug}`)
    }

    const after = await prisma.product.count()
    console.log(`Done. Totals now: ${after} products.`)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the CLI only when executed directly, not when imported.
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
}
