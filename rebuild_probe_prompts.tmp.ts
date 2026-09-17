/*
 * Rebuild the positive and negative prompt of every PENDING LoRA probe from its
 * Resource, through the real builder.
 *
 * Deliberately not a Python reimplementation of buildLoraProbePrompt: three
 * separate defects this session came from a script working off a snapshot of
 * what the builder produced rather than the builder itself.
 */
import {
  buildLoraProbePrompt,
  classifyLoraFamily,
  probeTriggerText,
  type LoraProbeFamily,
} from './utils/loraProbe'

const TOK = process.env.KR_API_TOKEN!
const BASE = 'https://kindrobots.org'
const APPLY = process.argv.includes('--apply')

const api = async (path: string, init?: RequestInit) => {
  const r = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${TOK}`,
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  })
  if (!r.ok) throw new Error(`${r.status} ${path} ${(await r.text()).slice(0, 200)}`)
  return r.json() as any
}

async function pendingProbes() {
  const out: any[] = []
  for (let page = 1; page <= 30; page += 1) {
    const d = (await api(`/api/art/queue?status=PENDING&pageSize=200&page=${page}`)).data
    out.push(...d.jobs)
    if (page >= d.pagination.pageCount) break
  }
  return out.filter((j) => j?.payload?.entityArt?.entityType === 'resource')
}

// The checkpoint the job was actually built against is the ground truth for
// which probe family this render belongs to -- Resource.generation is wrong
// often enough to matter (duchaiten is SD 1.5 recorded as SDXL).
function familyFromGraph(job: any): LoraProbeFamily | null {
  const wf = job?.payload?.workflow || {}
  let ckpt: string | null = null
  for (const node of Object.values<any>(wf)) {
    const c = String(node?.class_type || '')
    if (c.includes('Checkpoint')) ckpt = node?.inputs?.ckpt_name ?? ckpt
    if ((c === 'UNETLoader' || c === 'UnetLoaderGGUF') && !ckpt) ckpt = node?.inputs?.unet_name ?? ckpt
  }
  if (!ckpt) return null
  if (/(turbo|lightning|lcm|hyper)/i.test(ckpt)) {
    // distilled merges keep their lineage's text encoder and scaffold
  }
  const dir = String(ckpt).split('/')[0].toLowerCase()
  if (dir === 'pony') return 'pony'
  if (dir === 'illustrious') return 'illustrious'
  if (dir === 'sd15' || dir === 'sd1.5') return 'sd15'
  if (dir === 'flux') return 'flux'
  return 'sdxl'
}

async function main() {
  const jobs = await pendingProbes()
  console.log(`${jobs.length} PENDING probe jobs`)

  const resourceCache = new Map<number, any>()
  const plan: any[] = []
  let noTrigger = 0, sameAsBefore = 0, noFamily = 0

  for (const job of jobs) {
    const rid = job.payload.entityArt.entityId
    if (!resourceCache.has(rid)) {
      try {
        resourceCache.set(rid, (await api(`/api/resources/${rid}`)).data ?? null)
      } catch {
        resourceCache.set(rid, null)
      }
    }
    const res = resourceCache.get(rid)
    if (!res) { noTrigger += 1; continue }

    const family = familyFromGraph(job) ?? classifyLoraFamily(res.generation, res.supportedServer)
    if (family === 'unsupported') { noFamily += 1; continue }

    const built = buildLoraProbePrompt(family, probeTriggerText(res))
    if (!built) { noFamily += 1; continue }

    const current = String(job.payload.promptString || '').replace(/\s+/g, ' ').trim()
    // The NEGATIVE has to be diffed too. Skipping on a matching positive alone
    // left 258 jobs without the minor-exclusion terms, because their positive
    // was already correct and the edit therefore never fired.
    let currentNeg = ''
    for (const n of Object.values<any>(job.payload.workflow || {})) {
      if (String(n?.class_type) === 'CLIPTextEncode') {
        const t = String(n?.inputs?.text || '')
        if (/worst quality|score_6/.test(t)) currentNeg = t.replace(/\s+/g, ' ').trim()
      }
    }
    if (built.prompt === current && built.negativePrompt === currentNeg) {
      sameAsBefore += 1; continue
    }

    plan.push({
      jobId: job.id, rid, family,
      name: res.name ?? res.title ?? String(rid),
      before: current,
      after: built.prompt,
      negative: built.negativePrompt,
    })
  }

  console.log(`  rebuild: ${plan.length}`)
  console.log(`  already correct: ${sameAsBefore}`)
  console.log(`  resource missing: ${noTrigger}`)
  console.log(`  unsupported/no family: ${noFamily}`)

  console.log('\nsample:')
  for (const p of plan.slice(0, 6)) {
    console.log(`\n  job ${p.jobId} [${p.family}] ${p.name}`)
    console.log(`    before: ${p.before.slice(0, 150)}`)
    console.log(`    after : ${p.after.slice(0, 150)}`)
  }

  const fs = await import('node:fs')
  const SCR = '/tmp/claude-0/-home-user/b2a859ff-7b9a-5f51-baa5-3bd37187f242/scratchpad'
  fs.writeFileSync(`${SCR}/prompt_rebuild_plan.json`, JSON.stringify(plan, null, 1))

  if (!APPLY) { console.log('\n(dry run -- pass --apply to write)'); return }

  let ok = 0
  const failures: any[] = []
  for (const p of plan) {
    try {
      await api(`/api/art/queue/${p.jobId}/edit`, {
        method: 'POST',
        body: JSON.stringify({
          refreshSeed: false,
          overrides: { basePromptString: p.after, negativePrompt: p.negative },
        }),
      })
      ok += 1
      if (ok % 100 === 0) console.log(`  ${ok}/${plan.length}`)
    } catch (e: any) {
      failures.push({ jobId: p.jobId, error: String(e.message).slice(0, 180) })
    }
  }
  console.log(`\napplied ${ok}, failed ${failures.length}`)
  fs.writeFileSync(`${SCR}/prompt_rebuild_failures.json`, JSON.stringify(failures, null, 1))
  for (const f of failures.slice(0, 5)) console.log('  ', f.jobId, f.error)
}

main().catch((e) => { console.error(e); process.exit(1) })
