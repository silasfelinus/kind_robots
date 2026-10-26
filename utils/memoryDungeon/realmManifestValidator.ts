export interface RealmSite {
  key: string
  title: string
  persistenceKey: string
  choices: readonly { id: string; label: string; outcome: string }[]
  art?: { path: string; prompt: string; status: 'placeholder' | 'queued' | 'delivered'; jobId?: number | null; url?: string | null }
}
export interface RealmManifest {
  name: string
  coordinates: readonly string[]
  start: string
  links: Readonly<Record<string, readonly string[]>>
  sites: readonly RealmSite[]
}
export function validateRealmManifest(m: RealmManifest): string[] {
  const problems: string[] = []
  const required = new Set<string>()
  for (const key of m.coordinates) {
    if (required.has(key)) problems.push(`Duplicate coordinate ${key}`)
    required.add(key)
  }
  if (!required.size || !required.has(m.start)) problems.push('Invalid start or empty realm')
  const seen = new Set<string>()
  const artPaths = new Set<string>()
  for (const site of m.sites) {
    if (seen.has(site.key)) problems.push(`Duplicate site ${site.key}`)
    if (!required.has(site.key)) problems.push(`Unknown site ${site.key}`)
    seen.add(site.key)
    if (!site.title.trim() || !site.persistenceKey.trim()) problems.push(`Missing title or persistent consequence at ${site.key}`)
    if (site.choices.length < 2) problems.push(`Too few choices at ${site.key}`)
    const ids = new Set<string>()
    for (const c of site.choices) {
      if (!c.id.trim() || ids.has(c.id)) problems.push(`Duplicate choice at ${site.key}`)
      if (!c.label.trim() || !c.outcome.trim()) problems.push(`Missing choice outcome at ${site.key}`)
      ids.add(c.id)
    }
    const art = site.art
    if (!art) { problems.push(`Missing art or placeholder at ${site.key}`); continue }
    if (!art.path.startsWith('/images/') || !/\.(webp|png|jpe?g)$/.test(art.path) || art.prompt.trim().length < 40)
      problems.push(`Incomplete art brief at ${site.key}`)
    if (artPaths.has(art.path)) problems.push(`Duplicate art target ${art.path}`)
    artPaths.add(art.path)
    if (art.status !== 'placeholder' && (!Number.isSafeInteger(art.jobId) || (art.jobId ?? 0) < 1))
      problems.push(`Unverified ArtJob at ${site.key}`)
    if (art.status === 'delivered' && !/^https:\/\//.test(art.url ?? '')) problems.push(`Undelivered art at ${site.key}`)
  }
  for (const key of required) if (!seen.has(key)) problems.push(`Missing site ${key}`)
  for (const [from, targets] of Object.entries(m.links)) {
    if (!required.has(from)) problems.push(`Unknown link origin ${from}`)
    if (new Set(targets).size !== targets.length) problems.push(`Duplicate link at ${from}`)
    for (const target of targets) if (!required.has(target)) problems.push(`Unknown link target ${from} -> ${target}`)
  }
  const visited = new Set<string>()
  const pending = required.has(m.start) ? [m.start] : []
  for (let i = 0; i < pending.length; i++) {
    const at = pending[i]!
    if (visited.has(at)) continue
    visited.add(at)
    for (const next of m.links[at] ?? []) if (required.has(next) && !visited.has(next)) pending.push(next)
  }
  for (const key of required) if (!visited.has(key)) problems.push(`Unreachable site ${key}`)
  return problems.map((problem) => `${m.name}: ${problem}`)
}
