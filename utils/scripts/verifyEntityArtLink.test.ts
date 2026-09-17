/*
 * Every entity type an ArtJob can be rendered for must lead somewhere.
 *
 * The routes here were read off each manager component rather than assumed --
 * character-manager reads `characterId ?? character`, scenario-manager lives on
 * /stories rather than /scenarios, and achievement has no manager at all. A
 * wrong param is worse than no link: the page loads and silently selects
 * nothing.
 */
import { describe, expect, it } from 'vitest'
import {
  ENTITY_ART_ROUTES,
  entityArtHref,
  entityArtRefKey,
  entityArtTypeLabel,
} from '../entityArtLink'

describe('entityArtHref', () => {
  it('deep-links the id-keyed types', () => {
    expect(entityArtHref('character', 12)).toBe('/characters?characterId=12')
    expect(entityArtHref('scenario', 7)).toBe('/stories?scenarioId=7')
    expect(entityArtHref('reward', 3)).toBe('/rewards?rewardId=3')
    expect(entityArtHref('bot', 44)).toBe('/bots?botId=44')
    expect(entityArtHref('dream', 9)).toBe('/dreams?dreamId=9')
    expect(entityArtHref('resource', 2726)).toBe('/resources?resourceId=2726')
  })

  it('puts a project id in the path, where its route expects it', () => {
    expect(entityArtHref('project', 5)).toBe('/projects/5')
  })

  it('keys a facet by slug, and falls back to the list without one', () => {
    expect(entityArtHref('facet', 2, 'moonlit')).toBe('/facets?facet=moonlit')
    expect(entityArtHref('facet', 2)).toBe('/facets')
    // A dead `?facet=` would select nothing and look broken.
    expect(entityArtHref('facet', 2, '   ')).toBe('/facets')
  })

  it('escapes a slug rather than pasting it into the query raw', () => {
    expect(entityArtHref('facet', 2, 'a b&c')).toBe('/facets?facet=a%20b%26c')
  })

  it('lands on the list for a type with no manager', () => {
    expect(entityArtHref('achievement', 4)).toBe('/achievements')
  })

  it('returns null rather than a broken link', () => {
    expect(entityArtHref('nonsense', 1)).toBeNull()
    expect(entityArtHref('character', 0)).toBeNull()
    expect(entityArtHref('character', -3)).toBeNull()
    expect(entityArtHref('character', null)).toBeNull()
    expect(entityArtHref(null, 12)).toBeNull()
  })

  it('covers every type the entity-art pipeline can emit', () => {
    // If EntityArtType gains a member, this fails until it gains a route.
    for (const type of ['bot', 'dream', 'character', 'scenario', 'reward',
                        'facet', 'project', 'achievement', 'resource'] as const) {
      expect(ENTITY_ART_ROUTES[type]).toBeDefined()
      expect(entityArtHref(type, 1, 'slug')).toBeTruthy()
    }
  })
})

describe('labels and keys', () => {
  it('labels a type for display', () => {
    expect(entityArtTypeLabel('resource')).toBe('Resource')
    expect(entityArtTypeLabel('scenario')).toBe('Scenario')
    expect(entityArtTypeLabel('mystery')).toBe('mystery')
  })

  it('builds a stable batching key', () => {
    expect(entityArtRefKey('resource', 12)).toBe('resource:12')
    expect(entityArtRefKey(null, null)).toBe(':0')
  })
})
