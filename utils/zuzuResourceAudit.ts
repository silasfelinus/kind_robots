export type ZuzuResourceKind = 'character' | 'scenario' | 'reward' | 'model-resource'
export type ZuzuMatchStatus = 'slug-match' | 'name-review' | 'trigger-review' | 'ambiguous' | 'missing'

export type ZuzuResourceCandidate = {
  kind: ZuzuResourceKind
  key: string
  name: string
  slug: string | null
  trigger: string | null
  sourcePath: string
}

export type ZuzuExistingResource = {
  id: number
  name: string
  slug: string | null
  triggerWords?: string | null
}

export type ZuzuResourceMatch = {
  candidate: ZuzuResourceCandidate
  status: ZuzuMatchStatus
  matches: { id: number; name: string; slug: string | null }[]
}

export type ZuzuFacetMembership = {
  id: number
  title: string
  taxonomy: string
  isRandomizable: boolean
  worlds: string[]
}

export type ZuzuResourceAuditReport = {
  source: string
  scopedTo: 'authenticated-admin-owned-records'
  matches: ZuzuResourceMatch[]
  taggedFacets: ZuzuFacetMembership[]
  counts: Record<ZuzuMatchStatus, number>
}

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error('Invalid Zuzu candidate manifest record.')
  return value as Record<string, unknown>
}

function requiredString(value: unknown): string {
  if (typeof value !== 'string' || !value.trim() || value.length > 300)
    throw new Error('Invalid Zuzu candidate identity.')
  return value.trim()
}

function optionalString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? requiredString(value) : null
}

export function parseZuzuResourceCandidates(input: unknown): ZuzuResourceCandidate[] {
  const source = asRecord(input)
  if (source.schema_version !== 1 || source.status !== 'prepared-not-applied')
    throw new Error('Unsupported Zuzu resource submission manifest.')

  const candidates: ZuzuResourceCandidate[] = []
  for (const [field, kind, label] of [
    ['characters', 'character', 'name'],
    ['scenarios', 'scenario', 'title'],
    ['rewards', 'reward', 'name'],
  ] as const) {
    const entries = source[field]
    if (!Array.isArray(entries) || entries.length > 100)
      throw new Error('Invalid Zuzu ' + field + ' submissions.')
    for (const entry of entries) {
      const record = asRecord(entry)
      const payload = asRecord(record.payload)
      candidates.push({
        kind,
        key: requiredString(record.key),
        name: requiredString(payload[label]),
        slug: optionalString(payload.slug),
        trigger: null,
        sourcePath: requiredString(record.source_path),
      })
    }
  }

  const resources = source.model_resources
  if (!Array.isArray(resources) || resources.length > 100)
    throw new Error('Invalid Zuzu model resources.')
  for (const entry of resources) {
    const record = asRecord(entry)
    const name = requiredString(record.name)
    candidates.push({
      kind: 'model-resource',
      key: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
      name,
      slug: null,
      trigger: optionalString(record.trigger),
      sourcePath: requiredString(record.source_path),
    })
  }

  if (new Set(candidates.map((entry) => entry.kind + ':' + entry.key)).size !== candidates.length)
    throw new Error('Duplicate Zuzu candidate keys.')
  return candidates
}

function normalized(value: string | null | undefined): string {
  return String(value ?? '').trim().replace(/\s+/g, ' ').toLocaleLowerCase('en')
}

function triggerMatches(haystack: string | null | undefined, trigger: string): boolean {
  return String(haystack ?? '')
    .split(/[\s,;|]+/)
    .some((part) => normalized(part) === normalized(trigger))
}

export function reconcileZuzuResources(
  candidates: readonly ZuzuResourceCandidate[],
  existing: Record<ZuzuResourceKind, readonly ZuzuExistingResource[]>,
): ZuzuResourceMatch[] {
  return candidates.map((candidate) => {
    const rows = existing[candidate.kind]
    const bySlug = candidate.slug
      ? rows.filter((row) => normalized(row.slug) === normalized(candidate.slug))
      : []
    const byName = rows.filter((row) => normalized(row.name) === normalized(candidate.name))
    const byTrigger = candidate.trigger
      ? rows.filter((row) => triggerMatches(row.triggerWords, candidate.trigger!))
      : []
    const pool = bySlug.length ? bySlug : byName.length ? byName : byTrigger
    const status: ZuzuMatchStatus =
      pool.length > 1 ? 'ambiguous'
      : !pool.length ? 'missing'
      : bySlug.length ? 'slug-match'
      : byName.length ? 'name-review'
      : 'trigger-review'
    return {
      candidate,
      status,
      matches: pool.map(({ id, name, slug }) => ({ id, name, slug })),
    }
  })
}

export function countZuzuMatches(matches: readonly ZuzuResourceMatch[]): Record<ZuzuMatchStatus, number> {
  const counts: Record<ZuzuMatchStatus, number> = {
    'slug-match': 0,
    'name-review': 0,
    'trigger-review': 0,
    ambiguous: 0,
    missing: 0,
  }
  for (const match of matches) counts[match.status]++
  return counts
}

export function worldTags(metadata: Record<string, unknown> | null): string[] {
  if (!Array.isArray(metadata?.worlds)) return []
  return metadata.worlds.filter((value): value is string => typeof value === 'string')
}
