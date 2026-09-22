// /scripts/cancel_duplicate_facet_jobs.ts
//
// Cancel PENDING facet-catalog ArtJobs that should not render:
//
//   (default)              a Facet with more than one queued job asking for the
//                          SAME prompt -- a duplicate render of one picture.
//   --pasted-description   a job whose prompt is a Facet's own title and
//                          description pasted together. Those rows never had
//                          art direction written for them; the producer now
//                          rebuilds them onto their taxonomy clause, so a job
//                          queued from the old text renders card copy and
//                          nothing else.
//
// Why each exists.
//
// --requeue-curated was not idempotent against its own in-flight work until
// 2026-09-22: curatedPromptNeedsRender() answered "has a picture been PAINTED
// from this text", which is the right question for a DONE job and unanswerable
// for a PENDING one. So a Facet that already had art from older text queued
// again on every run. Two runs back to back left 452 PENDING jobs across 379
// Facets -- 73 duplicates, reported as `pendingReused: 1`.
//
// The pasted description is the older fault. A stored prompt that is just the
// title and the description carries no generated tail, so
// isLegacyGeneratedFacetPrompt could not see it and the producer shipped it
// verbatim as though someone had authored it -- with no taxonomy clause after
// it, because the clause is only appended on a rebuild (Silas, 2026-09-22:
// "these are AWEFUL prompts. why is this still an issue?"). 60 live Facets
// carry it, 57 of them were queued.
//
// Talks to the database directly, like every other script in scripts/. An
// earlier draft went through the HTTPS API because that was all the authoring
// sandbox could reach, and it wanted a KR_API_TOKEN that the machine running
// this does not have and should not need.
//
// Deliberately narrow:
//   - PENDING only. A RUNNING job holds a relay claim and is never touched.
//   - the OLDEST job per Facet is always kept, so the work still happens.
//   - a duplicate is cancelled only when its promptString matches the kept
//     job's EXACTLY. Two jobs for one Facet with different text are two
//     different intentions; those are reported and left alone.
//   - it recomputes every run rather than taking a list of ids, because the
//     queue drains while you look at it.
//
// Usage:
//   npx tsx scripts/cancel_duplicate_facet_jobs.ts                          # dry run
//   npx tsx scripts/cancel_duplicate_facet_jobs.ts --write
//   npx tsx scripts/cancel_duplicate_facet_jobs.ts --pasted-description
//   npx tsx scripts/cancel_duplicate_facet_jobs.ts --pasted-description --write
import 'dotenv/config'
import { readsAsPastedDescription } from '../utils/facetVisualLanguage'
import {
  createScriptPrismaClient,
  withDatabaseRetry,
} from './lib/databaseRetry'

const PROJECT_SLUG = 'facet-catalog'
const WRITE = process.argv.includes('--write')
const PASTED = process.argv.includes('--pasted-description')

const KNOWN_FLAGS = new Set(['--write', '--pasted-description'])

type QueuedJob = { id: number; payload: string | null }

function parsePayload(payload: string | null): Record<string, unknown> {
  if (!payload) return {}
  try {
    const parsed: unknown = JSON.parse(payload)
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {}
  } catch {
    return {}
  }
}

function facetIdOf(payload: string | null): number | null {
  const match = String(payload ?? '').match(
    /"entityType":"facet","entityId":(\d+)/,
  )
  return match?.[1] ? Number(match[1]) : null
}

async function main(): Promise<void> {
  // An argv flag that is silently ignored has cost this repo two full queue
  // cycles; see KNOWN_FLAGS in generate_facet_art_v4.ts.
  const unknown = process.argv
    .slice(2)
    .filter((arg) => arg.startsWith('--') && !KNOWN_FLAGS.has(arg))
  if (unknown.length) {
    console.error(`Unrecognized option(s): ${unknown.join(', ')}`)
    process.exit(2)
  }

  await withDatabaseRetry('Facet art queue cleanup', async () => {
    const prisma = createScriptPrismaClient()
    try {
      const jobs: QueuedJob[] = await prisma.artJob.findMany({
        where: {
          projectSlug: PROJECT_SLUG,
          status: 'PENDING',
          payload: { contains: '"entityType":"facet"' },
        },
        orderBy: { id: 'asc' },
        select: { id: true, payload: true },
      })

      const byFacet = new Map<number, QueuedJob[]>()
      for (const job of jobs) {
        const facetId = facetIdOf(job.payload)
        if (facetId === null) continue
        byFacet.set(facetId, [...(byFacet.get(facetId) ?? []), job])
      }

      const redundant: Array<{ id: number; why: string }> = []
      const divergent: Array<{ id: number; facetId: number; keep: number }> = []
      for (const [facetId, group] of byFacet) {
        if (group.length < 2) continue
        const keep = group[0]
        // group.length >= 2 guarantees this, but noUncheckedIndexedAccess does
        // not know it, and a silent `keep!` would be the one place this script
        // could pick the wrong job to keep.
        if (!keep) continue
        const keepPrompt = String(parsePayload(keep.payload).promptString ?? '')
        for (const dup of group.slice(1)) {
          const prompt = String(parsePayload(dup.payload).promptString ?? '')
          if (prompt === keepPrompt) {
            redundant.push({ id: dup.id, why: `duplicate of ${keep.id}` })
          } else {
            divergent.push({ id: dup.id, facetId, keep: keep.id })
          }
        }
      }

      const pasted: Array<{ id: number; why: string }> = []
      if (PASTED) {
        const facets = await prisma.facet.findMany({
          where: { id: { in: [...byFacet.keys()] } },
          select: { id: true, title: true, description: true },
        })
        const byId = new Map(facets.map((f) => [f.id, f]))
        for (const [facetId, group] of byFacet) {
          const facet = byId.get(facetId)
          if (!facet) continue
          for (const job of group) {
            const base = String(
              parsePayload(job.payload).basePromptString ?? '',
            )
            if (
              readsAsPastedDescription({
                artPrompt: base,
                title: facet.title,
                description: facet.description,
              })
            ) {
              pasted.push({
                id: job.id,
                why: `pasted description (${facet.title})`,
              })
            }
          }
        }
      }

      console.log(
        `pending ${PROJECT_SLUG} jobs: ${jobs.length} across ${byFacet.size} Facet(s)`,
      )
      console.log(`exact duplicates: ${redundant.length}`)
      if (PASTED)
        console.log(`queued from a pasted description: ${pasted.length}`)
      if (divergent.length) {
        console.log(
          `\nLEFT ALONE -- same Facet, different prompt (${divergent.length}). Two intentions, not a duplicate:`,
        )
        for (const d of divergent) {
          console.log(`  job ${d.id} (facet ${d.facetId}, alongside ${d.keep})`)
        }
      }

      // A job can be both a duplicate and a pasted description; cancel it once.
      const seen = new Set<number>()
      const targets = [...redundant, ...pasted].filter((t) => {
        if (seen.has(t.id)) return false
        seen.add(t.id)
        return true
      })
      if (!targets.length) {
        console.log('\nNothing to cancel.')
        return
      }
      if (!WRITE) {
        console.log(
          `\n[dry run] would cancel ${targets.length}: ${targets.map((t) => t.id).join(',')}`,
        )
        console.log('Re-run with --write to cancel.')
        return
      }

      // Status is re-checked in the update so a job claimed since the read is
      // left to the relay rather than yanked out from under it.
      const result = await prisma.artJob.updateMany({
        where: { id: { in: targets.map((t) => t.id) }, status: 'PENDING' },
        data: {
          status: 'CANCELLED',
          claimedAt: null,
          claimedBy: null,
          error:
            'Cancelled by Facet art queue cleanup: a duplicate of another queued job, or queued from a prompt that was the Facet description pasted whole.',
        },
      })
      console.log(`\ncancelled ${result.count}/${targets.length}`)
      if (result.count < targets.length) {
        console.log(
          '  the remainder were claimed between the read and the write; the relay owns those.',
        )
      }
    } finally {
      await prisma.$disconnect()
    }
  })
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
