// /utils/scripts/enqueueButterflyGalleryMotion.ts
//
// Queue the regenerated Butterfly Gallery motion assets (see
// stores/seeds/butterflyGalleryMotionPrompts.ts for the intent).
//
// Two stages, because the character clips need a re-keyed first frame:
//   --stage stills   Kontext re-stages the butterfly/robot reference images on
//                    a flat key colour.
//   --stage videos   LTX clips. The runway clips start from the live
//                    runway-background.png; the character clips start from the
//                    finished stills named with --butterfly-still <path> and
//                    --robot-still <path> (local PNG/WebP files downloaded
//                    from the completed stage-one jobs).
//
// DRY RUN BY DEFAULT. /api/art/enqueue has no idempotency key, so --write twice
// queues duplicates. Usage:
//   npx tsx utils/scripts/enqueueButterflyGalleryMotion.ts --stage stills [--write]
//   npx tsx utils/scripts/enqueueButterflyGalleryMotion.ts --stage videos \
//     --butterfly-still a.png --robot-still b.png [--write]
//   (add --only runway to queue just the runway clips in the videos stage)
import { readFile } from 'node:fs/promises'
import {
  butterflyGalleryMotionPrompts,
  butterflyGalleryStillPrompts,
} from '../../stores/seeds/butterflyGalleryMotionPrompts'

const args = process.argv.slice(2)
const flag = (name: string): string | null => {
  const index = args.indexOf(name)
  return index >= 0 ? (args[index + 1] ?? null) : null
}

const WRITE = args.includes('--write')
const STAGE = flag('--stage')
const ONLY = flag('--only')
const PRIORITY = Number(flag('--priority') ?? 0)
const PROJECT_SLUG = 'butterfly-gallery'
const BASE_URL = process.env.KR_BASE_URL || 'https://kindrobots.org'
const API_TOKEN = process.env.KR_API_TOKEN || ''
const ASSET_BASE = `${BASE_URL}/images/butterfly-gallery`
const FPS = 16

async function fetchBase64(url: string): Promise<string> {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Could not fetch ${url}: ${response.status}`)
  return Buffer.from(await response.arrayBuffer()).toString('base64')
}

async function enqueue(body: Record<string, unknown>, label: string) {
  if (!WRITE) {
    console.log(`WOULD  ${label}`)
    return
  }
  if (!API_TOKEN) throw new Error('KR_API_TOKEN is required with --write.')
  const response = await fetch(`${BASE_URL}/api/art/enqueue`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': API_TOKEN },
    body: JSON.stringify(body),
  })
  const result = (await response.json().catch(() => null)) as {
    success?: boolean
    message?: string
    data?: { jobId?: number }
  } | null
  if (!response.ok || !result?.success)
    throw new Error(
      `${label}: HTTP ${response.status} ${result?.message || '(no message)'}`,
    )
  console.log(`QUEUED ${label} -> job #${result.data?.jobId}`)
}

async function queueStills() {
  for (const still of butterflyGalleryStillPrompts) {
    await enqueue(
      {
        engine: 'kontext',
        priority: PRIORITY,
        projectSlug: PROJECT_SLUG,
        promptString: still.promptString,
        width: still.width,
        height: still.height,
        sourceImageBase64: await fetchBase64(`${ASSET_BASE}/${still.sourceFile}`),
        isPublic: false,
        isMature: false,
      },
      still.requestId,
    )
  }
}

async function firstFrameFor(firstFrame: string): Promise<string> {
  if (firstFrame === 'butterfly-keyed' || firstFrame === 'robot-keyed') {
    const path = flag(
      firstFrame === 'butterfly-keyed' ? '--butterfly-still' : '--robot-still',
    )
    if (!path) throw new Error(`--${firstFrame.split('-')[0]}-still is required.`)
    return (await readFile(path)).toString('base64')
  }
  return fetchBase64(`${ASSET_BASE}/${firstFrame}`)
}

async function queueVideos() {
  for (const clip of butterflyGalleryMotionPrompts) {
    if (ONLY && !clip.key.startsWith(ONLY)) continue
    await enqueue(
      {
        engine: 'ltx',
        priority: PRIORITY,
        projectSlug: PROJECT_SLUG,
        promptString: clip.promptString,
        negativePrompt: clip.negativePrompt,
        width: clip.width,
        height: clip.height,
        durationSeconds: clip.durationSeconds,
        fps: FPS,
        loop: clip.loop,
        outputFormat: 'webp',
        renderScale: 1,
        firstImageBase64: await firstFrameFor(clip.firstFrame),
        isPublic: false,
        isMature: false,
      },
      clip.requestId,
    )
  }
}

async function main() {
  if (STAGE === 'stills') await queueStills()
  else if (STAGE === 'videos') await queueVideos()
  else throw new Error('Pass --stage stills or --stage videos.')
  if (!WRITE) console.log('\nDry run only. Re-run with --write to queue.')
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
