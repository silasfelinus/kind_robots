/**
 * Route sharding for the responsive layout audit (interface-vision/t-154).
 *
 * The daily audit grew to ~78 routes x 3 viewports and began hitting the
 * 60-minute job timeout every day, which also skipped the Slime City Clash and
 * tablet-menu audits behind it. CI now runs the sweep as a matrix; each shard
 * audits a disjoint, round-robin slice of the route list so that slow route
 * families (galleries, arcade cabinets) spread across shards instead of
 * clustering in one.
 *
 * Every route stays audited: the union of all shards is the full list. A
 * shard keeps all three viewports for its routes, so the cross-viewport
 * backdrop check still sees every breakpoint of each route it judges.
 */

/**
 * Parse `--shard i/n` (1-based). Returns `{ index, total }`, or null when no
 * shard was requested. Throws on malformed input rather than silently
 * auditing everything or nothing.
 */
export function parseShard(value) {
  if (value === undefined || value === null || value === '') return null
  const match = /^(\d+)\/(\d+)$/.exec(String(value).trim())
  if (!match) throw new Error(`--shard must look like 1/3, got "${value}"`)
  const index = Number(match[1])
  const total = Number(match[2])
  if (total < 1 || index < 1 || index > total)
    throw new Error(`--shard ${value} is out of range`)
  return { index, total }
}

/** Round-robin slice of `routes` for a parsed shard (null = all routes). */
export function selectShard(routes, shard) {
  if (!shard) return [...routes]
  return routes.filter((_, i) => i % shard.total === shard.index - 1)
}
