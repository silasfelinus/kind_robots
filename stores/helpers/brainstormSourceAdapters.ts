// /stores/helpers/brainstormSourceAdapters.ts
//
// conductor brainstorm/t-012: reusable source-object context adapter.
//
// A BrainstormSourceRef (types/brainstorm.ts) only carries
// `{ modelType, id?, slug?, intent? }` -- enough to persist and replay a
// session, but not enough to show the user *what* they picked or let them
// find it in the first place. This registry maps a modelType to a small,
// inspectable adapter that knows how to:
//   (a) resolve a ref into a display-ready summary, reusing each entity's
//       own Pinia store (fetchCharacterById, fetchDreamById, ...) rather
//       than a bespoke brainstorm-specific endpoint, and
//   (b) search that entity type for a picker UI.
//
// Started with Character and Dream (BrainstormSourceRef.modelType is a free
// string; these were the first two with real adapters). Scenario joined them
// in brainstorm/t-014, Reward in brainstorm/t-028. Bot, Project, and Prompt
// can each register a BrainstormSourceAdapter the same way, with no new API
// surface and no bespoke endpoint -- just another entry in
// BRAINSTORM_SOURCE_ADAPTERS backed by that entity's existing store.
//
// The store-agnostic dispatch/fallback logic lives in
// brainstormSourceAdapterKit.ts (no Pinia imports, unit-testable with plain
// tsx) and is re-exported here bound to the real registry below.
import { useCharacterStore } from '@/stores/characterStore'
import { useDreamStore } from '@/stores/dreamStore'
import { useRewardStore } from '@/stores/rewardStore'
import { useScenarioStore } from '@/stores/scenarioStore'
import { resolveArtImageSrc } from '@/utils/artImageSrc'
import {
  fetchFreshSourceRows,
  getBrainstormSourceAdapter as getAdapterFromRegistry,
  matchesQuery,
  resolveBrainstormSource as resolveFromRegistry,
  searchBrainstormSources as searchFromRegistry,
} from '@/stores/helpers/brainstormSourceAdapterKit'
import type { BrainstormSourceAdapter } from '@/stores/helpers/brainstormSourceAdapterKit'
import type { BrainstormSourceRef } from '@/types/brainstorm'

export type {
  BrainstormSourceAdapter,
  BrainstormSourceAdapterRegistry,
  BrainstormSourceDisplay,
  BrainstormSourceOption,
} from '@/stores/helpers/brainstormSourceAdapterKit'

const SEARCH_RESULT_LIMIT = 20

const characterAdapter: BrainstormSourceAdapter = {
  modelType: 'character',
  label: 'Character',
  async resolve(ref) {
    if (!ref.id) return null
    const store = useCharacterStore()
    // force=true: a cached/localStorage Character can predate an auth
    // transition. The server route enforces canView on every request, so a
    // fresh fetch is the actual authorization check -- serving the cached
    // row here would let a stale reference expose a Character the current
    // session is no longer allowed to view (reviewer finding on PR #1820).
    const character = await store.fetchCharacterById(ref.id, true)
    if (!character) return null

    return {
      modelType: 'character',
      id: character.id,
      title: character.name || `Character #${character.id}`,
      subtitle:
        [character.honorific, character.class, character.species]
          .filter(Boolean)
          .join(' · ') || undefined,
      thumbnailUrl: character.imagePath || null,
    }
  },
  async search(query) {
    const store = useCharacterStore()
    // fetchCharacters(true) intentionally preserves cached rows on network
    // failure for offline-friendly Character surfaces. The Brainstorm picker
    // has a stricter privacy contract: if fresh authorization cannot be
    // confirmed, return zero candidates instead of searching that cache.
    const freshCharacters = await fetchFreshSourceRows(
      () => store.fetchCharacters(true),
      () => Boolean(store.error),
    )

    return freshCharacters
      .filter((character) =>
        matchesQuery(
          [
            character.name,
            character.honorific,
            character.class,
            character.species,
          ],
          query,
        ),
      )
      .slice(0, SEARCH_RESULT_LIMIT)
      .map((character) => ({
        modelType: 'character',
        id: character.id,
        title: character.name || `Character #${character.id}`,
        subtitle: character.honorific || character.class || undefined,
      }))
  },
}

const dreamAdapter: BrainstormSourceAdapter = {
  modelType: 'dream',
  label: 'Dream',
  async resolve(ref) {
    if (!ref.id) return null
    const store = useDreamStore()
    const dream = await store.fetchDreamById(ref.id)
    if (!dream) return null

    return {
      modelType: 'dream',
      id: dream.id,
      title: dream.title || `Dream #${dream.id}`,
      subtitle:
        dream.pitch || dream.description || dream.flavorText || undefined,
      thumbnailUrl: dream.ArtImage
        ? resolveArtImageSrc(dream.ArtImage) || null
        : null,
    }
  },
  async search(query) {
    const store = useDreamStore()
    // fetchDreams() already returns [] when the remote request fails, but use
    // the same explicit fresh-result contract as Character search so this
    // adapter can never fall back to store.dreams after a failed revalidation.
    const freshDreams = await fetchFreshSourceRows(
      () => store.fetchDreams(),
      () => Boolean(store.error),
    )

    return freshDreams
      .filter((dream) =>
        matchesQuery([dream.title, dream.pitch, dream.description], query),
      )
      .slice(0, SEARCH_RESULT_LIMIT)
      .map((dream) => ({
        modelType: 'dream',
        id: dream.id,
        title: dream.title || `Dream #${dream.id}`,
        subtitle: dream.pitch || dream.description || undefined,
      }))
  },
}

const scenarioAdapter: BrainstormSourceAdapter = {
  modelType: 'scenario',
  label: 'Scenario',
  async resolve(ref) {
    if (!ref.id) return null
    const store = useScenarioStore()
    // force=true for the same reason characterAdapter forces its fetch: a
    // cached/localStorage Scenario can predate an auth transition.
    const scenario = await store.fetchScenarioById(ref.id, true)
    if (!scenario) return null

    return {
      modelType: 'scenario',
      id: scenario.id,
      title: scenario.title || `Scenario #${scenario.id}`,
      subtitle: scenario.locations || scenario.tier || undefined,
      thumbnailUrl: scenario.imagePath || null,
    }
  },
  async search(query) {
    const store = useScenarioStore()
    // Same fail-closed contract as characterAdapter/dreamAdapter: a failed
    // fresh fetch must never fall back to searching a possibly-stale cache.
    const freshScenarios = await fetchFreshSourceRows(
      () => store.fetchScenarios(true),
      () => Boolean(store.lastError),
    )

    return freshScenarios
      .filter((scenario) =>
        matchesQuery(
          [scenario.title, scenario.locations, scenario.tier, scenario.group],
          query,
        ),
      )
      .slice(0, SEARCH_RESULT_LIMIT)
      .map((scenario) => ({
        modelType: 'scenario',
        id: scenario.id,
        title: scenario.title || `Scenario #${scenario.id}`,
        subtitle: scenario.locations || undefined,
      }))
  },
}

const rewardAdapter: BrainstormSourceAdapter = {
  modelType: 'reward',
  label: 'Reward',
  async resolve(ref) {
    if (!ref.id) return null
    const store = useRewardStore()
    // fetchRewardById has no force param (unlike character/scenario) -- it
    // already serves a cached row from store.rewards before hitting the
    // network, which is fine here since Reward carries no view-permission
    // gate the way Character/Scenario's canView check does.
    const reward = await store.fetchRewardById(ref.id)
    if (!reward) return null

    return {
      modelType: 'reward',
      id: reward.id,
      title: reward.name || `Reward #${reward.id}`,
      subtitle: reward.description || reward.flavorText || undefined,
      thumbnailUrl: reward.imagePath || null,
    }
  },
  async search(query) {
    const store = useRewardStore()
    // Same fail-closed contract as characterAdapter/dreamAdapter/
    // scenarioAdapter: a failed fresh fetch must never fall back to
    // searching a possibly-stale cache.
    const freshRewards = await fetchFreshSourceRows(
      () => store.fetchRewards(true),
      () => Boolean(store.error),
    )

    return freshRewards
      .filter((reward) =>
        matchesQuery(
          [reward.name, reward.description, reward.flavorText],
          query,
        ),
      )
      .slice(0, SEARCH_RESULT_LIMIT)
      .map((reward) => ({
        modelType: 'reward',
        id: reward.id,
        title: reward.name || `Reward #${reward.id}`,
        subtitle: reward.description || undefined,
      }))
  },
}

/** The adapter registry. Keys are lowercase modelType strings. */
export const BRAINSTORM_SOURCE_ADAPTERS: Record<
  string,
  BrainstormSourceAdapter
> = {
  character: characterAdapter,
  dream: dreamAdapter,
  scenario: scenarioAdapter,
  reward: rewardAdapter,
}

export function listBrainstormSourceAdapters(): BrainstormSourceAdapter[] {
  return Object.values(BRAINSTORM_SOURCE_ADAPTERS)
}

export function getBrainstormSourceAdapter(
  modelType: string | null | undefined,
): BrainstormSourceAdapter | null {
  return getAdapterFromRegistry(modelType, BRAINSTORM_SOURCE_ADAPTERS)
}

export async function resolveBrainstormSource(
  ref: BrainstormSourceRef | null | undefined,
) {
  return resolveFromRegistry(ref, BRAINSTORM_SOURCE_ADAPTERS)
}

export async function searchBrainstormSources(
  modelType: string,
  query: string,
) {
  return searchFromRegistry(modelType, query, BRAINSTORM_SOURCE_ADAPTERS)
}
