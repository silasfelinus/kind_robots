// /scripts/cancel_duplicate_facet_jobs.ts
//
// Cancel redundant PENDING facet-catalog ArtJobs: rows where the same Facet has
// more than one queued job asking for the SAME prompt.
//
// Why this exists. --requeue-curated was not idempotent against its own
// in-flight work until 2026-09-22: curatedPromptNeedsRender() answered "has a
// picture been painted from this text yet", which is the right question for a
// DONE job and unanswerable for a PENDING one. So a Facet that already had art
// from older text queued again on every run. Two `--write --requeue-curated`
// runs back to back left 452 PENDING jobs across 379 Facets -- 73 duplicates,
// reported as `pendingReused: 1`.
//
// generate_facet_art_v4.ts no longer does that. This is the cleanup for queues
// that already have duplicates in them, and a safety net if it ever recurs.
//
// It recomputes rather than taking a list of ids, because the queue drains
// while you look at it and a list written a minute ago cancels jobs that
// already rendered.
//
// Deliberately narrow:
//   - PENDING only. A RUNNING job holds a relay claim and is never touched.
//   - the OLDEST job per Facet is always kept, so the work still happens.
//   - a duplicate is cancelled only when its promptString matches the kept
//     job's EXACTLY. Two jobs for one Facet with different text are two
//     different intentions, and this leaves them alone and says so.
//
// Usage:
//   npx tsx scripts/cancel_duplicate_facet_jobs.ts            # dry run
//   npx tsx scripts/cancel_duplicate_facet_jobs.ts --write
import 'dotenv/config'

const BASE = (process.env.KR_BASE_URL || 'https://kindrobots.org').replace(
  /\/$/,
  '',
)
const TOKEN = process.env.KR_API_TOKEN || ''
const WRITE = process.argv.includes('--write')

type Job = { id: number; payload: unknown }

function promptOf(job: Job): string {
  const p =
    typeof job.payload === 'string'
      ? JSON.parse(job.payload)
      : job.payload || {}
  return String((p as Record<string, unknown>).promptString || '')
}

function facetOf(job: Job): string | null {
  const raw =
    typeof job.payload === 'string'
      ? job.payload
      : JSON.stringify(job.payload || {})
  return raw.match(/"entityType":"facet","entityId":(\d+)/)?.[1] ?? null
}

async function getJson(path: string): Promise<unknown> {
  // The listing 502s under load often enough to be worth a retry here; a
  // partial page would silently under-report duplicates.
  let lastError: unknown = null
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const res = await fetch(`${BASE}${path}`, {
        headers: { Authorization: `Bearer ${TOKEN}` },
      })
      if (res.ok) return res.json()
      lastError = new Error(`${path} -> ${res.status}`)
    } catch (error) {
      lastError = error
    }
    await new Promise((r) => setTimeout(r, 500 * 2 ** attempt))
  }
  throw lastError
}

async function main(): Promise<void> {
  if (!TOKEN) throw new Error('KR_API_TOKEN is required.')

  const jobs: Job[] = []
  for (let page = 1; page <= 50; page++) {
    const body = (await getJson(
      `/api/art/queue?status=PENDING&projectSlug=facet-catalog&page=${page}&pageSize=50`,
    )) as { data?: { jobs?: Job[] } }
    const batch = body.data?.jobs ?? []
    if (!batch.length) break
    jobs.push(...batch)
    if (batch.length < 50) break
  }

  const byFacet = new Map<string, Job[]>()
  for (const job of jobs) {
    const facet = facetOf(job)
    if (facet) byFacet.set(facet, [...(byFacet.get(facet) ?? []), job])
  }

  const redundant: Array<{ id: number; facet: string; keep: number }> = []
  const divergent: Array<{ id: number; facet: string; keep: number }> = []
  for (const [facet, group] of byFacet) {
    if (group.length < 2) continue
    const sorted = [...group].sort((a, b) => a.id - b.id)
    const keep = sorted[0]
    // group.length >= 2 guarantees this, but noUncheckedIndexedAccess does not
    // know that, and a silent `keep!` here would be the one place this script
    // could pick the wrong job to keep.
    if (!keep) continue
    const keepPrompt = promptOf(keep)
    for (const dup of sorted.slice(1)) {
      const entry = { id: dup.id, facet, keep: keep.id }
      if (promptOf(dup) === keepPrompt) redundant.push(entry)
      else divergent.push(entry)
    }
  }

  console.log(
    `pending facet-catalog jobs: ${jobs.length} across ${byFacet.size} Facet(s)`,
  )
  console.log(`exact duplicates to cancel: ${redundant.length}`)
  if (divergent.length) {
    console.log(
      `\nLEFT ALONE -- same Facet, different prompt (${divergent.length}). These are two intentions, not a duplicate:`,
    )
    for (const d of divergent)
      console.log(`  job ${d.id} (facet ${d.facet}, alongside ${d.keep})`)
  }

  if (!redundant.length) return
  if (!WRITE) {
    console.log(
      `\n[dry run] would cancel: ${redundant.map((r) => r.id).join(',')}`,
    )
    console.log('Re-run with --write to cancel.')
    return
  }

  let cancelled = 0
  const failed: Array<{ id: number; reason: string }> = []
  for (const entry of redundant) {
    const res = await fetch(`${BASE}/api/art/queue/${entry.id}/cancel`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ reason: 'duplicate-curated-requeue' }),
    })
    if (res.ok) {
      cancelled++
      console.log(
        `cancelled ${entry.id} (facet ${entry.facet}, kept ${entry.keep})`,
      )
    } else {
      // A job claimed between the listing and now is not an error worth
      // stopping for -- it is the queue doing its job.
      failed.push({ id: entry.id, reason: `HTTP ${res.status}` })
    }
  }
  console.log(`\ncancelled ${cancelled}/${redundant.length}`)
  for (const f of failed) console.log(`  not cancelled: ${f.id} (${f.reason})`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
