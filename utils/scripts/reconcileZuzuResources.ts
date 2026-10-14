// /utils/scripts/reconcileZuzuResources.ts
//
// kind-robots/t-142 (GitHub #3390): reconcile the legacy LLM-filler Zuzu
// Character / Reward / Scenario rows with Conductor's canon package
// (worlds/zuzu/resource-submissions.json), and audit Zuzu Dreams and the five
// character-LoRA Resources.
//
// Default is a dry run: GET only, prints the read-first mapping, the plan and
// a plan hash. --apply re-reads live state, recomputes the plan, and refuses
// unless that plan's hash equals --confirm <hash>, so the human who approves
// the writes is approving exactly the plan they read. Writes go through the
// model APIs (POST /api/{model}, PATCH /api/{model}/:id), never SQL. Dreams and
// Resources are reported, never written. The planner rules live in
// utils/zuzuReconcile.ts and are pinned by verifyZuzuReconcile.test.ts.
//
//   npx tsx utils/scripts/reconcileZuzuResources.ts --submissions ../conductor/worlds/zuzu/resource-submissions.json
//   npx tsx utils/scripts/reconcileZuzuResources.ts --report zuzu-reconcile.json
//   npx tsx utils/scripts/reconcileZuzuResources.ts --apply --confirm <hash>
//
// Env: KR_API_TOKEN (admin token or user API key; never printed),
//      KR_API_BASE (default https://kindrobots.org).
import 'dotenv/config'
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  ZUZU_ENTITY_KINDS,
  assertZuzuWriteIsSafe,
  mapZuzuDreams,
  planZuzuReconciliation,
  zuzuDreamLinkedIds,
  zuzuPatchPreconditionsHold,
  zuzuRowMayMatch,
  type ZuzuEntityKind,
  type ZuzuExistingRow,
  type ZuzuExistingState,
  type ZuzuPlanAction,
  type ZuzuReconcilePlan,
  type ZuzuSubmissions,
} from '../zuzuReconcile'

const BASE = (process.env.KR_API_BASE || 'https://kindrobots.org').replace(
  /\/+$/,
  '',
)
const TOKEN = process.env.KR_API_TOKEN?.trim() || ''

const APPLY = process.argv.includes('--apply')
const JSON_ONLY = process.argv.includes('--json')

function flag(name: string): string | null {
  const index = process.argv.indexOf(name)
  if (index === -1) return null
  return process.argv[index + 1] ?? null
}

const SUBMISSIONS_ARG =
  flag('--submissions') || '../conductor/worlds/zuzu/resource-submissions.json'
const SUBMISSIONS_PATH = resolve(SUBMISSIONS_ARG)
const REPORT_PATH = flag('--report')
const CONFIRM = flag('--confirm')

const DREAM_SEARCH_TERMS = ['Koala Assassin', 'Zuzu', 'Gallowsun']
const LEGACY_DREAM_ID = 183
const DETAIL_CONCURRENCY = 6

const ROUTE: Record<ZuzuEntityKind, string> = {
  Character: '/api/characters',
  Reward: '/api/rewards',
  Scenario: '/api/scenarios',
}

type ApiEnvelope<T> = { success?: boolean; data?: T; message?: string }

class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message)
  }
}

async function api<T>(
  method: 'GET' | 'POST' | 'PATCH',
  path: string,
  payload?: unknown,
): Promise<T> {
  if (method !== 'GET' && !APPLY) {
    throw new Error(`refusing ${method} ${path}: not in --apply mode`)
  }
  const response = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      authorization: `Bearer ${TOKEN}`,
      ...(payload === undefined ? {} : { 'content-type': 'application/json' }),
    },
    body: payload === undefined ? undefined : JSON.stringify(payload),
  })
  const body = (await response
    .json()
    .catch(() => null)) as ApiEnvelope<T> | null
  if (!response.ok || !body?.success) {
    throw new ApiError(
      `${method} ${path} -> HTTP ${response.status} ${body?.message || ''}`.trim(),
      response.status,
    )
  }
  return body.data as T
}

async function mapLimited<T, R>(
  items: readonly T[],
  limit: number,
  worker: (item: T) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length)
  let cursor = 0
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      for (;;) {
        const index = cursor++
        if (index >= items.length) return
        results[index] = await worker(items[index] as T)
      }
    }),
  )
  return results
}

function loadSubmissions(path: string): ZuzuSubmissions {
  const raw = JSON.parse(
    readFileSync(path, 'utf8'),
  ) as Partial<ZuzuSubmissions> & {
    schema_version?: number
  }
  if (
    raw.schema_version !== 1 ||
    !Array.isArray(raw.characters) ||
    !Array.isArray(raw.rewards) ||
    !Array.isArray(raw.scenarios)
  ) {
    throw new Error(`${path} is not a v1 Zuzu resource submission`)
  }
  for (const entry of [...raw.characters, ...raw.rewards, ...raw.scenarios]) {
    if (!entry?.key || !entry.payload || typeof entry.payload !== 'object') {
      throw new Error(`${path}: every entry needs a key and a payload`)
    }
  }
  return raw as ZuzuSubmissions
}

type Viewer = { id: number; isAdmin: boolean; authKind: string | null }

async function readViewer(): Promise<Viewer> {
  const me = await api<{ id: number; isAdmin?: boolean; authKind?: string }>(
    'GET',
    '/api/users/me',
  )
  return {
    id: me.id,
    isAdmin: me.isAdmin === true,
    authKind: me.authKind ?? null,
  }
}

async function detailOrNull(path: string): Promise<ZuzuExistingRow | null> {
  try {
    return await api<ZuzuExistingRow>('GET', path)
  } catch (error) {
    if (error instanceof ApiError && [403, 404].includes(error.status))
      return null
    throw error
  }
}

async function readLiveState(
  submissions: ZuzuSubmissions,
): Promise<ZuzuExistingState> {
  const [characterBrowse, rewards, scenarios, resources] = await Promise.all([
    api<ZuzuExistingRow[]>('GET', ROUTE.Character),
    api<ZuzuExistingRow[]>('GET', ROUTE.Reward),
    api<ZuzuExistingRow[]>('GET', ROUTE.Scenario),
    api<ZuzuExistingRow[]>('GET', '/api/resources'),
  ])

  const dreamsById = new Map<number, ZuzuExistingRow>()
  for (const term of DREAM_SEARCH_TERMS) {
    const rows = await api<ZuzuExistingRow[]>(
      'GET',
      `/api/dreams?includeInactive=true&search=${encodeURIComponent(term)}`,
    )
    for (const row of rows) dreamsById.set(row.id, row)
  }
  const legacyDream = await detailOrNull(`/api/dreams/${LEGACY_DREAM_ID}`)
  if (legacyDream) dreamsById.set(legacyDream.id, legacyDream)
  const dreams = [...dreamsById.values()]
  const linkedCharacters = zuzuDreamLinkedIds(mapZuzuDreams(dreams)).Character

  // The Character list is a card select without backstory/artPrompt; only the
  // rows that can match an entry, or that a Zuzu Dream links, need the full
  // row for provenance and diffs.
  const characterCandidates = characterBrowse.filter((row) =>
    zuzuRowMayMatch('Character', row, submissions, linkedCharacters),
  )
  const characters = (
    await mapLimited(characterCandidates, DETAIL_CONCURRENCY, (row) =>
      detailOrNull(`${ROUTE.Character}/${row.id}`),
    )
  ).filter((row): row is ZuzuExistingRow => row !== null)

  return {
    Character: characters,
    Reward: rewards,
    Scenario: scenarios,
    Dream: dreams,
    Resource: resources,
  }
}

const SNAPSHOT_FIELDS: Record<ZuzuEntityKind, readonly string[]> = {
  Character: [
    'name',
    'slug',
    'species',
    'genre',
    'class',
    'personality',
    'drive',
    'backstory',
    'presentation',
    'quirks',
    'artPrompt',
    'artImageId',
  ],
  Reward: [
    'name',
    'slug',
    'description',
    'effect',
    'flavorText',
    'collection',
    'artImageId',
  ],
  Scenario: [
    'title',
    'slug',
    'description',
    'genres',
    'inspirations',
    'locations',
    'artImageId',
  ],
}

type MappingRow = {
  kind: ZuzuEntityKind
  id: number
  userId: number | null
  isPublic: unknown
  isMature: unknown
  label: string
  mappedTo: {
    key: string
    action: ZuzuPlanAction['action'] | 'related'
    sourcePath: string | null
  }[]
  oldText: Record<string, unknown>
}

function actionTouchesRow(
  action: ZuzuPlanAction,
  kind: ZuzuEntityKind,
  id: number,
): 'target' | 'related' | 'candidate' | null {
  if (action.kind !== kind) return null
  if (action.action === 'patch' || action.action === 'skip') {
    if (action.id === id) return 'target'
    return action.related.some((row) => row.id === id) ? 'related' : null
  }
  if (action.action === 'conflict') {
    return action.candidates.some((row) => row.id === id) ? 'candidate' : null
  }
  return null
}

function buildMapping(
  state: ZuzuExistingState,
  plan: ZuzuReconcilePlan,
): MappingRow[] {
  const unmatched = new Set(
    plan.unmatchedLegacyRows.map((row) => `${row.kind}:${row.id}`),
  )
  const rows: MappingRow[] = []
  for (const kind of ZUZU_ENTITY_KINDS) {
    for (const row of state[kind]) {
      const mappedTo = plan.actions.flatMap(
        (action): MappingRow['mappedTo'] => {
          const role = actionTouchesRow(action, kind, row.id)
          return role
            ? [
                {
                  key: action.key,
                  action: role === 'related' ? 'related' : action.action,
                  sourcePath: action.sourcePath,
                },
              ]
            : []
        },
      )
      if (!mappedTo.length && !unmatched.has(`${kind}:${row.id}`)) continue
      rows.push({
        kind,
        id: row.id,
        userId: typeof row.userId === 'number' ? row.userId : null,
        isPublic: row.isPublic ?? null,
        isMature: row.isMature ?? null,
        label: String(row.name ?? row.title ?? ''),
        mappedTo,
        oldText: Object.fromEntries(
          SNAPSHOT_FIELDS[kind].map((field) => [field, row[field] ?? null]),
        ),
      })
    }
  }
  return rows
}

function clip(value: unknown, width = 70): string {
  const text = typeof value === 'string' ? value : JSON.stringify(value ?? null)
  const flat = text.replace(/\s+/g, ' ')
  return flat.length > width ? `${flat.slice(0, width - 1)}…` : flat
}

function printReport(
  viewer: Viewer,
  plan: ZuzuReconcilePlan,
  mapping: MappingRow[],
): void {
  console.log(`Target: ${BASE}`)
  console.log(
    `Acting as user #${viewer.id} (admin: ${viewer.isAdmin}, auth: ${viewer.authKind ?? 'unknown'})`,
  )
  console.log(`Mode: ${APPLY ? 'APPLY' : 'dry run (GET only)'}\n`)

  console.log(
    `Read-first mapping: ${mapping.length} existing row(s) overlap the package`,
  )
  for (const row of mapping) {
    const mapped = row.mappedTo.length
      ? row.mappedTo.map((entry) => `${entry.action}:${entry.key}`).join(', ')
      : 'legacy Zuzu row, no canon entry (left untouched)'
    console.log(
      `  ${row.kind.padEnd(9)} #${String(row.id).padEnd(6)} owner ${String(row.userId).padEnd(5)} public ${String(row.isPublic).padEnd(5)} "${row.label}" -> ${mapped}`,
    )
  }

  console.log(`\nPlan ${plan.hash}: ${JSON.stringify(plan.counts)}`)
  for (const action of plan.actions) {
    const head = `  ${action.action.toUpperCase().padEnd(8)} ${action.kind.padEnd(9)} ${action.key}`
    if (action.action === 'create') {
      console.log(
        `${head} (new, isPublic=false) source ${action.sourcePath ?? '-'}`,
      )
    } else if (action.action === 'patch') {
      console.log(`${head} -> #${action.id} (owner ${action.ownerId})`)
      for (const diff of action.diffs) {
        console.log(
          `      ${diff.field}: ${clip(diff.before)}  =>  ${clip(diff.after)}`,
        )
      }
    } else if (action.action === 'skip') {
      console.log(`${head} -> #${action.id}: ${action.reason}`)
    } else {
      console.log(`${head}: ${action.reason}`)
    }
    if (action.action !== 'conflict') {
      for (const note of action.advisories) console.log(`      note: ${note}`)
    }
    if (
      (action.action === 'patch' || action.action === 'skip') &&
      action.untouchedLegacyFields.length
    ) {
      console.log(
        `      legacy fields left as-is (no canon value): ${action.untouchedLegacyFields.join(', ')}`,
      )
    }
  }

  console.log(`\nZuzu Dreams (report only): ${plan.dreams.length}`)
  for (const dream of plan.dreams) {
    console.log(
      `  Dream #${dream.id} "${dream.title}" owner ${dream.userId} public ${dream.isPublic} chars [${dream.characterIds.join(',')}] scenarios [${dream.scenarioIds.join(',')}] rewards [${dream.rewardIds.join(',')}]`,
    )
  }

  console.log('\nCharacter LoRA Resource audit (report only):')
  for (const audit of plan.resources) {
    const ids = audit.matches
      .map((match) => `#${match.id} ${match.name}`)
      .join('; ')
    const final =
      audit.finalResourceId === null ? '' : ` final #${audit.finalResourceId}`
    console.log(
      `  ${audit.trigger.padEnd(11)} ${audit.status}${final}${ids ? ` (rows: ${ids})` : ''}`,
    )
  }
}

function writeReport(
  path: string,
  viewer: Viewer,
  plan: ZuzuReconcilePlan,
  mapping: MappingRow[],
): void {
  const report = {
    generatedAt: new Date().toISOString(),
    issue: 'silasfelinus/kind_robots#3390',
    base: BASE,
    submissions: 'silasfelinus/conductor:worlds/zuzu/resource-submissions.json',
    viewer: {
      id: viewer.id,
      isAdmin: viewer.isAdmin,
      authKind: viewer.authKind,
    },
    plan,
    mapping,
  }
  writeFileSync(resolve(path), `${JSON.stringify(report, null, 2)}\n`)
  console.log(`\nReport written to ${resolve(path)}`)
}

async function applyPlan(plan: ZuzuReconcilePlan): Promise<string[]> {
  const failures: string[] = []
  for (const action of plan.actions) {
    if (action.action !== 'create' && action.action !== 'patch') continue
    try {
      assertZuzuWriteIsSafe(action, plan.adminUserId)
      if (action.action === 'create') {
        const created = await api<{ id: number }>(
          'POST',
          ROUTE[action.kind],
          action.payload,
        )
        console.log(`  CREATED ${action.kind} ${action.key} -> #${created.id}`)
        continue
      }
      const live = await api<ZuzuExistingRow>(
        'GET',
        `${ROUTE[action.kind]}/${action.id}`,
      )
      if (!zuzuPatchPreconditionsHold(action, live)) {
        failures.push(
          `${action.kind} #${action.id}: row changed since the plan; not patched`,
        )
        continue
      }
      await api('PATCH', `${ROUTE[action.kind]}/${action.id}`, action.payload)
      console.log(
        `  PATCHED ${action.kind} #${action.id} ${action.key}: ${Object.keys(action.payload).join(', ')}`,
      )
    } catch (error) {
      failures.push(
        `${action.kind} ${action.key}: ${error instanceof Error ? error.message : String(error)}`,
      )
    }
  }
  return failures
}

async function main(): Promise<void> {
  if (!TOKEN) {
    console.error('KR_API_TOKEN is not set.')
    process.exitCode = 1
    return
  }
  if (APPLY && !CONFIRM) {
    console.error(
      '--apply requires --confirm <hash> from a dry run of the same plan.',
    )
    process.exitCode = 2
    return
  }

  const submissions = loadSubmissions(SUBMISSIONS_PATH)
  const viewer = await readViewer()
  const state = await readLiveState(submissions)
  const plan = planZuzuReconciliation({
    submissions,
    existing: state,
    adminUserId: viewer.id,
  })
  const mapping = buildMapping(state, plan)

  if (JSON_ONLY) {
    console.log(JSON.stringify({ viewer, plan, mapping }, null, 2))
  } else {
    printReport(viewer, plan, mapping)
  }
  if (REPORT_PATH) writeReport(REPORT_PATH, viewer, plan, mapping)

  const writeCount = plan.counts.create + plan.counts.patch
  if (!APPLY) {
    console.log(
      writeCount
        ? `\nDry run only. To apply exactly this plan:\n  npx tsx utils/scripts/reconcileZuzuResources.ts --submissions ${SUBMISSIONS_PATH} --apply --confirm ${plan.hash}`
        : '\nDry run only. Nothing to create or patch.',
    )
    return
  }

  if (CONFIRM !== plan.hash) {
    console.error(
      `\nRefusing to apply: live plan hash ${plan.hash} does not match --confirm ${CONFIRM}. Re-run the dry run and review the new plan.`,
    )
    process.exitCode = 2
    return
  }
  if (!viewer.isAdmin) {
    console.error(
      '\nRefusing to apply: the token does not resolve to an admin account.',
    )
    process.exitCode = 2
    return
  }
  if (!writeCount) {
    console.log('\nNothing to create or patch.')
    return
  }

  console.log(`\nApplying ${writeCount} write(s)…`)
  const failures = await applyPlan(plan)

  const after = planZuzuReconciliation({
    submissions,
    existing: await readLiveState(submissions),
    adminUserId: viewer.id,
  })
  console.log(
    `\nPost-apply plan ${after.hash}: ${JSON.stringify(after.counts)}`,
  )
  if (failures.length) {
    console.log(`${failures.length} failure(s):`)
    for (const failure of failures) console.log(`  - ${failure}`)
  }
  if (failures.length || after.counts.create || after.counts.patch) {
    process.exitCode = 1
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
