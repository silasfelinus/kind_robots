// scripts/generate_achievement_art.ts
//
// Backfills raster art for site achievements ("jellybeans"). For every
// Achievement that has an `artPrompt` but no `imagePath`, it:
//   1. generates an image from the prompt via the site's OpenAI image pipeline
//      (server/utils/openAIImageGenerator.ts),
//   2. downloads the result to images/achievements/<triggerCode>.png under the
//      configured IMAGES_PATH (default: public/images),
//   3. creates an ArtImage row and points the Achievement at it
//      (imagePath + artImageId).
//
// It is re-runnable: achievements that already have an `imagePath` are skipped,
// so a partial run can be resumed. Running without --write previews what would
// be generated without calling OpenAI or touching the database.
//
// Requires OPENAI_API_KEY and DATABASE_URL in the environment. This is NOT run
// as part of the achievements wiring change — the site renders each achievement
// by its `icon` until art is backfilled here.
//
// Usage:
//   npx tsx scripts/generate_achievement_art.ts            # dry run (default)
//   npx tsx scripts/generate_achievement_art.ts --write    # generate + persist

import 'dotenv/config'
import { fileURLToPath } from 'node:url'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { PrismaClient } from '../prisma/generated/prisma/client'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import { generateImageWithOpenAI } from '../server/utils/openAIImageGenerator'
import { getImageStorageRoot } from '../server/utils/imageStorageRoot'
import { slugify } from '../utils/slugify'

const IMAGE_ROOT = getImageStorageRoot()
const ART_SUBDIR = 'achievements'
// Achievements seeded by the seed script share userId 10 (guest) as owner, the
// same default ArtImage.userId uses elsewhere.
const SEED_USER_ID = 10

function createSeedPrismaClient(): PrismaClient {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) throw new Error('DATABASE_URL is missing')
  return new PrismaClient({ adapter: new PrismaMariaDb(databaseUrl) })
}

async function downloadToImageStorage(url: string, slug: string): Promise<string> {
  const relPath = `${ART_SUBDIR}/${slug}.png`
  const absPath = resolve(IMAGE_ROOT, relPath)
  await mkdir(dirname(absPath), { recursive: true })

  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to download image (${res.status})`)
  const bytes = Buffer.from(await res.arrayBuffer())
  await writeFile(absPath, bytes)

  // Public paths remain stable regardless of the filesystem backing store.
  return `/images/${relPath}`
}

async function main() {
  const WRITE = process.argv.includes('--write')
  const prisma = createSeedPrismaClient()

  try {
    const pending = await prisma.achievement.findMany({
      where: {
        AND: [
          { artPrompt: { not: null } },
          { OR: [{ imagePath: null }, { imagePath: '' }] },
        ],
      },
    })

    console.log(
      `${pending.length} achievement(s) need art (have artPrompt, missing imagePath).`,
    )

    if (!WRITE) {
      for (const a of pending) {
        console.log(`  [dry run] would generate: ${a.triggerCode} — ${a.label}`)
      }
      console.log('Re-run with --write to generate and persist.')
      return
    }

    let done = 0
    for (const achievement of pending) {
      const slug = slugify(achievement.triggerCode ?? String(achievement.id))
      try {
        const url = await generateImageWithOpenAI(
          achievement.artPrompt as string,
          'achievement-seeder',
        )
        const imagePath = await downloadToImageStorage(url, slug)

        const artImage = await prisma.artImage.create({
          data: {
            userId: SEED_USER_ID,
            fileName: `${slug}.png`,
            fileType: 'png',
            promptString: achievement.artPrompt,
            artPrompt: achievement.artPrompt,
            imagePath,
            path: imagePath,
            designer: 'achievement-seeder',
            isPublic: true,
          },
        })

        await prisma.achievement.update({
          where: { id: achievement.id },
          data: { imagePath, artImageId: artImage.id },
        })

        done += 1
        console.log(`  ...${done}/${pending.length} ${achievement.triggerCode} -> ${imagePath}`)
      } catch (error) {
        console.error(`  ! Failed for ${achievement.triggerCode}:`, error)
      }
    }

    console.log(`Done. Generated art for ${done}/${pending.length} achievement(s).`)
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
