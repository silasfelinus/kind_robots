// scripts/seed_kr_logo_art_image.ts
//
// Idempotent seed for the Kind Robots logo's ArtImage row
// (digital-storefront/t-003, item 1: "seed a real KR-logo Product/POD SKU
// -- currently MISSING entirely, no artImageId, no catalog row").
//
// Why an ArtImage row and not a new non-art-dependent SKU shape: PrintJob's
// artImageId FK is required and non-nullable (prisma/schema.prisma), and
// checkPrintEligibility (server/api/art/utils/printEligibility.ts) is
// fundamentally ArtImage-shaped -- every POD-fulfilling path in this repo
// (pod-checkout.post.ts, checkout.post.ts, the webhook's shared
// createPrintJobIfEligible) already assumes one. Inventing a parallel
// non-ArtImage SKU shape would need a schema change, which is out of this
// task's scope. The Kind Robots logo already exists as a static asset
// (public/icon-512x512.png, wired as the PWA icon in nuxt.config.ts) -- this
// script gives it a real ArtImage row that points at that same file instead
// of generating new art, so it can ride the existing pipeline unchanged.
//
// storefrontFeatured: true is what actually makes it purchasable today: the
// live, working path is /api/art/storefront-featured -> giftshop-interact.vue's
// "Featured prints" grid -> addFeaturedPrint -> the general cart -> checkout.post.ts
// -> the webhook's handleGiftshopCartPurchase -> a real PrintJob. This is the
// same live path every other real print already uses -- no route or component
// changes needed. (A separate, dedicated Product/POD SKU with its own price via
// pod-checkout.post.ts was considered and rejected: that route is orphaned dead
// code with no reachable caller, see its own header comment -- creating a
// Product row for it would be an inert row with no live checkout path to use it.)
//
// checkpointResourceId is left null so checkPrintEligibility's base-model
// branch applies ("no checkpoint/LoRA override" -- eligible unconditionally).
//
// Wired into scripts/vercel-build.mjs's production-deploy maintenance step
// (alongside seed_achievements.ts/seed_contenders.ts) so this row reconciles
// itself on every production deploy instead of needing a one-off manual run.
//
// Usage:
//   npx tsx scripts/seed_kr_logo_art_image.ts            # dry run (default)
//   npx tsx scripts/seed_kr_logo_art_image.ts --write    # apply

import 'dotenv/config'
import { fileURLToPath } from 'node:url'
import { PrismaClient } from '../prisma/generated/prisma/client'
import { createDatabaseAdapter } from '../server/utils/databaseAdapterConfig'

function createSeedPrismaClient(): PrismaClient {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) throw new Error('DATABASE_URL is missing')

  // This seed runs during Vercel production builds. Reuse the application's
  // single adapter factory so it inherits the serverless connection cap,
  // minimumIdle=0, ProxySQL TLS settings, and text-protocol policy instead of
  // silently creating @prisma/adapter-mariadb's default 10-connection pool.
  return new PrismaClient({ adapter: createDatabaseAdapter(databaseUrl) })
}

// fileName is the idempotency key: ArtImage has no unique slug column, so a
// stable, human-recognizable fileName that nothing else would plausibly seed
// stands in for one (same approach as looking a row up by a would-be-unique
// business key before create).
export const KR_LOGO_FILE_NAME = 'kind-robots-logo.png'
export const KR_LOGO_IMAGE_PATH = '/icon-512x512.png'

export type KrLogoArtImageData = {
  userId: number
  fileName: string
  imagePath: string
  path: string
  isPublic: boolean
  isMature: boolean
  isActive: boolean
  storefrontFeatured: boolean
  checkpointResourceId: null
  promptString: string
}

export const krLogoArtImageData: KrLogoArtImageData = {
  userId: 10, // app-wide default/system owner id, matching ArtImage's own @default(10)
  fileName: KR_LOGO_FILE_NAME,
  imagePath: KR_LOGO_IMAGE_PATH,
  path: KR_LOGO_IMAGE_PATH,
  isPublic: true,
  isMature: false,
  isActive: true,
  storefrontFeatured: true,
  checkpointResourceId: null,
  promptString: 'Kind Robots logo',
}

async function main() {
  const WRITE = process.argv.includes('--write')

  console.log(
    `Would upsert one ArtImage row for '${KR_LOGO_FILE_NAME}' (storefrontFeatured: true).`,
  )

  if (!WRITE) {
    console.log('[dry run] Re-run with --write to apply.')
    return
  }

  const prisma = createSeedPrismaClient()
  try {
    const existing = await prisma.artImage.findFirst({
      where: { fileName: KR_LOGO_FILE_NAME },
      select: { id: true },
    })

    if (existing) {
      await prisma.artImage.update({
        where: { id: existing.id },
        data: krLogoArtImageData,
      })
      console.log(`Updated existing ArtImage #${existing.id}.`)
    } else {
      const created = await prisma.artImage.create({
        data: krLogoArtImageData,
      })
      console.log(`Created ArtImage #${created.id}.`)
    }
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
