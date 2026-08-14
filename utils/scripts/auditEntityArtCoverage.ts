// /utils/scripts/auditEntityArtCoverage.ts
//
// Find every catalog object with no art at all, and give it some.
//
//   npx tsx utils/scripts/auditEntityArtCoverage.ts                 # audit only
//   npx tsx utils/scripts/auditEntityArtCoverage.ts --apply         # enqueue
//   npx tsx utils/scripts/auditEntityArtCoverage.ts --type dream    # one type
//
//   export KR_API_BASE=https://kindrobots.org
//   export KR_API_TOKEN=<admin or server token>   # required for --apply and
//                                                 # for reading the art queue
//
// WHY
// ---
// The dream-location lane created sixteen worlds and queued art for none of
// them. Nothing failed and nothing warned; they simply arrived pictureless and
// stayed that way, which is why the art queue never spiked and why the gap was
// found by Silas asking rather than by anything in the codebase noticing.
//
// That lane is fixed, but "this one publisher forgot" is the small version of
// the problem. The real question is how many objects across the whole catalog
// are in the same state, and nothing could answer it -- so this does. Silas,
// 2026-08-14: "anything, and I mean anything missing at least one art asset
// should be given one."
//
// WHAT COUNTS AS ART
// ------------------
// Any of the real art fields being set: the primary slot (imagePath, or
// avatarImage for bot), the icon/card/hero paths, or any of the ArtImage id
// columns. An object with even one of those is left alone.
//
// `icon` is deliberately NOT in that list. It holds a NAME for an existing
// icon in the Kind Robots set (e.g. 'kind-icon:bot'), never generated art --
// the distinction is spelled out in server/utils/entityArt.ts and treating the
// two as the same thing would hide every object whose only "art" is a string.
//
// `artCollectionId` is also not counted. A collection is a group of related
// images, not the record's own display art, so a Dream carrying one still
// renders a blank card. Those are reported separately rather than skipped.
//
// DEDUPE
// ------
// ArtJob has no entity foreign key -- the linkage lives inside `payload.entityArt`
// (entityType, entityId, field), written by /api/art/enqueue. So every PENDING
// and RUNNING job is read and its payload parsed, and any object already
// waiting on a job is skipped. Without this, a second run would double every
// job in the queue.
//
// The art queue pages on `page` + `pageSize` (max 200) and IGNORES `take`/`skip`
// entirely -- a scan written with take/skip silently sees only the first 20
// jobs and reports a confident, wrong answer. That mistake is why the first
// pass at this question had to be thrown away.
//
// PROMPTS ARE AUTHORED, NOT ASSEMBLED
// -----------------------------------
// Nothing here builds a prompt by concatenating a record's fields. A Project's
// description is roadmap prose ("Canonical book order and scope, clarified
// 2026-07-17..."); joined into a prompt it asks an image model to paint a
// changelog. A Dream's description is a paragraph about what a place is KNOWN
// FOR, which is a different sentence from what it LOOKS like.
//
// So prompts come from config/art-coverage/*.json, written by hand, or from the
// record's own artPrompt column where one already exists. An object with
// neither is reported and skipped -- a picture invented from an empty row is
// worse than an honest blank, and a bad render still costs the same mana.
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'

type EntityType =
  | 'bot'
  | 'dream'
  | 'character'
  | 'scenario'
  | 'reward'
  | 'facet'
  | 'achievement'
  | 'project'

type Row = Record<string, unknown>

/**
 * Per-type endpoint, primary art field, and the fields a prompt is built from.
 *
 * Sizes come from ENTITY_FIELDS in server/utils/entityArt.ts and are repeated
 * rather than imported because that module reaches for a Prisma client.
 */
const TYPES: Record<
  EntityType,
  {
    endpoint: string
    paged?: 'page' | 'skip'
    field: string
    width: number
    height: number
    promptFields: string[]
  }
> = {
  bot: {
    endpoint: '/api/bots',
    paged: 'page',
    field: 'avatarImage',
    width: 1024,
    height: 1024,
    promptFields: ['name', 'subtitle', 'tagline', 'description', 'botIntro'],
  },
  dream: {
    endpoint: '/api/dreams?take=1000',
    field: 'imagePath',
    width: 512,
    height: 768,
    promptFields: ['title', 'flavorText', 'pitch', 'description'],
  },
  character: {
    endpoint: '/api/characters',
    field: 'imagePath',
    width: 512,
    height: 768,
    promptFields: ['name', 'title', 'species', 'class', 'personality', 'backstory'],
  },
  scenario: {
    endpoint: '/api/scenarios',
    field: 'imagePath',
    width: 512,
    height: 768,
    promptFields: ['title', 'intro', 'description'],
  },
  reward: {
    endpoint: '/api/rewards',
    field: 'imagePath',
    width: 512,
    height: 768,
    promptFields: ['name', 'text', 'power', 'description'],
  },
  facet: {
    endpoint: '/api/facets?take=250',
    paged: 'skip',
    field: 'imagePath',
    width: 512,
    height: 768,
    promptFields: ['title', 'description', 'artPrompt'],
  },
  achievement: {
    endpoint: '/api/achievements',
    field: 'imagePath',
    width: 512,
    height: 768,
    promptFields: ['name', 'description', 'goal'],
  },
  project: {
    endpoint: '/api/projects',
    field: 'imagePath',
    width: 512,
    height: 768,
    promptFields: ['name', 'title', 'pitch', 'description'],
  },
}

/**
 * Types this script must not enqueue for, and who owns them instead.
 *
 * Facets already have a dedicated lane: scripts/generate_facet_art.ts, run
 * every week by facet-catalog-maintenance. It applies a quality gate this
 * script knows nothing about -- no art for duplicate, malformed, composite,
 * taxonomy-leaking, cargo-cult or unreviewed legacy Facets -- and it is caught
 * up: of 904 art-less Facets on 2026-08-14, 186 were artRequired=false, 630
 * were held by that gate, and the 88 genuinely eligible were all already
 * queued. Blasting the other 816 from here would not be filling a gap, it
 * would be overriding a deliberate decision to withhold art from records that
 * need editing first.
 */
const OWNED_ELSEWHERE: Partial<Record<EntityType, string>> = {
  facet: 'scripts/generate_facet_art.ts (weekly, via facet-catalog-maintenance)',
}

/** Real art fields. `icon` is a name, not art -- see the header. */
const ART_FIELDS = [
  'imagePath',
  'avatarImage',
  'iconPath',
  'cardPath',
  'heroPath',
  'artImageId',
  'iconArtImageId',
  'cardArtImageId',
  'heroArtImageId',
]

const APPLY = process.argv.includes('--apply')
const base = (process.env.KR_API_BASE || 'https://kindrobots.org').replace(/\/$/, '')
const token = process.env.KR_API_TOKEN || ''

function arg(name: string): string | undefined {
  const index = process.argv.indexOf(`--${name}`)
  return index === -1 ? undefined : process.argv[index + 1]
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function hasArt(row: Row): boolean {
  return ART_FIELDS.some((field) => {
    const value = row[field]
    if (value === null || value === undefined) return false
    if (typeof value === 'string') return value.trim().length > 0
    if (typeof value === 'number') return value > 0
    return false
  })
}

function unwrap(body: unknown): Row[] {
  const envelope = body as { data?: unknown } | null
  const data = envelope?.data ?? body
  if (Array.isArray(data)) return data as Row[]
  const record = data as Record<string, unknown> | null
  for (const key of Object.keys(record || {})) {
    if (Array.isArray(record?.[key])) return record[key] as Row[]
  }
  return []
}

async function get(path: string, auth = false): Promise<unknown> {
  const response = await fetch(`${base}${path}`, {
    headers: auth && token ? { Authorization: `Bearer ${token}` } : {},
  })
  if (!response.ok) {
    throw new Error(`GET ${path} -> ${response.status} ${await response.text()}`)
  }
  return response.json()
}

/** Every row of one type, following whichever pagination that route uses. */
async function allRows(type: EntityType): Promise<Row[]> {
  const config = TYPES[type]
  if (!config.paged) return unwrap(await get(config.endpoint))

  const rows: Row[] = []
  const join = config.endpoint.includes('?') ? '&' : '?'
  for (let index = 0; index < 60; index++) {
    const query =
      config.paged === 'page'
        ? `${join}page=${index + 1}&pageSize=200`
        : `${join}skip=${rows.length}`
    const page = unwrap(await get(`${config.endpoint}${query}`))
    if (!page.length) break
    const before = rows.length
    rows.push(...page)
    if (rows.length === before) break
    if (config.paged === 'page' && page.length < 200) break
  }
  return rows
}

/**
 * Entities already waiting on art, as `type:id` keys.
 *
 * Reads every PENDING and RUNNING job and parses `payload.entityArt`. Jobs with
 * no entityArt block (facet-catalog coverage runs, ad-hoc generations) simply
 * contribute nothing, which is correct -- they are not claims on an entity slot.
 */
async function queuedEntities(): Promise<Set<string>> {
  const queued = new Set<string>()
  for (const status of ['PENDING', 'RUNNING']) {
    for (let page = 1; page <= 60; page++) {
      const body = (await get(
        `/api/art/queue?status=${status}&pageSize=200&page=${page}`,
        true,
      )) as { data?: { jobs?: Row[]; pagination?: { page: number; pageCount: number } } }
      const jobs = body?.data?.jobs || []
      for (const job of jobs) {
        const payload = job.payload as { entityArt?: Row } | null
        const entity = payload?.entityArt
        if (!entity) continue
        const entityType = text(entity.entityType)
        const entityId = Number(entity.entityId)
        if (entityType && entityId > 0) queued.add(`${entityType}:${entityId}`)
      }
      const pagination = body?.data?.pagination
      if (!pagination || pagination.page >= pagination.pageCount) break
    }
  }
  return queued
}

type AuthoredPrompt = {
  entityType: EntityType
  entityId: number
  title?: string
  prompt: string
}

/** Every hand-written prompt, keyed `type:id`. */
function authoredPrompts(): Map<string, string> {
  const dir = join(process.cwd(), 'config', 'art-coverage')
  const out = new Map<string, string>()
  if (!existsSync(dir)) return out
  for (const name of readdirSync(dir).filter((n) => n.endsWith('.json')).sort()) {
    const batch = JSON.parse(readFileSync(join(dir, name), 'utf8')) as {
      version?: number
      prompts?: AuthoredPrompt[]
    }
    if (batch.version !== 1) {
      throw new Error(`${name}: unexpected version ${batch.version}.`)
    }
    for (const entry of batch.prompts || []) {
      const key = `${entry.entityType}:${entry.entityId}`
      if (out.has(key)) throw new Error(`${name}: duplicate prompt for ${key}.`)
      const prompt = text(entry.prompt)
      if (prompt.length < 20) {
        throw new Error(`${name}: ${key} prompt is too short to be authored.`)
      }
      out.set(key, prompt)
    }
  }
  return out
}

/**
 * The authored prompt for a record, or the one it already carries.
 *
 * Never assembled from the record's other fields -- see the header. Returns an
 * empty string when there is nothing written, which makes the record a reported
 * skip rather than a generic render.
 */
function promptFor(
  type: EntityType,
  row: Row,
  authored: Map<string, string>,
): string {
  const written = authored.get(`${type}:${row.id}`)
  if (written) return written.slice(0, 900)
  const existing = text(row.artPrompt)
  return existing.length >= 20 ? existing.slice(0, 900) : ''
}

async function enqueue(
  type: EntityType,
  row: Row,
  prompt: string,
): Promise<number> {
  const config = TYPES[type]
  const response = await fetch(`${base}/api/art/enqueue`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      engine: 'krea2',
      promptString: prompt,
      width: config.width,
      height: config.height,
      isPublic: row.isPublic ?? true,
      isMature: row.isMature ?? false,
      designer: text(row.designer) || null,
      projectSlug: 'art-coverage',
      entityArt: {
        entityType: type,
        entityId: Number(row.id),
        field: config.field,
        preserveOriginal: true,
        mode: 'recreate',
      },
    }),
  })
  const body = (await response.json().catch(() => null)) as {
    success?: boolean
    message?: string
    data?: { jobId?: number }
  } | null
  if (!response.ok || !body?.success || !body.data?.jobId) {
    throw new Error(
      `${type} #${row.id}: HTTP ${response.status} ${body?.message || 'enqueue failed'}`,
    )
  }
  return Number(body.data.jobId)
}

async function main(): Promise<void> {
  if (APPLY && !token) throw new Error('--apply requires KR_API_TOKEN.')
  if (!token) {
    console.warn(
      'No KR_API_TOKEN: the art queue cannot be read, so already-queued ' +
        'objects will be reported as needing a job. Audit numbers only.\n',
    )
  }

  const only = arg('type') as EntityType | undefined
  const types = only ? [only] : (Object.keys(TYPES) as EntityType[])
  if (only && !TYPES[only]) throw new Error(`Unknown type "${only}".`)

  const authored = authoredPrompts()
  const queued = token ? await queuedEntities() : new Set<string>()
  console.log(
    `Authored prompts on file: ${authored.size}\n` +
      `Entities already waiting on an ArtJob: ${queued.size}\n`,
  )

  const work: Array<{ type: EntityType; row: Row; prompt: string }> = []
  const noPrompt: string[] = []
  const deferred: string[] = []
  let collectionOnly = 0

  for (const type of types) {
    const rows = await allRows(type)
    const artless = rows.filter((row) => !hasArt(row))
    const waiting = artless.filter((row) => queued.has(`${type}:${row.id}`))
    const actionable = artless.filter((row) => !queued.has(`${type}:${row.id}`))

    const owner = OWNED_ELSEWHERE[type]
    if (!owner) {
      for (const row of actionable) {
        const prompt = promptFor(type, row, authored)
        if (prompt) work.push({ type, row, prompt })
        else noPrompt.push(`${type} #${row.id} ${text(row.title) || text(row.name)}`)
        if (Number(row.artCollectionId) > 0) collectionOnly += 1
      }
    } else {
      deferred.push(
        `${type}: ${actionable.length} art-less and unqueued, owned by ${owner}`,
      )
    }

    console.log(
      `${type.padEnd(12)} ${String(rows.length).padStart(5)} rows  ` +
        `${String(rows.length - artless.length).padStart(5)} with art  ` +
        `${String(artless.length).padStart(5)} without  ` +
        `${String(waiting.length).padStart(4)} already queued  ` +
        `${String(actionable.length).padStart(5)} ${owner ? 'deferred  ' : 'need a job'}`,
    )
  }

  console.log(`\n${work.length} job(s) to enqueue.`)
  for (const entry of deferred) console.log(`Deferred — ${entry}`)
  if (collectionOnly) {
    console.log(
      `${collectionOnly} of them carry an artCollectionId but no display art ` +
        'of their own, so their card still renders blank.',
    )
  }
  if (noPrompt.length) {
    console.log(
      `\n${noPrompt.length} skipped for having no authored prompt. Write one in ` +
        'config/art-coverage/ rather than letting the record describe itself:',
    )
    for (const entry of noPrompt) console.log(`  - ${entry}`)
  }

  if (!APPLY) {
    console.log('\nAudit only. Add --apply to enqueue.')
    return
  }

  // Each job costs mana and GPU time. --limit exists so the first run of a
  // sweep can be one job, checked in the queue by eye, before the rest follow.
  const limit = Number(arg('limit') ?? work.length)
  const batch = work.slice(0, Number.isFinite(limit) ? Math.max(0, limit) : work.length)
  if (batch.length < work.length) {
    console.log(`\n--limit ${limit}: enqueueing ${batch.length} of ${work.length}.`)
  }

  let queuedCount = 0
  const failures: string[] = []
  for (const item of batch) {
    try {
      const jobId = await enqueue(item.type, item.row, item.prompt)
      queuedCount += 1
      if (queuedCount % 25 === 0) {
        console.log(`  … ${queuedCount}/${batch.length} queued (last job ${jobId})`)
      }
    } catch (error) {
      failures.push(String(error instanceof Error ? error.message : error))
    }
  }

  console.log(`\nQueued ${queuedCount} of ${batch.length}.`)
  if (failures.length) {
    console.error(`${failures.length} failed:`)
    for (const failure of failures.slice(0, 20)) console.error(`  - ${failure}`)
    process.exitCode = 1
  }
}

await main()
