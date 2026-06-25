import { ref, watch } from 'vue'
import { useNarratorStore as useBaseNarratorStore } from './narratorStore.original'
import { getBotById } from './helpers/botHelper'
import { performFetch } from '@/stores/utils'
import { useDreamStore, type DreamWithRelations } from '@/stores/dreamStore'
import {
  usePageStore,
  type PageNarratorKind,
  type PageNarratorRef,
} from '@/stores/pageStore'

const defaultNarratorBotId = 433
const defaultNarratorSlug = 'ami-butterfly'
const syntheticPageDreamId = -433

type NarratorStore = ReturnType<typeof useBaseNarratorStore>

type HydratableNarratorStore = NarratorStore & {
  hydrateDefaultNarratorBot: () => Promise<void>
  defaultNarratorHydrationPatched?: boolean
  pageNarratorHydrationPatched?: boolean
}

type HydratableBot = {
  id?: number | null
  name?: string | null
  slug?: string | null
  BotType?: string | null
  ExpressionMedia?: unknown[] | null
  NarratorThreads?: unknown[] | null
}

type PageNarratorBot = HydratableBot & {
  id: number
  name: string
}

type NormalizedPageNarratorRef = {
  type: PageNarratorKind
  slug: string
}

type NarratorResolverResponse = {
  success: boolean
  message?: string
  data?: PageNarratorBot | null
}

type PageNarratorDream = DreamWithRelations & {
  __pageNarratorDream?: boolean
}

let hydrationPromise: Promise<void> | null = null
let savedDreamBeforePageNarrator: DreamWithRelations | null = null

function readBot(input: unknown): HydratableBot | null {
  if (!input || typeof input !== 'object') return null

  return input as HydratableBot
}

function isDefaultNarrator(input: unknown): boolean {
  const bot = readBot(input)

  return (
    Number(bot?.id) === defaultNarratorBotId ||
    String(bot?.slug || '').toLowerCase() === defaultNarratorSlug
  )
}

function hasExpressionRows(input: unknown): boolean {
  const bot = readBot(input)

  return Array.isArray(bot?.ExpressionMedia) && bot.ExpressionMedia.length > 0
}

function normalizePageNarratorRef(
  value: PageNarratorRef | null | undefined,
): NormalizedPageNarratorRef | null {
  if (typeof value === 'string') {
    const slug = value.trim()
    return slug ? { type: 'bot', slug } : null
  }

  if (!value || typeof value !== 'object') return null

  const slug = String(value.slug || '').trim()
  if (!slug) return null

  return {
    type: value.type === 'character' ? 'character' : 'bot',
    slug,
  }
}

async function fetchPageNarrator(ref: NormalizedPageNarratorRef) {
  const response = (await performFetch<PageNarratorBot>(
    `/api/narrators/${ref.type}/${encodeURIComponent(ref.slug)}`,
  )) as NarratorResolverResponse

  if (response.success && response.data) return response.data

  throw new Error(response.message || `Could not load narrator ${ref.slug}.`)
}

function isSyntheticPageDream(dream?: DreamWithRelations | null): boolean {
  return Boolean(
    dream &&
      dream.id === syntheticPageDreamId &&
      (dream as PageNarratorDream).__pageNarratorDream,
  )
}

function buildPageNarratorDream(
  pageStore: ReturnType<typeof usePageStore>,
  narrator: PageNarratorBot,
): PageNarratorDream {
  const now = new Date()

  return {
    id: syntheticPageDreamId,
    createdAt: now,
    updatedAt: now,
    title: pageStore.title || pageStore.room || 'Kind Robots',
    slug: `page-narrator-${pageStore.lastResolvedPath || 'current'}`,
    dreamType: 'NARRATOR',
    description: pageStore.description || pageStore.summary || null,
    pitch: pageStore.summary || pageStore.description || null,
    flavorText: pageStore.subtitle || null,
    examples: null,
    artPrompt: pageStore.artPrompt || null,
    imagePath: pageStore.image || null,
    highlightImage: null,
    icon: pageStore.icon || 'kind-icon:robot-color',
    designer: 'system',
    creationSource: 'HUMAN',
    userId: 10,
    isPublic: true,
    isMature: false,
    isActive: true,
    artImageId: null,
    artCollectionId: null,
    Bots: [narrator as never],
    Scenarios: [],
    Characters: [],
    Rewards: [],
    ArtImages: [],
    ArtCollections: [],
    Chats: [],
    Reactions: [],
    _count: {},
    __pageNarratorDream: true,
  } as PageNarratorDream
}

function restoreSavedDream(dreamStore: ReturnType<typeof useDreamStore>) {
  if (isSyntheticPageDream(dreamStore.selectedDream)) {
    dreamStore.selectedDream = savedDreamBeforePageNarrator
  }

  savedDreamBeforePageNarrator = null
}

async function hydrateDefaultNarratorBot(store: NarratorStore) {
  const activeNarrator = readBot(store.narratorBot)

  if (!isDefaultNarrator(activeNarrator) || hasExpressionRows(activeNarrator)) return

  if (!hydrationPromise) {
    hydrationPromise = (async () => {
      const defaultNarrator = readBot(await getBotById(defaultNarratorBotId))

      if (!isDefaultNarrator(defaultNarrator) || !hasExpressionRows(defaultNarrator)) return

      Object.assign(activeNarrator, defaultNarrator, {
        ExpressionMedia: Array.isArray(defaultNarrator.ExpressionMedia)
          ? defaultNarrator.ExpressionMedia
          : [],
        NarratorThreads: Array.isArray(defaultNarrator.NarratorThreads)
          ? defaultNarrator.NarratorThreads
          : activeNarrator?.NarratorThreads ?? [],
      })

      store.setEmotion(store.currentEmotion, false)
    })().finally(() => {
      hydrationPromise = null
    })
  }

  await hydrationPromise
}

function patchPageNarratorHydration(store: NarratorStore) {
  const patchedStore = store as HydratableNarratorStore

  if (patchedStore.pageNarratorHydrationPatched) return

  const pageStore = usePageStore()
  const dreamStore = useDreamStore()
  const pageNarratorKey = ref('')

  watch(
    () => pageStore.narrator,
    async (value) => {
      const ref = normalizePageNarratorRef(value)
      const key = ref ? `${ref.type}:${ref.slug}` : ''

      pageNarratorKey.value = key

      if (!ref) {
        restoreSavedDream(dreamStore)
        return
      }

      try {
        const narrator = await fetchPageNarrator(ref)

        if (pageNarratorKey.value !== key) return

        if (!isSyntheticPageDream(dreamStore.selectedDream)) {
          savedDreamBeforePageNarrator = dreamStore.selectedDream
        }

        dreamStore.selectedDream = buildPageNarratorDream(pageStore, narrator)
        store.setEmotion(store.currentEmotion, false)
      } catch (error) {
        if (pageNarratorKey.value !== key) return

        store.setStatus(
          error instanceof Error
            ? error.message
            : `Could not load narrator ${ref.slug}.`,
          'error',
        )
      }
    },
    { immediate: true },
  )

  patchedStore.pageNarratorHydrationPatched = true
}

function patchNarratorStore(store: NarratorStore): HydratableNarratorStore {
  const patchedStore = store as HydratableNarratorStore

  patchPageNarratorHydration(store)

  if (patchedStore.defaultNarratorHydrationPatched) return patchedStore

  const originalInitialize = store.initialize.bind(store)

  patchedStore.hydrateDefaultNarratorBot = () => hydrateDefaultNarratorBot(store)
  patchedStore.initialize = (async (...args: Parameters<typeof store.initialize>) => {
    const result = await originalInitialize(...args)

    await patchedStore.hydrateDefaultNarratorBot()

    return result
  }) as typeof store.initialize
  patchedStore.defaultNarratorHydrationPatched = true

  void patchedStore.hydrateDefaultNarratorBot()

  return patchedStore
}

export const useNarratorStore = (...args: Parameters<typeof useBaseNarratorStore>) => {
  return patchNarratorStore(useBaseNarratorStore(...args))
}
