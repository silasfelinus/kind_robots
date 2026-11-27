// /stores/collectibleStore.ts
//
// Shared collectible client (utils/collectibles): the public catalog, the
// signed-in player's wallet and album, and the earn-only actions (daily
// claim, bonus tasks, packs, card back). Every roll happens on the server.
import { reactive } from 'vue'
import { defineStore } from 'pinia'
import { performFetch } from '~/stores/utils'
import { useUserStore } from '~/stores/userStore'
import type {
  CollectibleBack,
  CollectibleCard,
  CollectibleEconomy,
  CollectibleRarity,
} from '~/utils/collectibles/types'

export type CatalogCard = Omit<CollectibleCard, 'artPrompt'>
export type CatalogBack = Omit<CollectibleBack, 'artPrompt'>

export type CollectibleCatalog = {
  slug: string
  title: string
  economy: CollectibleEconomy
  odds: Array<{ rarity: CollectibleRarity; percent: number; count: number }>
  cards: CatalogCard[]
  backs: CatalogBack[]
  art: Record<string, string>
}

export type PullRecord = {
  id: number
  itemKey: string
  rarity: string
  source: string
  duplicate: boolean
  refund: number
  createdAt: string
}

export type CollectiblePlayer = {
  today: string
  balance: number
  packTickets: number
  streak: number
  bestStreak: number
  totalPulls: number
  pullsSinceTop: number
  claimedToday: boolean
  nextClaim: { reward: number; tickets: number; streak: number } | null
  tasksDone: string[]
  owned: Record<string, number>
  backs: string[]
  selectedBack: string | null
  history: PullRecord[]
}

export type OpenedCard = {
  key: string
  rarity: CollectibleRarity
  duplicate: boolean
  refund: number
}

type SetState = {
  catalog: CollectibleCatalog | null
  player: CollectiblePlayer | null
  busy: boolean
  error: string
  notice: string
  lastPack: OpenedCard[]
  newBacks: string[]
}

type ActionResult<R> = { result: R; state: CollectiblePlayer }

export const useCollectibleStore = defineStore('collectibles', () => {
  const userStore = useUserStore()
  const sets = reactive<Record<string, SetState>>({})

  function set(slug: string): SetState {
    if (!sets[slug]) {
      sets[slug] = {
        catalog: null,
        player: null,
        busy: false,
        error: '',
        notice: '',
        lastPack: [],
        newBacks: [],
      }
    }
    return sets[slug]
  }

  async function loadCatalog(slug: string): Promise<boolean> {
    const state = set(slug)
    const response = await performFetch<CollectibleCatalog>(
      `/api/collectibles/${slug}`,
    )
    if (!response.success || !response.data) {
      state.error = response.message || 'Could not load the collection.'
      return false
    }
    state.catalog = response.data
    return true
  }

  async function loadPlayer(slug: string): Promise<boolean> {
    const state = set(slug)
    if (!userStore.isLoggedIn) {
      state.player = null
      return false
    }
    const response = await performFetch<CollectiblePlayer>(
      `/api/collectibles/${slug}/me`,
      { cache: 'no-store' },
    )
    if (!response.success || !response.data) {
      state.error = response.message || 'Could not load your collection.'
      return false
    }
    state.player = response.data
    return true
  }

  async function act<R>(
    slug: string,
    path: string,
    body?: Record<string, unknown>,
  ): Promise<R | null> {
    const state = set(slug)
    if (!userStore.isLoggedIn || state.busy) return null
    state.busy = true
    state.error = ''
    state.notice = ''
    try {
      const response = await performFetch<ActionResult<R>>(
        `/api/collectibles/${slug}/${path}`,
        { method: 'POST', body: JSON.stringify(body ?? {}) },
        1,
        20000,
      )
      if (!response.success || !response.data) {
        throw new Error(response.message || 'That did not work.')
      }
      state.player = response.data.state
      return response.data.result
    } catch (caught) {
      state.error =
        caught instanceof Error ? caught.message : 'That did not work.'
      return null
    } finally {
      state.busy = false
    }
  }

  async function claimDaily(slug: string) {
    const result = await act<{
      reward: number
      tickets: number
      streak: number
      newBacks: string[]
    }>(slug, 'claim')
    if (result) {
      const state = set(slug)
      const name = state.catalog?.economy.currencyName ?? 'coins'
      state.notice = `+${result.reward} ${name}${result.tickets ? ` and ${result.tickets} free pack${result.tickets > 1 ? 's' : ''}` : ''}. Day ${result.streak} of your streak.`
      state.newBacks = result.newBacks
    }
    return result
  }

  async function completeTask(slug: string, task: string) {
    const state = set(slug)
    if (!state.player || state.player.tasksDone.includes(task)) return null
    return act<{ reward: number; already: boolean }>(slug, 'task', { task })
  }

  async function openPack(slug: string) {
    const result = await act<{
      cards: OpenedCard[]
      usedTicket: boolean
      refunds: number
      newBacks: string[]
    }>(slug, 'pack')
    if (result) {
      const state = set(slug)
      state.lastPack = result.cards
      state.newBacks = result.newBacks
    }
    return result
  }

  async function selectBack(slug: string, back: string) {
    return act<string>(slug, 'back', { back })
  }

  async function syncArt(slug: string): Promise<boolean> {
    const state = set(slug)
    const response = await performFetch<{ linked: number }>(
      `/api/collectibles/${slug}/art-sync`,
      { method: 'POST' },
      1,
      60000,
    )
    state.notice = response.message || ''
    if (!response.success) return false
    await loadCatalog(slug)
    return true
  }

  function dismissPack(slug: string) {
    const state = set(slug)
    state.lastPack = []
    state.newBacks = []
  }

  return {
    sets,
    set,
    loadCatalog,
    loadPlayer,
    claimDaily,
    completeTask,
    openPack,
    selectBack,
    syncArt,
    dismissPack,
  }
})
