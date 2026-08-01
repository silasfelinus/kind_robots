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
import { buildKrea2WorkflowFromRequest } from '../server/api/comfy/krea2/utils/workflow'
import { enrichArtJobPayload } from '../server/utils/artJobProvenance'
import {
  createScriptPrismaClient,
  withDatabaseRetry,
} from './lib/databaseRetry'

const PROJECT_SLUG = 'achievements'
const SEED_USER_ID = 10

export const ACHIEVEMENT_ART_ENGINE = 'COMFY' as const
export const ACHIEVEMENT_ART_VERSION = 'comfy-krea2-v1'

export function achievementEntityMarker(achievementId: number): string {
  return `"entityType":"achievement","entityId":${achievementId},`
}

export function achievementArtVersionMarker(): string {
  return `"achievementArtVersion":"${ACHIEVEMENT_ART_VERSION}"`
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

  const negativePrompt =
    'readable text, caption, watermark, signature, logo, UI, frame, border'
  const { workflow, seed } = buildKrea2WorkflowFromRequest({
    prompt: promptString,
    negativePrompt,
    width: 1024,
    height: 1024,
    steps: 8,
    cfg: 1,
  })

  return enrichArtJobPayload(
    ACHIEVEMENT_ART_ENGINE,
    {
      promptString,
      negativePrompt,
      width: 1024,
      height: 1024,
      steps: 8,
      cfg: 1,
      seed,
      workflow,
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
      achievementArtVersion: ACHIEVEMENT_ART_VERSION,
      achievement: {
        triggerCode: achievement.triggerCode,
      },
    },
    {
      projectSlug: PROJECT_SLUG,
      idempotencyKey: `achievement:${achievement.id}:${ACHIEVEMENT_ART_VERSION}`,
      requireCompletionProof: true,
    },
  ).payload
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
            AND: [
              { payload: { contains: achievementEntityMarker(achievement.id) } },
              { payload: { contains: achievementArtVersionMarker() } },
            ],
          },
          orderBy: { createdAt: 'desc' },
        })

        if (existing) {
          reused += 1
          console.log(
            `  reuse ArtJob ${existing.id} (${existing.status}): ${achievement.triggerCode} — ${achievement.label}`,
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
            engine: ACHIEVEMENT_ART_ENGINE,
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
          ? `Achievement art: ${queued} queued, ${reused} same-version job(s) reused, ${achievements.length} missing image(s) inspected.`
          : `[dry run] ${achievements.length - reused} job(s) would be queued; ${reused} same-version job(s) already exist.`,
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
