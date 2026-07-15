// utils/scripts/migratePromptsToArtJobs.ts
//
// One-time migration: convert pending legacy "art_prompts" work — Prompt rows
// still sitting in the bolted-on art queue (artStatus PENDING/QUEUED/GENERATING
// with no finished image) — into durable ArtJob rows, so the home relay drains
// them like everything else. Consolidates onto ArtJob as the single source of
// truth (see /api/art/enqueue).
//
// Each migrated Prompt gets:
//   - a new ArtJob (engine A1111, payload built from artPrompt/prompt + imagePath)
//   - artStatus cleared to null so it is not double-processed by the deprecated
//     /api/prompts/generate driver.
//
// Usage (tsx, matching backfillSlugs.ts — the repo is ESM):
//   npm run migrate:art-jobs            # dry run (default)
//   npm run migrate:art-jobs -- --write # apply

import 'dotenv/config'
import { PrismaClient } from './../../prisma/generated/prisma/client'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) throw new Error('DATABASE_URL is missing')

const prisma = new PrismaClient({ adapter: new PrismaMariaDb(databaseUrl) })

const WRITE = process.argv.includes('--write')

// Prompt.userId is optional (default 1); ArtJob.userId is required.
const FALLBACK_USER_ID = 1

// Live (unfinished) legacy queue states worth migrating.
const PENDING_STATES = ['PENDING', 'QUEUED', 'GENERATING'] as const

async function main() {
  const prompts = await prisma.prompt.findMany({
    where: {
      artStatus: { in: [...PENDING_STATES] },
      artImageId: null,
    },
    select: {
      id: true,
      userId: true,
      prompt: true,
      artPrompt: true,
      imagePath: true,
      isPublic: true,
      isMature: true,
      artStatus: true,
    },
  })

  if (!prompts.length) {
    console.log('No pending Prompt art-queue rows to migrate.')
    return
  }

  for (const prompt of prompts) {
    const promptString = (prompt.artPrompt ?? prompt.prompt ?? '').trim()
    console.log(
      `Prompt #${prompt.id} [${prompt.artStatus}] → ArtJob (user ${prompt.userId ?? FALLBACK_USER_ID})` +
        `  "${promptString.slice(0, 60)}"`,
    )
  }

  if (!WRITE) {
    console.log(
      `\nDry run: ${prompts.length} Prompt row(s) would become ArtJob(s). Re-run with --write to apply.`,
    )
    return
  }

  let migrated = 0
  let skipped = 0

  for (const prompt of prompts) {
    const promptString = (prompt.artPrompt ?? prompt.prompt ?? '').trim()

    if (!promptString) {
      // Nothing to render — just clear the stale queue state.
      await prisma.prompt.update({
        where: { id: prompt.id },
        data: { artStatus: null },
      })
      skipped++
      continue
    }

    // Migrate + clear atomically so a row is never both queued and pending.
    await prisma.$transaction([
      prisma.artJob.create({
        data: {
          engine: 'A1111',
          userId: prompt.userId ?? FALLBACK_USER_ID,
          payload: JSON.stringify({
            promptString,
            imagePath: prompt.imagePath ?? null,
            migratedFromPromptId: prompt.id,
            save: {
              isPublic: prompt.isPublic,
              isMature: prompt.isMature,
              designer: null,
            },
          }),
        },
      }),
      prisma.prompt.update({
        where: { id: prompt.id },
        data: { artStatus: null },
      }),
    ])

    migrated++
  }

  console.log(
    `\nMigrated ${migrated} Prompt row(s) into ArtJob; cleared ${skipped} empty row(s).`,
  )
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
