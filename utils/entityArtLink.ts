// /utils/entityArtLink.ts
//
// Where an ArtImage's linked object actually lives.
//
// Every ArtJob carries the entity it was rendered for -- `payload.entityArt` is
// `{ entityType, entityId }` -- and the queue listing has always returned it,
// but the queue card never rendered it. An ArtImage is either a standalone
// generation, something made by hand in the art generator, or art made FOR
// another object, and only the third case has somewhere to go.
//
// Silas, 2026-08-28, on the home page's rails: "These displays should always
// lead to something, not just static displays of images and text." Same rule
// here; utils/routeSelection.ts exists because two managers had each grown a
// private copy of the id-from-query reader.
import type { EntityArtType } from '~/server/utils/entityArt'

export type EntityArtRoute = {
  /** The page that hosts this type's manager. */
  path: string
  /**
   * Query parameter the manager reads to preselect a row, or null when the
   * type has no deep link and the best we can do is the list.
   *
   * Verified against each manager rather than assumed: character-manager reads
   * `characterId ?? character`, scenario-manager `scenarioId ?? scenario`, and
   * so on. `achievement` has no manager component at all.
   */
  param: string | null
  /** Slug-keyed rather than id-keyed; facet-profile reads `?facet=<slug>`. */
  keyedBySlug?: boolean
  /** `/projects/<id>` is a real route, so the id goes in the path. */
  pathSuffix?: boolean
  label: string
}

export const ENTITY_ART_ROUTES: Record<EntityArtType, EntityArtRoute> = {
  character: { path: '/characters', param: 'characterId', label: 'Character' },
  scenario: { path: '/stories', param: 'scenarioId', label: 'Scenario' },
  reward: { path: '/rewards', param: 'rewardId', label: 'Reward' },
  bot: { path: '/bots', param: 'botId', label: 'Bot' },
  dream: { path: '/dreams', param: 'dreamId', label: 'Dream' },
  resource: { path: '/resources', param: 'resourceId', label: 'Resource' },
  facet: { path: '/facets', param: 'facet', keyedBySlug: true, label: 'Facet' },
  project: { path: '/projects', param: null, pathSuffix: true, label: 'Project' },
  // No manager component exists, so this lands on the list and stops there.
  achievement: { path: '/achievements', param: null, label: 'Achievement' },
}

/**
 * A link to the object an ArtImage was made for, or null when the reference is
 * unusable.
 *
 * A slug-keyed type with no slug returns the bare list rather than null: the
 * page still tells you more than the queue card does, and a dead `?facet=`
 * would silently select nothing.
 */
export function entityArtHref(
  entityType: string | null | undefined,
  entityId: number | null | undefined,
  slug?: string | null,
): string | null {
  const route = ENTITY_ART_ROUTES[entityType as EntityArtType]
  if (!route) return null
  if (!Number.isInteger(entityId) || Number(entityId) <= 0) return null

  if (route.pathSuffix) return `${route.path}/${entityId}`
  if (!route.param) return route.path
  if (route.keyedBySlug) {
    const value = String(slug || '').trim()
    return value ? `${route.path}?${route.param}=${encodeURIComponent(value)}` : route.path
  }
  return `${route.path}?${route.param}=${entityId}`
}

/** Human label for a type, e.g. 'Resource'. Unknown types keep their raw name. */
export function entityArtTypeLabel(entityType: string | null | undefined): string {
  return ENTITY_ART_ROUTES[entityType as EntityArtType]?.label ?? String(entityType || 'Unknown')
}

/** Stable key for batching a set of references, and for cache lookups. */
export function entityArtRefKey(
  entityType: string | null | undefined,
  entityId: number | null | undefined,
): string {
  return `${String(entityType || '')}:${Number(entityId) || 0}`
}
