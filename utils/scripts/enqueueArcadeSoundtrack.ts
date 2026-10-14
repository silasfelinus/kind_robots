// Queue the arcade soundtrack (kind_robots #3606, kr-arcade/t-155) as ACE-Step
// ArtJobs through the same /api/art/enqueue path the music videos use.
//
// Every briefed cue in utils/arcade/soundtrackBriefs.ts becomes one private,
// instrumental job under projectSlug kr-arcade, keyed by `designer` so a cue
// that already has a PENDING, RUNNING or DONE job is skipped. Default is a dry
// run that only lists what it would queue; --apply sends the jobs.
//
//   npx tsx utils/scripts/enqueueArcadeSoundtrack.ts            # preview
//   npx tsx utils/scripts/enqueueArcadeSoundtrack.ts --apply    # queue
//   npx tsx utils/scripts/enqueueArcadeSoundtrack.ts --apply --only gloom-invaders
//
// Env: KR_API_TOKEN (admin token or user API key; never printed),
//      KR_API_BASE (default https://kindrobots.org).
import 'dotenv/config'
import { arcadeSoundtrackEntries } from '../arcade/soundtrackBriefs'
import {
  ARCADE_AUDIO_LIVE_STATUSES,
  ARCADE_AUDIO_PROJECT_SLUG,
  arcadeAudioDedupeNeedle,
  buildArcadeAudioEnqueueRequest,
} from '../../server/utils/arcadeAudioJobs'

const BASE = (process.env.KR_API_BASE || 'https://kindrobots.org').replace(
  /\/$/,
  '',
)
const TOKEN = process.env.KR_API_TOKEN?.trim() || ''
const APPLY = process.argv.includes('--apply')
const onlyIndex = process.argv.indexOf('--only')
const ONLY = onlyIndex === -1 ? null : (process.argv[onlyIndex + 1] ?? null)

type QueueJob = { id: number; status: string; payload?: unknown }

function headers(): Record<string, string> {
  return {
    Authorization: `Bearer ${TOKEN}`,
    'Content-Type': 'application/json',
  }
}

async function existingJobs(): Promise<QueueJob[]> {
  const response = await fetch(
    `${BASE}/api/art/queue?projectSlug=${ARCADE_AUDIO_PROJECT_SLUG}&pageSize=200`,
    { headers: headers() },
  )
  if (!response.ok) {
    throw new Error(`GET /api/art/queue failed: HTTP ${response.status}`)
  }
  const body = (await response.json()) as { data?: unknown }
  const data = body.data as
    QueueJob[] | { jobs?: QueueJob[]; items?: QueueJob[] } | undefined
  if (Array.isArray(data)) return data
  return data?.jobs ?? data?.items ?? []
}

function priorJob(jobs: QueueJob[], jobKey: string): QueueJob | undefined {
  const needle = arcadeAudioDedupeNeedle(jobKey)
  const live = new Set<string>(ARCADE_AUDIO_LIVE_STATUSES)
  return jobs.find((job) => {
    if (!live.has(job.status)) return false
    const payload =
      typeof job.payload === 'string'
        ? job.payload
        : JSON.stringify(job.payload ?? '')
    return payload.replace(/\\"/g, '"').includes(needle)
  })
}

async function main() {
  if (!TOKEN) {
    console.error('KR_API_TOKEN is not set (put it in .env or the shell).')
    process.exitCode = 2
    return
  }
  const jobs = await existingJobs()
  const entries = arcadeSoundtrackEntries().filter(
    (entry) => !ONLY || entry.owner === ONLY,
  )
  let queued = 0
  let skipped = 0
  let failed = 0
  for (const entry of entries) {
    const prior = priorJob(jobs, entry.jobKey)
    if (prior) {
      skipped += 1
      console.log(`skip    ${entry.jobKey}  (job #${prior.id} ${prior.status})`)
      continue
    }
    const request = buildArcadeAudioEnqueueRequest(entry.owner, entry.cue)
    if (!request) continue
    if (!APPLY) {
      console.log(
        `would   ${entry.jobKey}  ${request.durationSeconds}s ${request.bpm ?? '-'}bpm  ${request.promptString.slice(0, 70)}`,
      )
      continue
    }
    const response = await fetch(`${BASE}/api/art/enqueue`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(request),
    })
    const body = (await response.json().catch(() => ({}))) as {
      message?: string
      data?: { id?: number; jobId?: number; job?: { id?: number } }
    }
    const jobId = body.data?.jobId ?? body.data?.id ?? body.data?.job?.id
    if (response.ok) {
      queued += 1
      console.log(`queued  ${entry.jobKey}  -> job #${jobId ?? '?'}`)
    } else {
      failed += 1
      console.log(
        `FAILED  ${entry.jobKey}  HTTP ${response.status} ${body.message ?? ''}`,
      )
    }
  }
  console.log(
    APPLY
      ? `\n${queued} queued, ${skipped} already queued, ${failed} failed.`
      : `\nDry run: ${entries.length - skipped} to queue, ${skipped} already queued. Re-run with --apply.`,
  )
  if (failed) process.exitCode = 1
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
