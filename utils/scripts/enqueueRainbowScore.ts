// Queue Rainbow Bullet Hell Space Princess's recorded space-opera score (Silas's second playtest, 2026-10-19)
// as ACE-Step ArtJobs through /api/art/enqueue, the path the arcade soundtrack and the music videos use.
//
// Every brief in utils/arcade/games/rainbowRecordedScore.ts becomes one private, instrumental job keyed by
// `designer`, so a cue that already has a PENDING, RUNNING or DONE job is skipped. Default is a dry run;
// --apply sends the jobs, --only <cue id> limits it to one cue. The opening music video's thrash track
// (rainbowOpening.ts, t-034) queues the same way: --only opening.
//
//   npx tsx utils/scripts/enqueueRainbowScore.ts
//   npx tsx utils/scripts/enqueueRainbowScore.ts --apply
//
// Env: KR_API_TOKEN (never printed), KR_API_BASE (default https://kindrobots.org).
import 'dotenv/config'
import {
  RAINBOW_SCORE_BRIEFS,
  rainbowScoreJobKey,
} from '../arcade/games/rainbowRecordedScore'
import { RAINBOW_OPENING_TRACK } from '../arcade/games/rainbowOpening'
import {
  ARCADE_AUDIO_LIVE_STATUSES,
  ARCADE_AUDIO_PROJECT_SLUG,
  arcadeAudioDedupeNeedle,
  arcadeAudioSeed,
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

const headers = () => ({
  Authorization: `Bearer ${TOKEN}`,
  'Content-Type': 'application/json',
})

async function existingJobs(): Promise<QueueJob[]> {
  const response = await fetch(
    `${BASE}/api/art/queue?projectSlug=${ARCADE_AUDIO_PROJECT_SLUG}&pageSize=200`,
    { headers: headers() },
  )
  if (!response.ok)
    throw new Error(`GET /api/art/queue failed: HTTP ${response.status}`)
  const body = (await response.json()) as { data?: unknown }
  const data = body.data as
    QueueJob[] | { jobs?: QueueJob[]; items?: QueueJob[] } | undefined
  if (Array.isArray(data)) return data
  return data?.jobs ?? data?.items ?? []
}

function priorJob(jobs: QueueJob[], jobKey: string) {
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
  let queued = 0
  let skipped = 0
  let failed = 0
  const briefs = [
    ...RAINBOW_SCORE_BRIEFS.map((brief) => ({
      ...brief,
      jobKey: rainbowScoreJobKey(brief.id),
    })),
    {
      ...RAINBOW_OPENING_TRACK,
      jobKey: `rainbow-score:v1:${RAINBOW_OPENING_TRACK.id}`,
    },
  ]
  for (const brief of briefs) {
    if (ONLY && brief.id !== ONLY) continue
    const jobKey = brief.jobKey
    const prior = priorJob(jobs, jobKey)
    if (prior) {
      skipped++
      console.log(`skip    ${jobKey}  (job #${prior.id} ${prior.status})`)
      continue
    }
    const request = {
      engine: 'acestep',
      promptString: brief.prompt,
      lyrics: '',
      durationSeconds: brief.seconds,
      bpm: brief.bpm,
      seed: arcadeAudioSeed(jobKey),
      isPublic: false,
      designer: jobKey,
      projectSlug: ARCADE_AUDIO_PROJECT_SLUG,
    }
    if (!APPLY) {
      console.log(
        `would   ${jobKey}  ${brief.seconds}s ${brief.bpm}bpm  ${brief.prompt.slice(-70)}`,
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
      queued++
      console.log(`queued  ${jobKey}  -> job #${jobId ?? '?'}`)
    } else {
      failed++
      console.log(
        `FAILED  ${jobKey}  HTTP ${response.status} ${body.message ?? ''}`,
      )
    }
  }
  console.log(
    APPLY
      ? `\n${queued} queued, ${skipped} already queued, ${failed} failed.`
      : `\nDry run: ${skipped} already queued. Re-run with --apply.`,
  )
  if (failed) process.exitCode = 1
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
