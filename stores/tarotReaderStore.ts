// /stores/tarotReaderStore.ts
//
// Public tarot reader (/play/tarot): automatic daily readings from the Kind
// Oracle engine, birth profiles with natal charts and daily transits. All
// reading and chart work is pure client-side code. Progress (birth profiles,
// settings, studied cards, deck) lives in browser storage and, for signed-in
// players with account sync on, in their account via /api/tarot/account-save.
import { computed, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { performFetch } from '~/stores/utils'
import { useUserStore } from '~/stores/userStore'
import {
  DEFAULT_TAROT_SETTINGS,
  REVEAL_DELAY_MS,
  emptyTarotSave,
  isBirthProfile,
  newerTarotSave,
  parseTarotAccountSave,
  sanitizeSettings,
  type BirthProfile,
  type TarotAccountSave,
  type TarotSettings,
} from '~/utils/tarot/accountSave'
import { useAchievementStore } from '~/stores/achievementStore'
import { useCollectibleStore, type OpenedCard } from '~/stores/collectibleStore'
import { useTarotSoundStore } from '~/stores/tarotSoundStore'
import { buildReading } from '~/utils/oracle/reading'
import { newSeed } from '~/utils/oracle/rng'
import { ORACLE_CARD_BY_ID, ORACLE_CONTENT } from '~/utils/oracle/content'
import type {
  OracleCard,
  OracleReading,
  OracleSpreadId,
} from '~/utils/oracle/types'
import { TAROT_CATALOG } from '~/utils/tarotStudio'
import {
  computeNatalChart,
  computeTransits,
  moonIngresses,
  type NatalChart,
} from '~/utils/astrology/chart'
import {
  birthMomentToUtc,
  isValidTimeZone,
  localDateKey,
} from '~/utils/astrology/time'
import { signAt } from '~/utils/astrology/zodiac'

export type TarotReaderCard = {
  key: string
  title: string
  oracleId: string
  imageUrl: string | null
}

export type TarotReaderDeck = {
  slug: string
  title: string
  description: string
  backUrl: string | null
  cards: TarotReaderCard[]
}

export type AutoReadingId = 'daily' | 'path' | 'heart'

export type AutoReading = {
  id: AutoReadingId
  title: string
  subtitle: string
  spread: OracleSpreadId
  reading: OracleReading
}

const PROFILES_KEY = 'kr.tarot.profiles'
const SETTINGS_KEY = 'kr.tarot.settings'
const PROGRESS_KEY = 'kr.tarot.progress'
export const TAROT_COLLECTION = 'tarot'

const SAVED_AT_KEY = 'kr.tarot.savedAt'
const ACCOUNT_PUSH_DELAY_MS = 1500
const ACTIVE_PROFILE_KEY = 'kr.tarot.activeProfile'
const DECK_KEY = 'kr.tarot.deck'

const AUTO_READINGS: Array<Omit<AutoReading, 'reading'>> = [
  {
    id: 'daily',
    title: "Today's Companion",
    subtitle: 'One card for the day',
    spread: 'one',
  },
  {
    id: 'path',
    title: 'The Path',
    subtitle: 'Where you have been, are, and are going',
    spread: 'three',
  },
  {
    id: 'heart',
    title: 'The Heart of It',
    subtitle: 'A fuller five-card look',
    spread: 'five',
  },
]

export const FALLBACK_TAROT_DECK: TarotReaderDeck = {
  slug: 'kind-robots',
  title: 'Kind Robots Tarot',
  description: 'The Kind Oracle: 78 cards of kindness and ingenuity.',
  backUrl: null,
  cards: TAROT_CATALOG.map((card) => ({
    key: card.key,
    title: card.oracleTitle,
    oracleId: card.oracleId,
    imageUrl: null,
  })),
}

function readStorage<T>(key: string, fallback: T): T {
  try {
    if (typeof window === 'undefined') return fallback
    const raw = window.localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function writeStorage(key: string, value: unknown) {
  try {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Convenience storage only; the reader works without it.
  }
}

export const useTarotReaderStore = defineStore('tarotReader', () => {
  const decks = ref<TarotReaderDeck[]>([FALLBACK_TAROT_DECK])
  const activeDeckSlug = ref(FALLBACK_TAROT_DECK.slug)
  const profiles = ref<BirthProfile[]>([])
  const activeProfileId = ref<string | null>(null)
  const ready = ref(false)
  const loadingDecks = ref(false)
  const now = ref<Date>(new Date(0))
  const seeds = ref<Record<AutoReadingId, string>>({
    daily: '',
    path: '',
    heart: '',
  })
  const activeReadingId = ref<AutoReadingId>('daily')
  const error = ref('')
  const settings = ref<TarotSettings>({ ...DEFAULT_TAROT_SETTINGS })
  const majorsStudied = ref<string[]>([])
  const achievementStore = useAchievementStore()
  const collectibleStore = useCollectibleStore()
  const sound = useTarotSoundStore()
  const userStore = useUserStore()
  const savedAt = ref(new Date(0).toISOString())
  const accountRevision = ref<number | null>(null)
  const accountKnown = ref(false)
  const accountStatus = ref<'off' | 'idle' | 'syncing' | 'synced' | 'error'>(
    'off',
  )
  let pushTimer: ReturnType<typeof setTimeout> | null = null

  const collection = computed(() => collectibleStore.set(TAROT_COLLECTION))
  const selectedBackUrl = computed(() => {
    const key = collection.value.player?.selectedBack
    return key ? (collection.value.catalog?.art[key] ?? null) : null
  })
  const tableBackUrl = computed(
    () => selectedBackUrl.value ?? activeDeck.value.backUrl,
  )
  const revealDelay = computed(() =>
    settings.value.reducedMotion
      ? 0
      : REVEAL_DELAY_MS[settings.value.revealSpeed],
  )

  const activeDeck = computed(
    () =>
      decks.value.find((deck) => deck.slug === activeDeckSlug.value) ??
      decks.value[0] ??
      FALLBACK_TAROT_DECK,
  )

  const deckCards = computed<OracleCard[]>(() =>
    activeDeck.value.cards
      .map((card) => {
        const base = ORACLE_CARD_BY_ID[card.oracleId]
        return base ? { ...base, title: card.title } : null
      })
      .filter((card): card is OracleCard => Boolean(card)),
  )

  const cardByOracleId = computed(() =>
    Object.fromEntries(
      activeDeck.value.cards.map((card) => [card.oracleId, card]),
    ),
  )

  const cardByKey = computed(() =>
    Object.fromEntries(activeDeck.value.cards.map((card) => [card.key, card])),
  )

  const activeProfile = computed(
    () =>
      profiles.value.find((profile) => profile.id === activeProfileId.value) ??
      null,
  )

  const todayKey = computed(() => (ready.value ? localDateKey(now.value) : ''))

  function dailySeed(id: AutoReadingId) {
    return `${todayKey.value}:${activeProfile.value?.id ?? 'guest'}:${id}`
  }

  const readings = computed<AutoReading[]>(() => {
    if (!ready.value || deckCards.value.length < 5) return []
    return AUTO_READINGS.map((entry) => ({
      ...entry,
      reading: buildReading(
        deckCards.value,
        ORACLE_CONTENT,
        entry.spread,
        seeds.value[entry.id] || dailySeed(entry.id),
      ),
    }))
  })

  const activeReading = computed(
    () =>
      readings.value.find((entry) => entry.id === activeReadingId.value) ??
      readings.value[0] ??
      null,
  )

  const natalChart = computed<NatalChart | null>(() => {
    const profile = activeProfile.value
    if (!ready.value || !profile) return null
    const instant = birthMomentToUtc({
      date: profile.date,
      time: profile.time,
      timeZone: profile.timeZone,
    })
    if (!instant) return null
    return computeNatalChart(
      instant,
      { latitude: profile.latitude, longitude: profile.longitude },
      Boolean(profile.time),
    )
  })

  const transits = computed(() => {
    if (!ready.value || !natalChart.value) return null
    return computeTransits(natalChart.value, now.value)
  })

  const moonWeek = computed(() =>
    ready.value ? moonIngresses(now.value, 7) : [],
  )

  const moonCardKey = computed(() => {
    const moon = transits.value?.sky.find((point) => point.id === 'moon')
    return moon ? signAt(moon.longitude).tarotKey : null
  })

  function snapshot(): TarotAccountSave {
    return {
      version: 1,
      savedAt: savedAt.value,
      profiles: profiles.value,
      activeProfileId: activeProfileId.value,
      settings: settings.value,
      majorsStudied: majorsStudied.value,
      deck: activeDeckSlug.value,
    }
  }

  function writeLocal() {
    writeStorage(PROFILES_KEY, profiles.value)
    writeStorage(ACTIVE_PROFILE_KEY, activeProfileId.value)
    writeStorage(SETTINGS_KEY, settings.value)
    touch()
    writeStorage(DECK_KEY, activeDeckSlug.value)
    writeStorage(SAVED_AT_KEY, savedAt.value)
  }

  function applySave(save: TarotAccountSave) {
    profiles.value = save.profiles
    activeProfileId.value = save.activeProfileId
    settings.value = save.settings
    majorsStudied.value = save.majorsStudied
    if (save.deck) activeDeckSlug.value = save.deck
    savedAt.value = save.savedAt
    writeLocal()
    sound.apply(settings.value)
  }

  function syncEnabled() {
    return userStore.isLoggedIn && settings.value.accountSync
  }

  /** Stamp a change, keep it locally, and queue it for the account. */
  function touch() {
    savedAt.value = new Date().toISOString()
    writeLocal()
    if (!syncEnabled() || typeof window === 'undefined') return
    if (pushTimer) clearTimeout(pushTimer)
    pushTimer = setTimeout(() => void pushAccount(), ACCOUNT_PUSH_DELAY_MS)
  }

  function persistProfiles() {
    touch()
  }

  async function pushAccount(retry = true): Promise<boolean> {
    if (!syncEnabled()) return false
    if (!accountKnown.value) return pullAccount()
    accountStatus.value = 'syncing'
    const response = await performFetch<{ revision: number }>(
      '/api/tarot/account-save',
      {
        method: 'PUT',
        body: JSON.stringify({
          save: snapshot(),
          expectedRevision: accountRevision.value,
        }),
      },
    )
    if (response.success && typeof response.data?.revision === 'number') {
      accountRevision.value = response.data.revision
      accountStatus.value = 'synced'
      return true
    }
    if (response.status === 409 && retry) {
      accountKnown.value = false
      return pullAccount()
    }
    accountStatus.value = 'error'
    return false
  }

  function readRemoteSave(value: unknown): TarotAccountSave | null {
    if (!value) return null
    try {
      return parseTarotAccountSave(value)
    } catch {
      return null
    }
  }

  /** Read the account copy, keep whichever side changed last, sync the other. */
  async function pullAccount(): Promise<boolean> {
    if (!syncEnabled()) {
      accountStatus.value = 'off'
      return false
    }
    accountStatus.value = 'syncing'
    const response = await performFetch<{
      save: unknown
      revision: number | null
    }>('/api/tarot/account-save', { cache: 'no-store' })
    if (!response.success || !response.data) {
      accountStatus.value = 'error'
      return false
    }
    accountKnown.value = true
    accountRevision.value = response.data.revision ?? null
    const remote = readRemoteSave(response.data.save)
    const local = snapshot()
    if (remote && newerTarotSave(local, remote) === remote) {
      applySave(remote)
      accountStatus.value = 'synced'
      return true
    }
    if (remote && remote.savedAt === local.savedAt) {
      accountStatus.value = 'synced'
      return true
    }
    if (!remote && !local.profiles.length && !local.majorsStudied.length) {
      accountStatus.value = 'synced'
      return true
    }
    return pushAccount(false)
  }

  async function setAccountSync(enabled: boolean) {
    updateSettings({ accountSync: enabled })
    if (enabled) {
      accountKnown.value = false
      return pullAccount()
    }
    accountStatus.value = 'off'
    if (!userStore.isLoggedIn) return true
    const response = await performFetch<{ removed: number }>(
      '/api/tarot/account-save',
      { method: 'DELETE' },
    )
    accountRevision.value = null
    accountKnown.value = false
    return response.success
  }

  function init() {
    if (ready.value) return
    now.value = new Date()
    const stored = readStorage<unknown[]>(PROFILES_KEY, [])
    profiles.value = Array.isArray(stored) ? stored.filter(isBirthProfile) : []
    const storedActive = readStorage<string | null>(ACTIVE_PROFILE_KEY, null)
    activeProfileId.value = profiles.value.some(
      (profile) => profile.id === storedActive,
    )
      ? storedActive
      : (profiles.value[0]?.id ?? null)
    const storedDeck = readStorage<string | null>(DECK_KEY, null)
    if (storedDeck) activeDeckSlug.value = storedDeck
    settings.value = sanitizeSettings(readStorage(SETTINGS_KEY, {}))
    const progress = readStorage<{ majorsStudied?: unknown }>(PROGRESS_KEY, {})
    majorsStudied.value = Array.isArray(progress.majorsStudied)
      ? progress.majorsStudied.filter(
          (key): key is string => typeof key === 'string',
        )
      : []
    const stamp = readStorage<string | null>(SAVED_AT_KEY, null)
    savedAt.value =
      stamp && !Number.isNaN(Date.parse(stamp))
        ? stamp
        : new Date(0).toISOString()
    sound.apply(settings.value)
    ready.value = true
    void pullAccount()
  }

  watch(
    () => userStore.isLoggedIn,
    (loggedIn) => {
      accountKnown.value = false
      accountRevision.value = null
      if (loggedIn && ready.value) void pullAccount()
      else accountStatus.value = 'off'
    },
  )

  function updateSettings(patch: Partial<TarotSettings>) {
    settings.value = sanitizeSettings({ ...settings.value, ...patch })
    sound.unlock()
    sound.apply(settings.value)
    touch()
  }

  function resetProgress() {
    const empty = emptyTarotSave()
    profiles.value = empty.profiles
    activeProfileId.value = null
    majorsStudied.value = []
    settings.value = {
      ...DEFAULT_TAROT_SETTINGS,
      accountSync: settings.value.accountSync,
    }
    seeds.value = { daily: '', path: '', heart: '' }
    sound.apply(settings.value)
    touch()
  }

  function award(code: string) {
    void achievementStore.rewardAchievementByCode(code)
  }

  function task(key: string) {
    void collectibleStore.completeTask(TAROT_COLLECTION, key)
  }

  function playSfx(name: Parameters<typeof sound.play>[0]) {
    sound.unlock()
    sound.play(name)
  }

  function noteReadingViewed(id: AutoReadingId) {
    playSfx('flip')
    if (id !== 'daily') award('tarot-studio-first-spread')
    task('reading')
  }

  function noteChartViewed() {
    task('chart')
  }

  function noteCardStudied(key: string) {
    if (!/^major-\d+$/.test(key) || majorsStudied.value.includes(key)) return
    majorsStudied.value = [...majorsStudied.value, key]
    writeStorage(PROGRESS_KEY, { majorsStudied: majorsStudied.value })
    if (majorsStudied.value.length >= 22) award('tarot-studio-deck-scholar')
  }

  function noteClaimed(streak: number) {
    playSfx('claim')
    award('tarot-studio-daily-ritual')
    if (streak >= 7) award('tarot-studio-week-of-moons')
  }

  function notePackOpened(cards: OpenedCard[]) {
    playSfx('pack')
    award('tarot-studio-first-pack')
    if (cards.some((card) => card.rarity === 'legendary')) {
      award('tarot-studio-legend-pulled')
    }
    const owned = Object.keys(collection.value.player?.owned ?? {}).length
    if (owned >= 50) award('tarot-studio-halfway-there')
    if (owned >= 100) award('tarot-studio-grand-orrery')
  }

  function noteBacksUnlocked() {
    playSfx('unlock')
  }

  function noteChatSent() {
    playSfx('send')
    award('tarot-studio-kind-words')
    task('chat')
  }

  function refreshClock() {
    now.value = new Date()
  }

  async function loadDecks(): Promise<boolean> {
    if (loadingDecks.value) return false
    loadingDecks.value = true
    try {
      const response =
        await performFetch<TarotReaderDeck[]>('/api/tarot/reader')
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Could not load decks.')
      }
      const usable = response.data.filter((deck) => deck.cards.length >= 22)
      if (usable.length) decks.value = usable
      if (!decks.value.some((deck) => deck.slug === activeDeckSlug.value)) {
        activeDeckSlug.value = decks.value[0]?.slug ?? FALLBACK_TAROT_DECK.slug
      }
      return true
    } catch (caught) {
      error.value =
        caught instanceof Error ? caught.message : 'Could not load decks.'
      return false
    } finally {
      loadingDecks.value = false
    }
  }

  function selectDeck(slug: string) {
    if (!decks.value.some((deck) => deck.slug === slug)) return
    activeDeckSlug.value = slug
    touch()
  }

  function selectReading(id: AutoReadingId) {
    activeReadingId.value = id
  }

  function redraw(id: AutoReadingId) {
    seeds.value = { ...seeds.value, [id]: newSeed() }
    playSfx('shuffle')
    award('tarot-studio-fresh-shuffle')
  }

  function redrawAll() {
    seeds.value = { daily: newSeed(), path: newSeed(), heart: newSeed() }
    playSfx('shuffle')
    award('tarot-studio-fresh-shuffle')
  }

  function resetToDaily() {
    seeds.value = { daily: '', path: '', heart: '' }
  }

  function saveProfile(
    input: Omit<BirthProfile, 'id'> & { id?: string },
  ): string | null {
    error.value = ''
    if (!input.name.trim()) {
      error.value = 'Add a name for this chart.'
      return null
    }
    if (!isValidTimeZone(input.timeZone)) {
      error.value = 'Choose a birthplace or a valid time zone.'
      return null
    }
    if (
      !Number.isFinite(input.latitude) ||
      Math.abs(input.latitude) > 90 ||
      !Number.isFinite(input.longitude) ||
      Math.abs(input.longitude) > 180
    ) {
      error.value = 'Latitude and longitude are out of range.'
      return null
    }
    const instant = birthMomentToUtc({
      date: input.date,
      time: input.time,
      timeZone: input.timeZone,
    })
    if (!instant) {
      error.value = 'Check the birth date and time.'
      return null
    }
    const id = input.id ?? `p-${newSeed()}`
    const profile: BirthProfile = {
      id,
      name: input.name.trim().slice(0, 60),
      date: input.date,
      time: input.time || null,
      cityId: input.cityId,
      latitude: input.latitude,
      longitude: input.longitude,
      timeZone: input.timeZone,
    }
    const index = profiles.value.findIndex((entry) => entry.id === id)
    if (index === -1) profiles.value.push(profile)
    else profiles.value[index] = profile
    activeProfileId.value = id
    resetToDaily()
    persistProfiles()
    award('tarot-studio-star-chart')
    if (profiles.value.length >= 3) award('tarot-studio-family-sky')
    return id
  }

  function selectProfile(id: string | null) {
    activeProfileId.value = profiles.value.some((entry) => entry.id === id)
      ? id
      : null
    resetToDaily()
    persistProfiles()
  }

  function removeProfile(id: string) {
    profiles.value = profiles.value.filter((entry) => entry.id !== id)
    if (activeProfileId.value === id) {
      activeProfileId.value = profiles.value[0]?.id ?? null
    }
    persistProfiles()
  }

  return {
    decks,
    activeDeckSlug,
    activeDeck,
    deckCards,
    cardByOracleId,
    cardByKey,
    profiles,
    activeProfileId,
    activeProfile,
    ready,
    loadingDecks,
    now,
    seeds,
    activeReadingId,
    readings,
    activeReading,
    natalChart,
    transits,
    moonWeek,
    moonCardKey,
    error,
    init,
    refreshClock,
    loadDecks,
    selectDeck,
    selectReading,
    redraw,
    redrawAll,
    resetToDaily,
    saveProfile,
    selectProfile,
    removeProfile,
    settings,
    majorsStudied,
    collection,
    selectedBackUrl,
    tableBackUrl,
    revealDelay,
    updateSettings,
    resetProgress,
    playSfx,
    noteReadingViewed,
    noteChartViewed,
    noteCardStudied,
    noteClaimed,
    notePackOpened,
    noteBacksUnlocked,
    noteChatSent,
    accountStatus,
    setAccountSync,
    pullAccount,
  }
})
