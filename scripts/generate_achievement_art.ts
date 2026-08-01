// /scripts/generate_achievement_art.ts
//
// Creates durable, deduplicated ArtJobs for every Achievement that has an
// artPrompt but no attached image. The normal relay renders each job, creates
// the ArtImage, and entity-art completion attaches imagePath/artImageId back to
// the Achievement. No image generation or filesystem write happens in this
// script.
//
// Usage:
//   npm run generate:achievement-art
//   npm run generate:achievement-art -- --write

import 'dotenv/config'
import { fileURLToPath } from 'node:url'
import {
  createScriptPrismaClient,
  withDatabaseRetry,
} from './lib/databaseRetry'

const PROJECT_SLUG = 'achievements'
const SEED_USER_ID = 10
const ACTIVE_JOB_STATUSES = ['PENDING', 'RUNNING'] as const

function entityMarker(achievementId: number): string {
  return `"entityType":"achievement","entityId":${achievementId}`
}

export function buildAchievementArtPayload(achievement: {
  id: number
  triggerCode: string | null
  artPrompt: string | null
}) {
  const promptString = String(achievement.artPrompt || '').trim()
  if (!promptString) {
    throw new Error(`Achievement ${achievement.id} has no artPrompt`)
  }

  return {
    promptString,
    negativePrompt:
      'readable text, caption, watermark, signature, logo, UI, frame, border',
    width: 1024,
    height: 1024,
    steps: 28,
    cfg: 3,
    save: {
      isPublic: true,
      isMature: false,
      designer: 'achievement-catalog',
    },
    entityArt: {
      entityType: 'achievement',
      entityId: achievement.id,
      field: 'imagePath',
      preserveOriginal: true,
      mode: 'recreate',
    },
    achievement: {
      triggerCode: achievement.triggerCode,
    },
  }
}

async function main() {
  const WRITE = process.argv.includes('--write')

  await withDatabaseRetry('achievement artwork queue', async () => {
    const prisma = createScriptPrismaClient()
    try {
      const achievements = await prisma.achievement.findMany({
        where: {
          AND: [
            { artPrompt: { not: null } },
            { OR: [{ imagePath: null }, { imagePath: '' }] },
          ],
        },
        orderBy: { id: 'asc' },
        select: {
          id: true,
          label: true,
          triggerCode: true,
          artPrompt: true,
        },
      })

      let queued = 0
      let reused = 0

      for (const achievement of achievements) {
        const existing = await prisma.artJob.findFirst({
          where: {
            projectSlug: PROJECT_SLUG,
            userId: SEED_USER_ID,
            status: { in: [...ACTIVE_JOB_STATUSES] },
            payload: { contains: entityMarker(achievement.id) },
          },
          orderBy: { createdAt: 'desc' },
        })

        if (existing) {
          reused += 1
          console.log(
            `  reuse ArtJob ${existing.id}: ${achievement.triggerCode} — ${achievement.label}`,
          )
          continue
        }

        if (!WRITE) {
          console.log(
            `  [dry run] queue: ${achievement.triggerCode} — ${achievement.label}`,
          )
          continue
        }

        const job = await prisma.artJob.create({
          data: {
            engine: 'A1111',
            userId: SEED_USER_ID,
            projectSlug: PROJECT_SLUG,
            priority: 5,
            payload: JSON.stringify(buildAchievementArtPayload(achievement)),
          },
        })

        queued += 1
        console.log(
          `  queued ArtJob ${job.id}: ${achievement.triggerCode} — ${achievement.label}`,
        )
      }

      console.log(
        WRITE
          ? `Achievement art: ${queued} queued, ${reused} active job(s) reused, ${achievements.length} missing image(s) inspected.`
          : `[dry run] ${achievements.length - reused} job(s) would be queued; ${reused} active job(s) already exist.`,
      )
    } finally {
      await prisma.$disconnect()
    }
  })
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
}
