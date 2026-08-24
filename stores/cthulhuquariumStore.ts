// stores/cthulhuquariumStore.ts
//
// Prototype state for the Cthulhuquarium play loop (conductor cthulhuquarium/t-010).
//
// DELIBERATELY CLIENT-ONLY AND TEMPORARY. This holds coins, food, hunger, and the
// stocked species in localStorage so the /play/aquarium tab is playable the day it
// lands instead of being an empty shell waiting on a migration. cthulhuquarium/t-009
// replaces every field here with the server-authoritative aquarium API, and t-011
// rewires the game component to it. Nothing else should import this store — when the
// real API lands, this file is deleted, not extended.
//
// The species list below is a hand-seeded subset of the canonical fish bible in
// silasfelinus/cthulhuquarium (fish/*.yaml). It is a placeholder for rendering, not a
// second source of truth: t-008 seeds the real bible into kind_robots Character rows
// and t-011 reads them from there.

import { defineStore } from 'pinia'

const SAVE_KEY = 'cthulhuquarium.prototype.v1'

/** Offline earnings are capped so idling is rewarding but strictly worse than playing. */
const OFFLINE_CAP_SECONDS = 60 * 60 * 4
const FOOD_COST = 10
const HUNGER_PER_SECOND = 0.55
const FEED_RESTORE = 45

export type PrototypeSpecies = {
  slug: string
  name: string
  note: string
  tier: number
  /** Coins produced per drop cycle. */
  yield: number
  /** Seconds between coin drops when fed. */
  interval: number
  unlockCost: number
  hue: number
  /** How it moves. Mirrors the bible's `behavior` field. */
  behavior: 'drift' | 'dart' | 'lurk'
}

export const PROTOTYPE_SPECIES: PrototypeSpecies[] = [
  {
    slug: 'gutter-minnow',
    name: 'Gutter Minnow',
    note: 'Common. Thrives in water no one has changed. Grateful for very little.',
    tier: 1,
    yield: 3,
    interval: 6,
    unlockCost: 0,
    hue: 168,
    behavior: 'drift',
  },
  {
    slug: 'lamplight-angler',
    name: 'Lamplight Angler',
    note: 'The light is not for you. It has never been for you.',
    tier: 2,
    yield: 9,
    interval: 9,
    unlockCost: 120,
    hue: 96,
    behavior: 'lurk',
  },
  {
    slug: 'the-understudy',
    name: 'The Understudy',
    note: 'Resembles whichever fish you looked at last. Specimen unavailable for photography.',
    tier: 3,
    yield: 22,
    interval: 12,
    unlockCost: 480,
    hue: 286,
    behavior: 'dart',
  },
]

type StockEntry = { slug: string; hunger: number; nextDropAt: number }

type SaveShape = {
  coins: number
  food: number
  stock: StockEntry[]
  lastSeenAt: number
}

function defaultSave(): SaveShape {
  return {
    coins: 25,
    food: 3,
    stock: [{ slug: 'gutter-minnow', hunger: 100, nextDropAt: 0 }],
    lastSeenAt: Date.now(),
  }
}

function readSave(): SaveShape {
  if (typeof window === 'undefined') return defaultSave()
  try {
    const raw = window.localStorage.getItem(SAVE_KEY)
    if (!raw) return defaultSave()
    const parsed = JSON.parse(raw) as Partial<SaveShape>
    const known = new Set(PROTOTYPE_SPECIES.map((entry) => entry.slug))
    return {
      coins: Number(parsed.coins) || 0,
      food: Number(parsed.food) || 0,
      // Drop stock referencing a species this build no longer knows, rather than
      // rendering an undefined lookup.
      stock: (parsed.stock ?? []).filter((entry) => known.has(entry?.slug)),
      lastSeenAt: Number(parsed.lastSeenAt) || Date.now(),
    }
  } catch {
    /* A corrupt or unreadable save is not worth failing the page over. */
    return defaultSave()
  }
}

export const useCthulhuquariumStore = defineStore('cthulhuquarium', () => {
  const coins = ref(0)
  const food = ref(0)
  const stock = ref<StockEntry[]>([])
  const offlineEarnings = ref(0)
  const ready = ref(false)

  const speciesBySlug = computed(
    () => new Map(PROTOTYPE_SPECIES.map((entry) => [entry.slug, entry])),
  )
  const unlocked = computed(
    () => new Set(stock.value.map((entry) => entry.slug)),
  )
  const hungriest = computed(() =>
    stock.value.reduce((low, entry) => Math.min(low, entry.hunger), 100),
  )

  function persist() {
    if (typeof window === 'undefined') return
    try {
      const payload: SaveShape = {
        coins: coins.value,
        food: food.value,
        stock: stock.value,
        lastSeenAt: Date.now(),
      }
      window.localStorage.setItem(SAVE_KEY, JSON.stringify(payload))
    } catch {
      /* Private-mode or quota-exhausted storage just means no save this session. */
    }
  }

  /** Settle time away, capped, then start the live clock. */
  function init() {
    const save = readSave()
    coins.value = save.coins
    food.value = save.food
    stock.value = save.stock

    const away = Math.min(
      Math.max(0, (Date.now() - save.lastSeenAt) / 1000),
      OFFLINE_CAP_SECONDS,
    )
    let earned = 0
    for (const entry of stock.value) {
      const species = speciesBySlug.value.get(entry.slug)
      if (!species) continue
      // Away time drains hunger first; a fish only pays for the stretch it was fed.
      const fedSeconds = Math.min(away, entry.hunger / HUNGER_PER_SECOND)
      earned += Math.floor(fedSeconds / species.interval) * species.yield
      entry.hunger = Math.max(0, entry.hunger - away * HUNGER_PER_SECOND)
      entry.nextDropAt = 0
    }
    offlineEarnings.value = Math.floor(earned)
    coins.value += offlineEarnings.value
    ready.value = true
    persist()
  }

  /** One simulation step. `delta` is seconds since the previous tick. */
  function tick(delta: number) {
    let gained = 0
    for (const entry of stock.value) {
      const species = speciesBySlug.value.get(entry.slug)
      if (!species) continue
      entry.hunger = Math.max(0, entry.hunger - delta * HUNGER_PER_SECOND)
      if (entry.hunger <= 0) continue
      entry.nextDropAt -= delta
      if (entry.nextDropAt <= 0) {
        entry.nextDropAt = species.interval
        gained += species.yield
      }
    }
    if (gained > 0) coins.value += gained
  }

  function collect(amount: number) {
    coins.value += amount
  }

  function buyFood(): boolean {
    if (coins.value < FOOD_COST) return false
    coins.value -= FOOD_COST
    food.value += 1
    persist()
    return true
  }

  /** Spend one food on the hungriest occupant. Returns false when there is nothing to do. */
  function feed(): boolean {
    if (food.value <= 0) return false
    const target = stock.value.reduce<StockEntry | null>(
      (worst, entry) => (!worst || entry.hunger < worst.hunger ? entry : worst),
      null,
    )
    if (!target) return false
    food.value -= 1
    target.hunger = Math.min(100, target.hunger + FEED_RESTORE)
    persist()
    return true
  }

  function unlock(slug: string): boolean {
    const species = speciesBySlug.value.get(slug)
    if (!species || unlocked.value.has(slug)) return false
    if (coins.value < species.unlockCost) return false
    coins.value -= species.unlockCost
    stock.value.push({ slug, hunger: 100, nextDropAt: species.interval })
    persist()
    return true
  }

  function reset() {
    const save = defaultSave()
    coins.value = save.coins
    food.value = save.food
    stock.value = save.stock
    offlineEarnings.value = 0
    persist()
  }

  return {
    coins,
    food,
    stock,
    ready,
    offlineEarnings,
    hungriest,
    unlocked,
    speciesBySlug,
    foodCost: FOOD_COST,
    init,
    tick,
    collect,
    buyFood,
    feed,
    unlock,
    persist,
    reset,
  }
})
