import { useNarratorStore as useBaseNarratorStore } from './narratorStore.original'
import { getBotById } from './helpers/botHelper'

const defaultNarratorBotId = 433
const defaultNarratorSlug = 'ami-butterfly'

type NarratorStore = ReturnType<typeof useBaseNarratorStore>

type HydratableNarratorStore = NarratorStore & {
  hydrateDefaultNarratorBot: () => Promise<void>
  defaultNarratorHydrationPatched?: boolean
}

type HydratableBot = {
  id?: number | null
  slug?: string | null
  ExpressionMedia?: unknown[] | null
  NarratorThreads?: unknown[] | null
}

let hydrationPromise: Promise<void> | null = null

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

function patchNarratorStore(store: NarratorStore): HydratableNarratorStore {
  const patchedStore = store as HydratableNarratorStore

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
