// /utils/facetAliases.ts

/**
 * Produce the globally unique key used for Facet resolution.
 *
 * This deliberately normalizes formatting, not meaning:
 *   cowCore, cow-core, cow core -> cowcore
 *   cow and cows remain different keys until both are explicitly assigned.
 */
export function normalizeFacetLookupKey(value: string): string {
  return value
    .trim()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
}

export function normalizeFacetAlias(value: string): string {
  return value.trim().replace(/\s+/g, ' ')
}

export type PreparedFacetAlias = {
  alias: string
  lookupKey: string
}

export function prepareFacetAlias(value: string): PreparedFacetAlias {
  const alias = normalizeFacetAlias(value)
  const lookupKey = normalizeFacetLookupKey(alias)

  if (!alias || !lookupKey) {
    throw new Error('Facet aliases must contain at least one letter or number.')
  }

  return { alias, lookupKey }
}

export function prepareUniqueFacetAliases(values: string[]): PreparedFacetAlias[] {
  const byLookupKey = new Map<string, PreparedFacetAlias>()

  for (const value of values) {
    const prepared = prepareFacetAlias(value)
    if (!byLookupKey.has(prepared.lookupKey)) {
      byLookupKey.set(prepared.lookupKey, prepared)
    }
  }

  return [...byLookupKey.values()]
}
