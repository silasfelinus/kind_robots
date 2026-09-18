// /utils/scripts/enqueueButterflyGalleryArt.ts
//
// Queue the five static art assets butterfly-gallery/t-011 asks for (room,
// window, frame, bins, pile — see stores/seeds/butterflyGalleryArtPrompts.ts
// for why they are five separate assets rather than one composition).
//
// UNLIKE enqueuePageBackdropArt.ts, this does NOT write to Prisma directly —
// this environment has no live DATABASE_URL. It builds the same Krea 2 COMFY
// workflow that script builds (via the same buildKrea2WorkflowFromRequest
// used everywhere else in the app) and POSTs to the live
// POST /api/art/queue endpoint over HTTPS, authenticated with the admin
// KR_API_TOKEN (requireMachineUser accepts it as x-api-key). The endpoint
// runs enrichArtJobPayload/assertArtPromptContract itself, so this script
// does not duplicate that step.
//
// DRY RUN BY DEFAULT, matching enqueuePageBackdropArt.ts.
//
// Usage:
//   npx tsx utils/scripts/enqueueButterflyGalleryArt.ts             # dry run
//   npx tsx utils/scripts/enqueueButterflyGalleryArt.ts --write     # queue
//
// PRIORITY 200 per the roadmap task note (butterfly-gallery/t-011): ahead of
// the page-backdrop band (100) and the plain facet backlog (0) — Silas asked
// for this project's art specifically prioritized.
import { butterflyGalleryArtPrompts } from '../../stores/seeds/butterflyGalleryArtPrompts'
import {
  KREA2_DEFAULT_CFG,
  KREA2_DEFAULT_STEPS,
  buildKrea2WorkflowFromRequest,
} from '../../server/api/comfy/krea2/utils/workflow'

const WRITE = process.argv.includes('--write')
const PRIORITY = 200
const PROJECT_SLUG = 'butterfly-gallery'
const BASE_URL = process.env.KR_BASE_URL || 'https://kindrobots.org'
const API_TOKEN = process.env.KR_API_TOKEN || ''

async function main() {
  const requestIds = butterflyGalleryArtPrompts.map((entry) => entry.requestId)
  if (new Set(requestIds).size !== requestIds.length) {
    throw new Error('butterfly gallery art request IDs must be unique')
  }

  console.log(
    `Butterfly Gallery art: ${butterflyGalleryArtPrompts.length} asset(s) to queue at priority ${PRIORITY}.`,
  )

  for (const entry of butterflyGalleryArtPrompts) {
    const { workflow, seed } = buildKrea2WorkflowFromRequest({
      prompt: entry.promptString,
      negativePrompt: entry.negativePrompt,
      width: entry.width,
      height: entry.height,
      steps: KREA2_DEFAULT_STEPS,
      cfg: KREA2_DEFAULT_CFG,
    })

    const body = {
      engine: 'COMFY',
      priority: PRIORITY,
      projectSlug: PROJECT_SLUG,
      idempotencyKey: entry.requestId,
      payload: {
        promptString: entry.promptString,
        negativePrompt: entry.negativePrompt,
        width: entry.width,
        height: entry.height,
        steps: KREA2_DEFAULT_STEPS,
        cfg: KREA2_DEFAULT_CFG,
        seed,
        workflow,
        imagePath: entry.imagePath,
        save: {
          isPublic: true,
          isMature: false,
          designer: 'Kind Robots / Butterfly Gallery',
        },
      },
    }

    console.log(
      `${WRITE ? 'QUEUE ' : 'WOULD '}  ${entry.asset.padEnd(8)} ${String(entry.width).padStart(4)}x${entry.height}  ${entry.imagePath}`,
    )

    if (!WRITE) continue

    if (!API_TOKEN) {
      throw new Error('KR_API_TOKEN is required to queue with --write.')
    }

    const response = await fetch(`${BASE_URL}/api/art/queue`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': API_TOKEN,
      },
      body: JSON.stringify(body),
    })

    const result = (await response.json().catch(() => null)) as {
      success?: boolean
      message?: string
      data?: { job?: { id?: number }; deduplicated?: boolean }
    } | null

    if (!response.ok || !result?.success) {
      throw new Error(
        `Failed to queue ${entry.requestId}: HTTP ${response.status} ${result?.message || '(no message)'}`,
      )
    }

    console.log(
      `  -> job #${result.data?.job?.id} ${result.data?.deduplicated ? '(deduplicated, already existed)' : '(created)'}`,
    )
  }

  if (!WRITE) {
    console.log(
      `\nDry run only. Re-run with --write to queue ${butterflyGalleryArtPrompts.length} ArtJob(s) against ${BASE_URL}.`,
    )
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
