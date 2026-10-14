// /utils/zuzuReconcile.ts
//
// kind-robots/t-142 (GitHub #3390): pure planner for reconciling the legacy
// LLM-filler Zuzu Character / Reward / Scenario rows with the canon package in
// Conductor's worlds/zuzu/resource-submissions.json.
//
// No I/O lives here. utils/scripts/reconcileZuzuResources.ts fetches the live
// rows over GET, hands them to planZuzuReconciliation(), prints the mapping,
// and only applies the plan when a human passes back the plan hash it printed.
//
// Safety contract, each one pinned by utils/scripts/verifyZuzuReconcile.test.ts:
// - a row is patched only when it is the single exact identity match, it is
//   owned by the admin account doing the work, and it carries Zuzu provenance;
// - every other overlap (another owner's Zuzu row, a same-name admin row with
//   no Zuzu provenance, a similar-name Zuzu row, two matches) is a conflict;
// - creates always send isPublic=false;
// - patches never carry isPublic or isMature, never rename, and only fill a
//   missing slug or art reference rather than replacing one;
// - planning against the state an apply produces yields no create or patch.
import { createHash } from 'node:crypto'

export type ZuzuEntityKind = 'Character' | 'Reward' | 'Scenario'

export const ZUZU_ENTITY_KINDS: readonly ZuzuEntityKind[] = [
  'Character',
  'Reward',
  'Scenario',
]

export type ZuzuSubmissionEntry = {
  key: string
  canon_scope?: string
  source_path?: string
  action?: string
  payload: Record<string, unknown>
}

export type ZuzuModelResourceEntry = {
  name: string
  trigger: string
  source_path?: string
  status?: string
}

export type ZuzuSubmissions = {
  characters: ZuzuSubmissionEntry[]
  rewards: ZuzuSubmissionEntry[]
  scenarios: ZuzuSubmissionEntry[]
  model_resources?: ZuzuModelResourceEntry[]
}

export type ZuzuExistingRow = Record<string, unknown> & {
  id: number
  userId?: number | null
}

export type ZuzuExistingState = {
  Character: ZuzuExistingRow[]
  Reward: ZuzuExistingRow[]
  Scenario: ZuzuExistingRow[]
  Dream?: ZuzuExistingRow[]
  Resource?: ZuzuExistingRow[]
}

export type ZuzuFieldDiff = { field: string; before: unknown; after: unknown }

export type ZuzuMatchBasis = 'slug' | 'name' | 'similar-name' | 'linked-species'

export type ZuzuCandidateSummary = {
  id: number
  userId: number | null
  label: string
  basis: ZuzuMatchBasis
  exact: boolean
  owned: boolean
  provenance: boolean
}

export type ZuzuUnmatchedLegacyRow = {
  kind: ZuzuEntityKind
  id: number
  userId: number | null
  label: string
  isPublic: boolean | null
  note: string
}

type ZuzuActionBase = {
  kind: ZuzuEntityKind
  key: string
  label: string
  canonScope: string | null
  sourcePath: string | null
}

export type ZuzuCreateAction = ZuzuActionBase & {
  action: 'create'
  payload: Record<string, unknown>
  advisories: string[]
}

export type ZuzuPatchAction = ZuzuActionBase & {
  action: 'patch'
  id: number
  ownerId: number
  diffs: ZuzuFieldDiff[]
  payload: Record<string, unknown>
  advisories: string[]
  untouchedLegacyFields: string[]
  related: ZuzuCandidateSummary[]
}

export type ZuzuSkipAction = ZuzuActionBase & {
  action: 'skip'
  id: number
  reason: string
  advisories: string[]
  untouchedLegacyFields: string[]
  related: ZuzuCandidateSummary[]
}

export type ZuzuConflictAction = ZuzuActionBase & {
  action: 'conflict'
  reason: string
  candidates: ZuzuCandidateSummary[]
}

export type ZuzuPlanAction =
  ZuzuCreateAction | ZuzuPatchAction | ZuzuSkipAction | ZuzuConflictAction

export type ZuzuDreamMapping = {
  id: number
  title: string
  userId: number | null
  isPublic: boolean | null
  isMature: boolean | null
  characterIds: number[]
  scenarioIds: number[]
  rewardIds: number[]
  note: string
}

export type ZuzuResourceAudit = {
  name: string
  trigger: string
  sourcePath: string | null
  status: 'resource-row-found' | 'not-imported' | 'ambiguous'
  finalResourceId: number | null
  matches: {
    id: number
    name: string
    resourceType: string | null
    localPath: string | null
    userId: number | null
    isPublic: boolean | null
  }[]
}

export type ZuzuReconcilePlan = {
  adminUserId: number
  actions: ZuzuPlanAction[]
  counts: Record<ZuzuPlanAction['action'], number>
  dreams: ZuzuDreamMapping[]
  unmatchedLegacyRows: ZuzuUnmatchedLegacyRow[]
  resources: ZuzuResourceAudit[]
  hash: string
}

export const ZUZU_PROVENANCE_MARKERS = [
  'zuzu',
  'koala assassin',
  'gallowsun',
  'dark weird-west samurai animal fable',
] as const

export const LEGACY_ZUZU_DREAM_IDS: readonly number[] = [183]

const IDENTITY_FIELD: Record<ZuzuEntityKind, 'name' | 'title'> = {
  Character: 'name',
  Reward: 'name',
  Scenario: 'title',
}

const NEVER_PATCHED_FIELDS = new Set(['isPublic', 'isMature', 'name', 'title'])
const FILL_ONLY_FIELDS = new Set(['slug', 'artImageId'])

const PROVENANCE_TEXT_FIELDS = [
  'name',
  'title',
  'slug',
  'genre',
  'genres',
  'backstory',
  'presentation',
  'artPrompt',
  'description',
  'collection',
  'inspirations',
  'flavorText',
  'effect',
  'designer',
] as const

const LEGACY_CREATIVE_FIELDS: Record<ZuzuEntityKind, readonly string[]> = {
  Character: [
    'honorific',
    'title',
    'role',
    'personality',
    'drive',
    'quirks',
    'achievements',
    'sampleResponse',
    'voice',
    'backstory',
    'presentation',
    'artPrompt',
  ],
  Reward: ['description', 'effect', 'flavorText', 'artPrompt', 'collection'],
  Scenario: [
    'description',
    'intros',
    'cast',
    'locations',
    'artPrompt',
    'inspirations',
    'secretNotes',
  ],
}

type CanonLabelRule = {
  test: RegExp
  kinds: readonly ZuzuEntityKind[]
  label: string
}

const CANON_LABEL_RULES: readonly CanonLabelRule[] = [
  {
    test: /mechanical reward effect is editorial/i,
    kinds: ['Reward'],
    label: '[Game mechanic: editorial, not Book One canon.]',
  },
  {
    test: /showdown/i,
    kinds: ['Character', 'Scenario', 'Reward'],
    label: '[Showdown/game continuity only; not Book One canon.]',
  },
  {
    test: /later-book/i,
    kinds: ['Character', 'Scenario', 'Reward'],
    label: '[Held for later books; not in Book One.]',
  },
  {
    test: /gamebook origin/i,
    kinds: ['Character', 'Scenario', 'Reward'],
    label: '[Gamebook origin; not in Book One.]',
  },
]

const LABEL_FIELD: Record<ZuzuEntityKind, string> = {
  Character: 'backstory',
  Reward: 'effect',
  Scenario: 'description',
}

export function zuzuCanonLabelFor(
  kind: ZuzuEntityKind,
  canonScope: string | null | undefined,
): string | null {
  if (!canonScope) return null
  const rule = CANON_LABEL_RULES.find(
    (candidate) =>
      candidate.kinds.includes(kind) && candidate.test.test(canonScope),
  )
  return rule?.label ?? null
}

/**
 * The payload exactly as it should land, with a continuity label appended to
 * the kind's main prose field when the entry is game-only, later-book, or an
 * editorial mechanic. Appending is guarded by `includes`, so re-labeling a
 * labeled value is a no-op and a second plan stays clean.
 */
export function zuzuDesiredPayload(
  kind: ZuzuEntityKind,
  entry: ZuzuSubmissionEntry,
): Record<string, unknown> {
  const payload: Record<string, unknown> = { ...entry.payload }
  const label = zuzuCanonLabelFor(kind, entry.canon_scope)
  const field = LABEL_FIELD[kind]
  if (label) {
    const current = typeof payload[field] === 'string' ? payload[field] : ''
    if (!current.includes(label)) {
      payload[field] = current ? `${current.trim()} ${label}` : label
    }
  }
  return payload
}

export function normalizeZuzuIdentity(value: unknown): string {
  if (typeof value !== 'string') return ''
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/^the /, '')
    .trim()
}

function normalizeSlug(value: unknown): string {
  return typeof value === 'string' ? value.trim().toLowerCase() : ''
}

function normalizeValue(value: unknown): unknown {
  if (value === undefined || value === null) return null
  if (typeof value === 'string') {
    const trimmed = value.trim()
    return trimmed === '' ? null : trimmed
  }
  return value
}

function isBlank(value: unknown): boolean {
  return normalizeValue(value) === null
}

function rowLabel(kind: ZuzuEntityKind, row: Record<string, unknown>): string {
  const value = row[IDENTITY_FIELD[kind]]
  return typeof value === 'string' ? value : ''
}

function rowOwnerId(row: ZuzuExistingRow): number | null {
  return typeof row.userId === 'number' ? row.userId : null
}

export function hasZuzuProvenance(
  row: Record<string, unknown>,
  linkedIds?: ReadonlySet<number>,
): boolean {
  if (typeof row.id === 'number' && linkedIds?.has(row.id)) return true
  const text = PROVENANCE_TEXT_FIELDS.map((field) => row[field])
    .filter((value): value is string => typeof value === 'string')
    .join('\n')
    .toLowerCase()
  return ZUZU_PROVENANCE_MARKERS.some((marker) => text.includes(marker))
}

function wordContained(a: string, b: string): boolean {
  if (a.length < 3 || b.length < 3) return false
  return ` ${a} `.includes(` ${b} `) || ` ${b} `.includes(` ${a} `)
}

function isSimilarIdentity(
  kind: ZuzuEntityKind,
  row: Record<string, unknown>,
  payload: Record<string, unknown>,
): boolean {
  return wordContained(
    normalizeZuzuIdentity(payload[IDENTITY_FIELD[kind]]),
    normalizeZuzuIdentity(rowLabel(kind, row)),
  )
}

function matchBasis(
  kind: ZuzuEntityKind,
  row: ZuzuExistingRow,
  payload: Record<string, unknown>,
  linkedIds: ReadonlySet<number>,
): ZuzuMatchBasis | null {
  const wantedSlug = normalizeSlug(payload.slug)
  if (wantedSlug && normalizeSlug(row.slug) === wantedSlug) return 'slug'
  const wantedName = normalizeZuzuIdentity(payload[IDENTITY_FIELD[kind]])
  if (wantedName && normalizeZuzuIdentity(rowLabel(kind, row)) === wantedName) {
    return 'name'
  }
  if (isSimilarIdentity(kind, row, payload)) return 'similar-name'
  // Legacy filler cast linked from a Zuzu Dream often carries a different
  // name; the same species there is enough to stop a blind duplicate create.
  if (
    kind === 'Character' &&
    linkedIds.has(row.id) &&
    wordContained(
      normalizeZuzuIdentity(payload.species),
      normalizeZuzuIdentity(row.species),
    )
  ) {
    return 'linked-species'
  }
  return null
}

/**
 * Superset of every row the planner can treat as a candidate for any entry of
 * `kind`. The CLI uses it to decide which browse rows need a detail fetch;
 * anything it rejects cannot become a patch, skip or conflict candidate.
 */
export function zuzuRowMayMatch(
  kind: ZuzuEntityKind,
  row: ZuzuExistingRow,
  submissions: ZuzuSubmissions,
  linkedIds: ReadonlySet<number> = new Set(),
): boolean {
  if (linkedIds.has(row.id)) return true
  const entries =
    submissionsByKind(submissions).find(
      ([entryKind]) => entryKind === kind,
    )?.[1] ?? []
  return entries.some(
    (entry) => matchBasis(kind, row, entry.payload, linkedIds) !== null,
  )
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`
  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, v]) => v !== undefined)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    return `{${entries
      .map(([k, v]) => `${JSON.stringify(k)}:${stableStringify(v)}`)
      .join(',')}}`
  }
  return JSON.stringify(value ?? null)
}

/**
 * Hash of everything an apply would do and everything it assumes. Patch
 * `before` values are included so a row edited between the dry run and the
 * apply changes the hash and the apply refuses.
 */
export function hashZuzuPlan(
  adminUserId: number,
  actions: readonly ZuzuPlanAction[],
): string {
  const material = actions.map((action) => {
    if (action.action === 'create') {
      return { a: 'create', k: action.kind, key: action.key, p: action.payload }
    }
    if (action.action === 'patch') {
      return {
        a: 'patch',
        k: action.kind,
        key: action.key,
        id: action.id,
        owner: action.ownerId,
        d: action.diffs,
      }
    }
    if (action.action === 'skip') {
      return { a: 'skip', k: action.kind, key: action.key, id: action.id }
    }
    return {
      a: 'conflict',
      k: action.kind,
      key: action.key,
      c: action.candidates.map((candidate) => candidate.id),
    }
  })
  return createHash('sha256')
    .update(stableStringify({ v: 1, adminUserId, material }))
    .digest('hex')
    .slice(0, 16)
}

function submissionsByKind(
  submissions: ZuzuSubmissions,
): [ZuzuEntityKind, ZuzuSubmissionEntry[]][] {
  return [
    ['Character', submissions.characters ?? []],
    ['Reward', submissions.rewards ?? []],
    ['Scenario', submissions.scenarios ?? []],
  ]
}

function legacyFieldsNotCovered(
  kind: ZuzuEntityKind,
  row: Record<string, unknown>,
  desired: Record<string, unknown>,
): string[] {
  return LEGACY_CREATIVE_FIELDS[kind].filter(
    (field) => !(field in desired) && !isBlank(row[field]),
  )
}

function planEntry(
  kind: ZuzuEntityKind,
  entry: ZuzuSubmissionEntry,
  rows: readonly ZuzuExistingRow[],
  adminUserId: number,
  linkedIds: ReadonlySet<number>,
  matchOverride?: number,
): ZuzuPlanAction {
  const desired = zuzuDesiredPayload(kind, entry)
  const base: ZuzuActionBase = {
    kind,
    key: entry.key,
    label: String(desired[IDENTITY_FIELD[kind]] ?? entry.key),
    canonScope: entry.canon_scope ?? null,
    sourcePath: entry.source_path ?? null,
  }

  const candidates: { row: ZuzuExistingRow; summary: ZuzuCandidateSummary }[] =
    []
  for (const row of rows) {
    const basis = matchBasis(kind, row, desired, linkedIds)
    if (!basis) continue
    const exact = basis === 'slug' || basis === 'name'
    const provenance = hasZuzuProvenance(row, linkedIds)
    if (!exact && !provenance) continue
    const owned = rowOwnerId(row) === adminUserId
    // Another account's same-name row with no Zuzu provenance belongs to some
    // other world. It is neither ours to patch nor a duplicate of this entry.
    if (exact && !owned && !provenance) continue
    candidates.push({
      row,
      summary: {
        id: row.id,
        userId: rowOwnerId(row),
        label: rowLabel(kind, row),
        basis,
        exact,
        owned,
        provenance,
      },
    })
  }

  // A human-confirmed identity (`--match <key>=<id>`) resolves a conflict, but
  // only onto a row that is already an owned, Zuzu-provenanced candidate.
  if (matchOverride !== undefined) {
    const forced = candidates.find(
      (candidate) => candidate.row.id === matchOverride,
    )
    if (!forced || !forced.summary.owned || !forced.summary.provenance) {
      return {
        ...base,
        action: 'conflict',
        reason: `match override #${matchOverride} is not an owned Zuzu candidate for ${entry.key}`,
        candidates: candidates.map((candidate) => candidate.summary),
      }
    }
  }

  if (candidates.length === 0) {
    const payload: Record<string, unknown> = { ...desired, isPublic: false }
    const advisories: string[] = []
    const wantedSlug = normalizeSlug(payload.slug)
    const slugHolder = wantedSlug
      ? rows.find((row) => normalizeSlug(row.slug) === wantedSlug)
      : undefined
    if (slugHolder) {
      advisories.push(
        `slug "${wantedSlug}" is held by unrelated row #${slugHolder.id}; the server will assign a unique slug`,
      )
    }
    return { ...base, action: 'create', payload, advisories }
  }

  // One exact, owned, provenanced row is a defensible identity even when
  // similar-name or same-species Zuzu rows also exist; those are reported as
  // related and left alone. Anything short of that is a human decision.
  const exacts = candidates.filter((candidate) => candidate.summary.exact)
  const only =
    matchOverride !== undefined
      ? candidates.find((candidate) => candidate.row.id === matchOverride)
      : exacts.length === 1
        ? exacts[0]
        : undefined
  if (!only || !only.summary.owned || !only.summary.provenance) {
    return {
      ...base,
      action: 'conflict',
      reason: conflictReason(candidates.map((candidate) => candidate.summary)),
      candidates: candidates.map((candidate) => candidate.summary),
    }
  }

  const row = only.row
  const related = candidates
    .filter((candidate) => candidate !== only)
    .map((candidate) => candidate.summary)
  const diffs: ZuzuFieldDiff[] = []
  const advisories: string[] = related.map(
    (candidate) =>
      `related ${candidate.basis} row #${candidate.id} "${candidate.label}" (owner ${candidate.userId ?? 'none'}) left untouched`,
  )
  for (const [field, after] of Object.entries(desired)) {
    if (NEVER_PATCHED_FIELDS.has(field)) continue
    const before = row[field]
    if (FILL_ONLY_FIELDS.has(field)) {
      if (isBlank(before) && !isBlank(after)) {
        diffs.push({ field, before: before ?? null, after })
      } else if (
        !isBlank(before) &&
        !isBlank(after) &&
        normalizeValue(before) !== normalizeValue(after)
      ) {
        advisories.push(
          `keeps existing ${field} ${JSON.stringify(before)}; canon package suggests ${JSON.stringify(after)}`,
        )
      }
      continue
    }
    if (normalizeValue(before) !== normalizeValue(after)) {
      diffs.push({ field, before: before ?? null, after })
    }
  }
  if (row.isPublic === true) {
    advisories.push(
      'row is public; visibility is left unchanged and needs a scoped human decision',
    )
  }

  const untouchedLegacyFields = legacyFieldsNotCovered(kind, row, desired)
  const ownerId = rowOwnerId(row) as number

  if (diffs.length === 0) {
    return {
      ...base,
      action: 'skip',
      id: row.id,
      reason: 'owned Zuzu row already matches the canon package',
      advisories,
      untouchedLegacyFields,
      related,
    }
  }

  return {
    ...base,
    action: 'patch',
    id: row.id,
    ownerId,
    diffs,
    payload: Object.fromEntries(diffs.map((diff) => [diff.field, diff.after])),
    advisories,
    untouchedLegacyFields,
    related,
  }
}

function describeCandidate(candidate: ZuzuCandidateSummary): string {
  return `#${candidate.id} "${candidate.label}" (${candidate.basis}, owner ${candidate.userId ?? 'none'})`
}

function conflictReason(candidates: readonly ZuzuCandidateSummary[]): string {
  const exacts = candidates.filter((candidate) => candidate.exact)
  if (exacts.length > 1) {
    return `ambiguous: ${exacts.length} exact matches ${exacts.map(describeCandidate).join(', ')}`
  }
  const [exact] = exacts
  if (exact && !exact.owned) {
    return `exact match ${describeCandidate(exact)} is not owned by the admin; never patched`
  }
  if (exact) {
    return `exact match ${describeCandidate(exact)} is admin-owned but carries no Zuzu provenance; resolve by hand`
  }
  return `no exact match, but Zuzu rows may be the legacy record: ${candidates
    .map(describeCandidate)
    .join(', ')}; resolve by hand`
}

function idsOf(value: unknown): number[] {
  if (!Array.isArray(value)) return []
  return value
    .map((item) =>
      item && typeof item === 'object' ? (item as { id?: unknown }).id : item,
    )
    .filter((id): id is number => typeof id === 'number')
    .sort((a, b) => a - b)
}

export function isZuzuDream(row: Record<string, unknown>): boolean {
  if (typeof row.id === 'number' && LEGACY_ZUZU_DREAM_IDS.includes(row.id)) {
    return true
  }
  const text = ['title', 'description', 'pitch', 'flavorText', 'artPrompt']
    .map((field) => row[field])
    .filter((value): value is string => typeof value === 'string')
    .join('\n')
    .toLowerCase()
  return ZUZU_PROVENANCE_MARKERS.some((marker) => text.includes(marker))
}

export function mapZuzuDreams(
  rows: readonly ZuzuExistingRow[],
): ZuzuDreamMapping[] {
  const byId = new Map<number, ZuzuExistingRow>()
  for (const row of rows) if (isZuzuDream(row)) byId.set(row.id, row)
  return [...byId.values()]
    .sort((a, b) => a.id - b.id)
    .map((row) => ({
      id: row.id,
      title: typeof row.title === 'string' ? row.title : '',
      userId: rowOwnerId(row),
      isPublic: typeof row.isPublic === 'boolean' ? row.isPublic : null,
      isMature: typeof row.isMature === 'boolean' ? row.isMature : null,
      characterIds: idsOf(row.Characters),
      scenarioIds: idsOf(row.Scenarios),
      rewardIds: idsOf(row.Rewards),
      note: 'legacy LLM-filler Dream: reference only, zero canon authority; no Dream payload exists, so it is reported and never patched',
    }))
}

/** Ids of Characters/Scenarios/Rewards linked from a Zuzu Dream, per kind. */
export function zuzuDreamLinkedIds(
  dreams: readonly ZuzuDreamMapping[],
): Record<ZuzuEntityKind, Set<number>> {
  return {
    Character: new Set(dreams.flatMap((dream) => dream.characterIds)),
    Scenario: new Set(dreams.flatMap((dream) => dream.scenarioIds)),
    Reward: new Set(dreams.flatMap((dream) => dream.rewardIds)),
  }
}

function resourceSearchText(row: Record<string, unknown>): string {
  const triggerWords = Array.isArray(row.triggerWords)
    ? row.triggerWords.join(' ')
    : row.triggerWords
  return [
    row.name,
    row.customLabel,
    row.defaultTrigger,
    triggerWords,
    row.localPath,
  ]
    .filter((value): value is string => typeof value === 'string')
    .join('\n')
    .toLowerCase()
}

export function auditZuzuResources(
  entries: readonly ZuzuModelResourceEntry[],
  rows: readonly ZuzuExistingRow[],
): ZuzuResourceAudit[] {
  return entries.map((entry) => {
    const trigger = entry.trigger.toLowerCase()
    const matches = rows
      .filter((row) => resourceSearchText(row).includes(trigger))
      .sort((a, b) => a.id - b.id)
      .map((row) => ({
        id: row.id,
        name: typeof row.name === 'string' ? row.name : '',
        resourceType:
          typeof row.resourceType === 'string' ? row.resourceType : null,
        localPath: typeof row.localPath === 'string' ? row.localPath : null,
        userId: rowOwnerId(row),
        isPublic: typeof row.isPublic === 'boolean' ? row.isPublic : null,
      }))
    // Training runs import every saved epoch (`name-000004`); the final
    // weights are the one match without an epoch suffix.
    const finals = matches.filter((match) => !/-\d{4,}$/.test(match.name))
    const finalResourceId = finals.length === 1 ? finals[0]!.id : null
    return {
      name: entry.name,
      trigger: entry.trigger,
      sourcePath: entry.source_path ?? null,
      status:
        matches.length === 0
          ? 'not-imported'
          : finalResourceId !== null
            ? 'resource-row-found'
            : 'ambiguous',
      finalResourceId,
      matches,
    }
  })
}

function referencedIds(actions: readonly ZuzuPlanAction[]): Set<string> {
  const ids = new Set<string>()
  for (const action of actions) {
    if (action.action === 'patch' || action.action === 'skip') {
      ids.add(`${action.kind}:${action.id}`)
      for (const row of action.related) ids.add(`${action.kind}:${row.id}`)
    } else if (action.action === 'conflict') {
      for (const row of action.candidates) ids.add(`${action.kind}:${row.id}`)
    }
  }
  return ids
}

function unmatchedLegacyRows(
  existing: ZuzuExistingState,
  actions: readonly ZuzuPlanAction[],
  linked: Record<ZuzuEntityKind, Set<number>>,
): ZuzuUnmatchedLegacyRow[] {
  const referenced = referencedIds(actions)
  const rows: ZuzuUnmatchedLegacyRow[] = []
  for (const kind of ZUZU_ENTITY_KINDS) {
    for (const row of existing[kind] ?? []) {
      if (referenced.has(`${kind}:${row.id}`)) continue
      if (!hasZuzuProvenance(row, linked[kind])) continue
      rows.push({
        kind,
        id: row.id,
        userId: rowOwnerId(row),
        label: rowLabel(kind, row),
        isPublic: typeof row.isPublic === 'boolean' ? row.isPublic : null,
        note: linked[kind].has(row.id)
          ? 'linked from a legacy Zuzu Dream but matches no canon entry; left untouched for human review'
          : 'mentions Zuzu but matches no canon entry; left untouched for human review',
      })
    }
  }
  return rows.sort((a, b) =>
    a.kind === b.kind ? a.id - b.id : a.kind.localeCompare(b.kind),
  )
}

export function planZuzuReconciliation(input: {
  submissions: ZuzuSubmissions
  existing: ZuzuExistingState
  adminUserId: number
  /** Human-confirmed identities: submission key -> existing row id. */
  matchOverrides?: Readonly<Record<string, number>>
}): ZuzuReconcilePlan {
  const { submissions, existing, adminUserId } = input
  const matchOverrides = input.matchOverrides ?? {}
  if (!Number.isInteger(adminUserId) || adminUserId <= 0) {
    throw new Error('adminUserId must be a positive integer')
  }

  const dreams = mapZuzuDreams(existing.Dream ?? [])
  const linked = zuzuDreamLinkedIds(dreams)

  const actions: ZuzuPlanAction[] = []
  for (const [kind, entries] of submissionsByKind(submissions)) {
    for (const entry of entries) {
      actions.push(
        planEntry(
          kind,
          entry,
          existing[kind] ?? [],
          adminUserId,
          linked[kind],
          matchOverrides[entry.key],
        ),
      )
    }
  }

  // One row must never be the write target of two submission entries.
  const targets = new Map<string, number>()
  for (const action of actions) {
    if (action.action !== 'patch' && action.action !== 'skip') continue
    const key = `${action.kind}:${action.id}`
    targets.set(key, (targets.get(key) ?? 0) + 1)
  }
  const finalActions = actions.map((action): ZuzuPlanAction => {
    if (action.action !== 'patch' && action.action !== 'skip') return action
    if ((targets.get(`${action.kind}:${action.id}`) ?? 0) < 2) return action
    return {
      kind: action.kind,
      key: action.key,
      label: action.label,
      canonScope: action.canonScope,
      sourcePath: action.sourcePath,
      action: 'conflict',
      reason: `row #${action.id} matches more than one submission entry`,
      candidates: [],
    }
  })

  const counts = { create: 0, patch: 0, skip: 0, conflict: 0 }
  for (const action of finalActions) counts[action.action] += 1

  return {
    adminUserId,
    actions: finalActions,
    counts,
    dreams,
    unmatchedLegacyRows: unmatchedLegacyRows(existing, finalActions, linked),
    resources: auditZuzuResources(
      submissions.model_resources ?? [],
      existing.Resource ?? [],
    ),
    hash: hashZuzuPlan(adminUserId, finalActions),
  }
}

/**
 * What a successful apply leaves behind, without any I/O: creates become new
 * admin-owned rows, patches merge their payload. The idempotence test plans
 * against this; the CLI re-plans against a fresh live read instead.
 */
export function simulateZuzuApply(
  existing: ZuzuExistingState,
  plan: ZuzuReconcilePlan,
): ZuzuExistingState {
  const next: ZuzuExistingState = {
    ...existing,
    Character: existing.Character.map((row) => ({ ...row })),
    Reward: existing.Reward.map((row) => ({ ...row })),
    Scenario: existing.Scenario.map((row) => ({ ...row })),
  }
  for (const action of plan.actions) {
    const rows = next[action.kind]
    if (action.action === 'create') {
      const id = rows.reduce((max, row) => Math.max(max, row.id), 0) + 1
      rows.push({ ...action.payload, id, userId: plan.adminUserId })
    } else if (action.action === 'patch') {
      const index = rows.findIndex((row) => row.id === action.id)
      if (index >= 0)
        rows[index] = { ...rows[index], ...action.payload } as ZuzuExistingRow
    }
  }
  return next
}

/** Final gate before an HTTP write; the CLI calls it for every action. */
export function assertZuzuWriteIsSafe(
  action: ZuzuPlanAction,
  adminUserId: number,
): void {
  if (action.action === 'create') {
    if (action.payload.isPublic !== false) {
      throw new Error(
        `${action.kind} ${action.key}: create must send isPublic=false`,
      )
    }
    return
  }
  if (action.action === 'patch') {
    if (action.ownerId !== adminUserId) {
      throw new Error(
        `${action.kind} #${action.id}: owned by ${action.ownerId}, not admin ${adminUserId}`,
      )
    }
    for (const field of Object.keys(action.payload)) {
      if (NEVER_PATCHED_FIELDS.has(field)) {
        throw new Error(
          `${action.kind} #${action.id}: patch may not touch ${field}`,
        )
      }
    }
    return
  }
  throw new Error(
    `${action.kind} ${action.key}: ${action.action} is not a write`,
  )
}

/** True when the live row still has every `before` value the plan assumed. */
export function zuzuPatchPreconditionsHold(
  action: ZuzuPatchAction,
  liveRow: Record<string, unknown>,
): boolean {
  if (rowOwnerId(liveRow as ZuzuExistingRow) !== action.ownerId) return false
  return action.diffs.every(
    (diff) =>
      normalizeValue(liveRow[diff.field]) === normalizeValue(diff.before),
  )
}
