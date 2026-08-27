#!/usr/bin/env node
// scripts/queue_cthulhuquarium_voice_art.mjs
//
// cthulhuquarium/t-023 -- queue portrait art for Charlotte Fishmonger and
// Wilbur Stint's Character + Bot records (created by
// seed_cthulhuquarium_voices.mjs). Standing 2026-07-06 rule: no per-image
// approval needed for generated project/entity art.
//
// Uses POST /api/art/enqueue (engine: krea2) with an `entityArt` target so
// the relay's normal completion path attaches the finished image back to
// the record's primary art field itself -- same mechanism
// scripts/generate_achievement_art.ts documents, just called over the live
// admin API instead of a direct DB write (conductor holds KR_API_TOKEN, not
// a DB credential).
//
// Usage:
//   KR_API_TOKEN=... node scripts/queue_cthulhuquarium_voice_art.mjs           # dry run
//   KR_API_TOKEN=... node scripts/queue_cthulhuquarium_voice_art.mjs --commit  # enqueue

const BASE = (process.env.APP_BASE_URL || 'https://kindrobots.org').replace(
  /\/$/,
  '',
)
const TOKEN = process.env.KR_API_TOKEN || ''
const commit = process.argv.includes('--commit')

const NEGATIVE_PROMPT =
  'readable text, caption, watermark, signature, logo, UI, frame, border, extra fingers, extra limbs'

const jobs = [
  {
    label: 'Character: Charlotte Fishmonger',
    entityType: 'character',
    entityId: 3305,
    field: 'imagePath',
    prompt:
      'Portrait of a warm, immaculately put-together woman in her fifties, working at a Victorian-era aquarium shop counter. Crisp cardigan over a tidy blouse, hair perfectly set, a genuine warm smile. Soft, glowing green-lit aquarium background, brass and glass tanks. Cheerful, welcoming, entirely composed -- no hint of anything sinister. Warm lighting, cozy illustrated style.',
  },
  {
    label: 'Character: Wilbur Stint',
    entityType: 'character',
    entityId: 3306,
    field: 'imagePath',
    prompt:
      'Portrait of a young man, bespectacled, with thinning shoulder-length hair cut unevenly, working at a Victorian-style aquarium. Stained work apron with sleeves rolled up, visible bandages and a couple of missing fingers on his hands, small scars and scratches. Earnest, tired, warm expression -- not pitiable, a person trying hard and getting by. Soft green-lit aquarium background, brass and glass tanks. Cozy illustrated style, warm lighting.',
  },
  {
    label: 'Bot: Charlotte Fishmonger',
    entityType: 'bot',
    entityId: 1836,
    field: 'avatarImage',
    prompt:
      'Portrait of a warm, immaculately put-together woman in her fifties, working at a Victorian-era aquarium shop counter. Crisp cardigan over a tidy blouse, hair perfectly set, a genuine warm smile. Soft, glowing green-lit aquarium background, brass and glass tanks. Cheerful, welcoming, entirely composed -- no hint of anything sinister. Warm lighting, cozy illustrated style.',
  },
  {
    label: 'Bot: Wilbur Stint',
    entityType: 'bot',
    entityId: 1837,
    field: 'avatarImage',
    prompt:
      'Portrait of a young man, bespectacled, with thinning shoulder-length hair cut unevenly, working at a Victorian-style aquarium. Stained work apron with sleeves rolled up, visible bandages and a couple of missing fingers on his hands, small scars and scratches. Earnest, tired, warm expression -- not pitiable, a person trying hard and getting by. Soft green-lit aquarium background, brass and glass tanks. Cozy illustrated style, warm lighting.',
  },
]

async function enqueueOne(job) {
  const res = await fetch(`${BASE}/api/art/enqueue`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${TOKEN}`,
    },
    body: JSON.stringify({
      engine: 'krea2',
      promptString: job.prompt,
      negativePrompt: NEGATIVE_PROMPT,
      width: 1024,
      height: 1024,
      steps: 8,
      cfg: 1,
      isPublic: true,
      isMature: false,
      designer: 'silasfelinus',
      entityArt: {
        entityType: job.entityType,
        entityId: job.entityId,
        field: job.field,
        preserveOriginal: false,
        mode: 'recreate',
      },
    }),
  })
  let body = null
  try {
    body = await res.json()
  } catch {
    /* non-JSON error body */
  }
  return { ok: res.ok && body?.success !== false, status: res.status, body }
}

async function main() {
  if (commit && !TOKEN) {
    console.error('KR_API_TOKEN is required in --commit mode.')
    process.exit(1)
  }

  console.log(
    `cthulhuquarium/t-023: ${commit ? 'COMMIT' : 'dry run'} -- queueing voice portrait art`,
  )

  if (!commit) {
    for (const job of jobs)
      console.log(
        `[dry-run] would enqueue ${job.label} (${job.entityType} ${job.entityId}.${job.field})`,
      )
    console.log('Dry run only -- re-run with --commit to enqueue.')
    return
  }

  const failures = []
  for (const job of jobs) {
    const result = await enqueueOne(job)
    if (result.ok) {
      console.log(
        `enqueued ${job.label} -- ArtJob ${result.body?.data?.jobId ?? result.body?.data?.id ?? '?'}`,
      )
    } else {
      failures.push(
        `${job.label}: HTTP ${result.status} ${result.body?.message || JSON.stringify(result.body)}`,
      )
    }
  }

  if (failures.length) {
    console.log(`Failures (${failures.length}):`)
    failures.forEach((f) => console.log('  - ' + f))
    process.exit(1)
  }
}

main().catch((e) => {
  console.error(e?.message || e)
  process.exit(1)
})
