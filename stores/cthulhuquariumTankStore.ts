// stores/cthulhuquariumTankStore.ts
//
// Server-backed Cthulhuquarium tank state (cthulhuquarium/t-011). Replaces
// the deleted localStorage prototype (stores/cthulhuquariumStore.ts,
// cthulhuquarium/t-010) now that the aquarium API is real
// (server/api/aquarium/**, cthulhuquarium/t-009): coins, hunger, and
// species ownership all live in the Aquarium/AquariumStock rows, never the
// browser. This store's job stays thin -- load/settle/feed/unlock against
// the API and hold the result. Every price and hunger curve is decided
// server-side (server/utils/aquariumEconomy.ts); nothing here invents an
// economy number of its own.

import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { performFetch } from './utils'

export interface TankMonster {
  id: number
  name: string
  slug: string
  species: string | null
  // Only ever populated for OWNED fish -- the server never sends this for
  // catalog (unowned) entries (cthulhuquarium/t-012: "the field note
  // reveals on first unlock, not before").
  fieldNote: string | null
  size: number
  icon: string | null
  iconPath: string | null
  cardPath: string | null
  tier: string
  behavior: string | null
  hue: number | null
  charm: string
  empathy: string
  grace: string
  luck: string
  might: string
  wits: string
}

export interface TankStock {
  id: number
  monsterId: number
  nickname: string | null
  hunger: number
  mood: string | null
  placedAt: string
  Monster: TankMonster
}

export interface Tank {
  id: number
  slug: string
  title: string
  coins: number
  backgroundKey: string | null
  isPublic: boolean
  lastTickAt: string | null
  setSlotsCap: number
  sizeCap: number
  debrisLevel: number
  lastCleanedAt: string | null
  createdAt: string
  updatedAt: string | null
  Stock: TankStock[]
}

export interface CatalogEntry {
  id: number
  name: string
  slug: string
  species: string | null
  // No fieldNote here on purpose -- see TankMonster's own comment. The
  // catalog is what a NOT-yet-owned species looks like.
  depth: number | null
  size: number
  icon: string | null
  iconPath: string | null
  cardPath: string | null
  tier: string
  behavior: string | null
  hue: number | null
  cost: number
}

interface TickResponse {
  aquarium: Tank
  elapsedTicks: number
  ticksProcessed: number
  coinsEarned: number
}

// cthulhuquarium/t-013: how long the store waits after the last Clean click
// before flushing the accumulated count as one request. Long enough to
// collapse a real click spree into a single write, short enough that a
// single deliberate click still feels immediate.
const CLEAN_DEBOUNCE_MS = 400

interface FeedResponse {
  aquarium: Tank
  aquariumStockId: number
  cost: number
  hunger: number
}

interface CleanResponse {
  aquarium: Tank
  debrisLevel: number
}

interface PurchaseResponse {
  aquarium: Tank
  stock: TankStock
  cost: number
  justCompletedBestiary: boolean
}

// The completionist codex (cthulhuquarium/t-024). A collected entry carries
// full art and its fieldNote; an uncollected one is only ever known by name
// and shows as a silhouette in the panel -- the server never sends its
// fieldNote or art paths (same "the server disposes" discipline as
// CatalogEntry above).
export interface BestiaryEntry {
  id: number
  name: string
  slug: string
  species: string | null
  size: number
  icon: string | null
  iconPath: string | null
  cardPath: string | null
  tier: string
  behavior: string | null
  hue: number | null
  collected: boolean
  firstAcquiredAt: string | null
  fieldNote: string | null
}

interface BestiaryResponse {
  data: BestiaryEntry[]
  collectedCount: number
  totalCount: number
  completed: boolean
}

// How often the mounted game component re-settles the tick while the tab is
// open -- purely a UI-freshness cadence, not an economy input. The server's
// own tick_seconds (60s, server/utils/aquariumEconomy.ts) is what actually
// governs how much time has to elapse before a settlement pays anything.
export const TANK_POLL_INTERVAL_MS = 20_000

export const useCthulhuquariumTankStore = defineStore(
  'cthulhuquariumTank',
  () => {
    const tank = ref<Tank | null>(null)
    const catalog = ref<CatalogEntry[]>([])
    const offlineEarnings = ref(0)
    // Ticks settled by the SAME offline-catch-up call that produced
    // offlineEarnings above (load()'s initial settle only, never the live
    // 20s poll -- see settleTickRaw()'s callers). Display-only: lets the
    // welcome-back panel say roughly how long the tank ran unattended
    // alongside what it earned, without the client inventing its own
    // elapsed-time math.
    const offlineTicksProcessed = ref(0)
    // Clicks queued by requestClean() and not yet flushed to the server --
    // see flushClean() below. Shown next to the Clean button so a click
    // spree still gets instant feedback even though the write is batched.
    const pendingCleanClicks = ref(0)
    const loading = ref(false)
    const catalogLoading = ref(false)
    const error = ref('')
    const ready = ref(false)
    // The just-unlocked occupant, field note and all -- the ONE moment its
    // fieldNote is legitimately known client-side (cthulhuquarium/t-012's
    // "give it a real beat" call). The game component watches this to show
    // a reveal, then clears it via dismissReveal().
    const revealedUnlock = ref<TankStock | null>(null)

    // cthulhuquarium/t-024's bestiary. Loaded lazily (the panel starts
    // collapsed) rather than alongside load()/loadCatalog() on every mount --
    // it is the completionist book, not something the tank loop needs every
    // poll.
    const bestiary = ref<BestiaryEntry[]>([])
    const bestiaryCollectedCount = ref(0)
    const bestiaryTotalCount = ref(0)
    const bestiaryLoading = ref(false)
    // Set once, the moment a purchase's response says this unlock closed the
    // set -- the game component watches it for the one-time completion beat,
    // then clears it via dismissBestiaryCompletion(). Never re-derived from
    // bestiaryCollectedCount/bestiaryTotalCount, so simply reloading the
    // bestiary later can't retrigger it.
    const bestiaryJustCompleted = ref(false)

    const stock = computed(() => tank.value?.Stock ?? [])
    const coins = computed(() => tank.value?.coins ?? 0)
    const occupantSize = computed(() =>
      stock.value.reduce((sum, entry) => sum + (entry.Monster.size ?? 1), 0),
    )
    const sizeCap = computed(() => tank.value?.sizeCap ?? 0)
    const debrisLevel = computed(() => tank.value?.debrisLevel ?? 0)
    const hungriest = computed<TankStock | null>(() =>
      stock.value.reduce<TankStock | null>(
        (worst, entry) =>
          !worst || entry.hunger < worst.hunger ? entry : worst,
        null,
      ),
    )

    // Shared by settleTick() (the live 20s heartbeat -- see
    // TANK_POLL_INTERVAL_MS's own comment) and load() (the offline
    // catch-up). Only load() treats the result as an "offline" event;
    // the heartbeat just wants coinsEarned for its coin-mote animation.
    async function settleTickRaw(): Promise<{
      coinsEarned: number
      ticksProcessed: number
    }> {
      const res = await performFetch<TickResponse>('/api/aquarium/tick', {
        method: 'POST',
      })
      if (res.success && res.data) {
        tank.value = res.data.aquarium
        return {
          coinsEarned: res.data.coinsEarned,
          ticksProcessed: res.data.ticksProcessed,
        }
      }
      return { coinsEarned: 0, ticksProcessed: 0 }
    }

    async function settleTick(): Promise<number> {
      const { coinsEarned } = await settleTickRaw()
      return coinsEarned
    }

    async function load(): Promise<void> {
      loading.value = true
      error.value = ''
      try {
        const res = await performFetch<Tank>('/api/aquarium')
        if (!res.success || !res.data) {
          error.value = res.message || 'Failed to load your tank.'
          return
        }
        tank.value = res.data
        // Settle any offline time immediately on load, same as the t-010
        // prototype's own init() did -- the difference is this is now a
        // real server-authoritative settlement, not a localStorage replay.
        const { coinsEarned, ticksProcessed } = await settleTickRaw()
        if (coinsEarned > 0) {
          offlineEarnings.value += coinsEarned
          offlineTicksProcessed.value += ticksProcessed
        }
        ready.value = true
      } finally {
        loading.value = false
      }
    }

    async function loadCatalog(): Promise<void> {
      catalogLoading.value = true
      try {
        const res = await performFetch<CatalogEntry[]>(
          '/api/aquarium/catalog?take=24',
        )
        if (res.success && res.data) catalog.value = res.data
      } finally {
        catalogLoading.value = false
      }
    }

    async function feed(aquariumStockId: number): Promise<boolean> {
      const res = await performFetch<FeedResponse>('/api/aquarium/feed', {
        method: 'POST',
        body: JSON.stringify({ aquariumStockId }),
      })
      if (res.success && res.data) {
        tank.value = res.data.aquarium
        return true
      }
      error.value = res.message || 'Could not feed that occupant.'
      return false
    }

    async function unlock(monsterId: number): Promise<boolean> {
      const res = await performFetch<PurchaseResponse>(
        '/api/aquarium/purchase',
        {
          method: 'POST',
          body: JSON.stringify({ type: 'species', monsterId }),
        },
      )
      if (res.success && res.data) {
        tank.value = res.data.aquarium
        catalog.value = catalog.value.filter((entry) => entry.id !== monsterId)
        revealedUnlock.value = res.data.stock
        if (res.data.justCompletedBestiary) bestiaryJustCompleted.value = true
        // A stale bestiary panel (or one never loaded yet) would otherwise
        // still show this species as uncollected after unlocking it.
        if (bestiary.value.length > 0) await loadBestiary()
        return true
      }
      error.value = res.message || 'Could not unlock that species.'
      return false
    }

    function dismissReveal(): void {
      revealedUnlock.value = null
    }

    // The active-play channel (cthulhuquarium/t-027): -5 debris per click,
    // instant, free, no cooldown. Debris only ever throttles the tank's
    // production RATE, never holdings, so there is nothing to lose by
    // spamming this economically -- but each click was still one POST, so a
    // real click spree meant one write per click. cthulhuquarium/t-013
    // batches that: requestClean() queues the click and (re)starts a
    // debounce timer; only the LAST click in a spree actually fires the
    // network request, carrying however many clicks queued up behind it.
    let cleanDebounceTimer: ReturnType<typeof setTimeout> | undefined

    async function flushClean(): Promise<void> {
      const clicks = pendingCleanClicks.value
      pendingCleanClicks.value = 0
      if (clicks <= 0) return
      const res = await performFetch<CleanResponse>('/api/aquarium/clean', {
        method: 'POST',
        body: JSON.stringify({ clicks }),
      })
      if (res.success && res.data) {
        tank.value = res.data.aquarium
      } else {
        error.value = res.message || 'Could not clean the tank.'
      }
    }

    function requestClean(): void {
      pendingCleanClicks.value += 1
      clearTimeout(cleanDebounceTimer)
      cleanDebounceTimer = setTimeout(() => {
        void flushClean()
      }, CLEAN_DEBOUNCE_MS)
    }

    // Called on unmount so a click right before navigating away still
    // lands instead of being dropped with the cleared timer.
    function flushCleanNow(): void {
      clearTimeout(cleanDebounceTimer)
      void flushClean()
    }

    async function loadBestiary(): Promise<void> {
      bestiaryLoading.value = true
      try {
        const res = await performFetch<BestiaryResponse>(
          '/api/aquarium/bestiary',
        )
        if (res.success && res.data) {
          bestiary.value = res.data.data
          bestiaryCollectedCount.value = res.data.collectedCount
          bestiaryTotalCount.value = res.data.totalCount
        }
      } finally {
        bestiaryLoading.value = false
      }
    }

    function dismissBestiaryCompletion(): void {
      bestiaryJustCompleted.value = false
    }

    function clearOfflineEarnings(): void {
      offlineEarnings.value = 0
      offlineTicksProcessed.value = 0
    }

    return {
      tank,
      catalog,
      stock,
      coins,
      occupantSize,
      sizeCap,
      debrisLevel,
      hungriest,
      offlineEarnings,
      offlineTicksProcessed,
      pendingCleanClicks,
      loading,
      catalogLoading,
      error,
      ready,
      revealedUnlock,
      bestiary,
      bestiaryCollectedCount,
      bestiaryTotalCount,
      bestiaryLoading,
      bestiaryJustCompleted,
      load,
      settleTick,
      loadCatalog,
      feed,
      unlock,
      dismissReveal,
      requestClean,
      flushCleanNow,
      clearOfflineEarnings,
      loadBestiary,
      dismissBestiaryCompletion,
    }
  },
)
