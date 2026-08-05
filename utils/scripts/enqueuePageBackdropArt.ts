// /utils/scripts/enqueuePageBackdropArt.ts
//
// Queue the page backdrop art, ahead of the facet backlog.
//
// Silas, 2026-08-05: "the art for these backgrounds is a higher priority than
// the 3000 ish facets currently in the queue. Feel free to create prompts and
// submit priority art for this project as appropriate."
//
// Usage:
//   npm run seed:page-backdrops             # dry run — prints what it would do
//   npm run seed:page-backdrops -- --write  # create the missing ArtJob rows
//
// DRY RUN BY DEFAULT, matching enqueueTwistedFairyTalesArtPrompts.ts. Queue
// writes are the kind of thing you want to look at before doing.
//
// WHY PRIORITY 100. The relay claims work `ORDER BY priority DESC, id ASC`
// (server/api/art/queue/claim.post.ts). The facet backlog never sets a priority,
// so it sits at the schema default of 0; the Twisted Fairy Tales batch sits at
// 10. The number is not decorative — it is the only thing that moves these to
// the front of "the 3000 ish facets".
//
// 100 specifically, rather than any other clearing value, because migration
// 20260805071500_prioritize_taskmaster_art_jobs already established it as THE
// rush band by raising the pending Taskmaster package to exactly 100. A
// different number here would leave two competing conventions for "ahead of the
// backlog", and queue order would then depend on which convention a given batch
// happened to use. Backdrop art is the same class of work as that package —
// Stage 3 art that is being waited on — so it belongs in the same band rather
// than straddling it.
//
// IDEMPOTENT. Jobs are matched by the `requestId` inside their payload, so
// re-running only fills gaps. That matters more than usual here: a second run
// that duplicated the batch would put 30 redundant jobs AHEAD of 3000 real
// ones.
import 'dotenv/config'
import prisma from './../../server/utils/prisma'
import { pageBackdropArtPrompts } from './../../stores/seeds/pageBackdropArtPrompts'

const WRITE = process.argv.includes('--write')
const REFRESH_FAILED = process.argv.includes('--refresh-failed')
const USER_ID = Number(process.env.ART_SEED_USER_ID || 1)
const PROJECT_SLUG = 'page-backdrops'
const PRIORITY = 100

function requestIdFromPayload(payload: string): string | null {
  try {
    const parsed = JSON.parse(payload) as Record<string, unknown>
    return typeof parsed.requestId === 'string' ? parsed.requestId : null
  } catch {
    return null
  }
}

function buildPayload(entry: (typeof pageBackdropArtPrompts)[number]): string {
  return JSON.stringify({
    requestId: entry.requestId,
    title: entry.title,
    page: entry.page,
    variant: entry.variant,
    promptString: entry.promptString,
    negativePrompt: entry.negativePrompt,
    width: entry.width,
    height: entry.height,
    imagePath: entry.imagePath,
    save: {
      isPublic: true,
      isMature: false,
      designer: 'Kind Robots / Page Backdrops',
    },
  })
}

async function main() {
  if (!Number.isInteger(USER_ID) || USER_ID <= 0) {
    throw new Error('ART_SEED_USER_ID must be a positive integer')
  }

  const requestIds = pageBackdropArtPrompts.map((entry) => entry.requestId)
  if (new Set(requestIds).size !== requestIds.length) {
    throw new Error('page backdrop request IDs must be unique')
  }

  // Every path must land where the frontmatter says it will. A prompt whose
  // imagePath disagrees with content/<page>.md generates art nothing renders.
  for (const entry of pageBackdropArtPrompts) {
    const expected = `background/${entry.page}-${entry.variant}.webp`
    if (entry.imagePath !== expected) {
      throw new Error(
        `${entry.requestId}: imagePath ${entry.imagePath} does not match the ` +
          `frontmatter convention ${expected}`,
      )
    }
  }

  const existingJobs = await prisma.artJob.findMany({
    where: { projectSlug: PROJECT_SLUG, userId: USER_ID },
    select: { id: true, status: true, payload: true },
  })

  const existingByRequestId = new Map<string, { id: number; status: string }>()
  for (const job of existingJobs) {
    const requestId = requestIdFromPayload(job.payload)
    if (requestId) existingByRequestId.set(requestId, job)
  }

  const missing = pageBackdropArtPrompts.filter(
    (entry) => !existingByRequestId.has(entry.requestId),
  )

  /*
   * FAILED jobs are re-runnable, and a plain requestId match would hide them.
   *
   * The idempotency above keys on requestId alone, which is right for avoiding
   * duplicates but wrong for recovery: a job that FAILED still has its
   * requestId, so it reports EXISTS forever and can never be retried by
   * re-running this script. That is the opposite of what you want after a bad
   * batch.
   *
   * --refresh-failed rewrites those jobs' payloads from the CURRENT prompt
   * definitions and returns them to PENDING. Rewriting rather than merely
   * re-queueing is the point: if a job failed because the prompt or the canvas
   * was wrong, /api/art/queue/[id]/reenqueue puts the same bad payload back and
   * it fails again. This picks up whatever the seed file says now.
   */
  const failed = pageBackdropArtPrompts.filter(
    (entry) => existingByRequestId.get(entry.requestId)?.status === 'FAILED',
  )

  console.log(
    `Page backdrops: ${pageBackdropArtPrompts.length} prompt(s) across ` +
      `${new Set(pageBackdropArtPrompts.map((e) => e.page)).size} page(s), ` +
      `${pageBackdropArtPrompts.length - missing.length} already queued, ` +
      `${missing.length} missing.`,
  )

  for (const entry of pageBackdropArtPrompts) {
    const existing = existingByRequestId.get(entry.requestId)
    console.log(
      `${existing ? 'EXISTS' : WRITE ? 'QUEUE ' : 'WOULD '}  ` +
        `${entry.page.padEnd(12)} ${entry.variant.padEnd(8)} ` +
        `${String(entry.width).padStart(4)}x${entry.height}  ${entry.imagePath}` +
        `${existing ? ` (#${existing.id}, ${existing.status})` : ''}`,
    )
  }

  if (failed.length) {
    console.log(
      `\n${failed.length} job(s) are FAILED. ${
        REFRESH_FAILED
          ? 'Refreshing their payloads from the current prompts and re-queueing.'
          : 'Re-run with --refresh-failed to rewrite their payloads from the current prompts and re-queue them.'
      }`,
    )
  }

  if (!WRITE) {
    console.log(
      `\nDry run only. Re-run with --write to create ${missing.length} ArtJob ` +
        `row(s) at priority ${PRIORITY} (ahead of the facet backlog at 0)` +
        `${REFRESH_FAILED && failed.length ? ` and refresh ${failed.length} failed job(s)` : ''}.`,
    )
    return
  }

  if (REFRESH_FAILED && failed.length) {
    for (const entry of failed) {
      const job = existingByRequestId.get(entry.requestId)
      if (!job) continue
      await prisma.artJob.update({
        where: { id: job.id },
        data: {
          payload: buildPayload(entry),
          status: 'PENDING',
          priority: PRIORITY,
          // Clear the previous attempt so the relay treats this as fresh work
          // rather than something already tried and abandoned.
          attempts: 0,
          error: null,
          claimedBy: null,
        },
      })
    }
    console.log(`Refreshed ${failed.length} failed job(s) back to PENDING.`)
  }

  if (!missing.length) {
    console.log('\nNothing to add.')
    return
  }

  const created = await prisma.$transaction(
    missing.map((entry) =>
      prisma.artJob.create({
        data: {
          engine: 'A1111',
          priority: PRIORITY,
          projectSlug: PROJECT_SLUG,
          userId: USER_ID,
          payload: buildPayload(entry),
        },
      }),
    ),
  )

  console.log(
    `\nQueued ${created.length} page backdrop ArtJob row(s) at priority ${PRIORITY}.`,
  )
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
