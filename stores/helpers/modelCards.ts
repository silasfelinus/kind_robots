// /stores/helpers/modelCards.ts
import type { BuilderCard } from '@/stores/helpers/builderCards'

export type BuilderCardsKey =
  | 'adventureCards'
  | 'artCards'
  | 'botCards'
  | 'conductorCards'
  | 'dreamCards'
  | 'labCards'
  | 'navCards'
  | 'rewardCards'
  | 'scenarioCards'
  | 'userCards'

type LoadableBuilderCardsKey = Exclude<BuilderCardsKey, 'userCards'>

const BUILDER_CARD_KEYS = new Set<BuilderCardsKey>([
  'adventureCards',
  'artCards',
  'botCards',
  'conductorCards',
  'dreamCards',
  'labCards',
  'navCards',
  'rewardCards',
  'scenarioCards',
  'userCards',
])

export const modelCards: Partial<Record<BuilderCardsKey, BuilderCard[]>> = {}

const pendingLoads: Partial<
  Record<LoadableBuilderCardsKey, Promise<BuilderCard[]>>
> = {}

const cardLoaders: Record<
  LoadableBuilderCardsKey,
  () => Promise<BuilderCard[]>
> = {
  adventureCards: async () =>
    (await import('@/stores/helpers/adventureCards')).ADVENTURE_CARDS,
  artCards: async () => (await import('@/stores/helpers/artCards')).ART_CARDS,
  botCards: async () => (await import('@/stores/helpers/botCards')).BOT_CARDS,
  conductorCards: async () =>
    (await import('@/stores/helpers/conductorCards')).CONDUCTOR_CARDS,
  dreamCards: async () =>
    (await import('@/stores/helpers/dreamCards')).DREAM_CARDS,
  labCards: async () => (await import('@/stores/helpers/labCards')).LAB_CARDS,
  navCards: async () => (await import('@/stores/helpers/navCards')).NAV_CARDS,
  rewardCards: async () =>
    (await import('@/stores/helpers/rewardCards')).REWARD_CARDS,
  scenarioCards: async () =>
    (await import('@/stores/helpers/scenarioCards')).SCENARIO_CARDS,
}

export function isBuilderCardsKey(value: string): value is BuilderCardsKey {
  return BUILDER_CARD_KEYS.has(value as BuilderCardsKey)
}

function normalizeCardsKey(value?: string | null): BuilderCardsKey | null {
  const key = (value ?? '').trim()
  return key && isBuilderCardsKey(key) ? key : null
}

export function getModelCards(value?: string | null): BuilderCard[] {
  const key = normalizeCardsKey(value)
  return key ? modelCards[key] ?? [] : []
}

export async function preloadModelCards(
  value?: string | null,
): Promise<BuilderCard[]> {
  const key = normalizeCardsKey(value)
  if (!key || key === 'userCards') return []

  const cached = modelCards[key]
  if (cached) return cached

  const pending = pendingLoads[key]
  if (pending) return pending

  const load = cardLoaders[key]().then((cards) => {
    modelCards[key] = cards
    delete pendingLoads[key]
    return cards
  })

  pendingLoads[key] = load

  try {
    return await load
  } catch (error) {
    delete pendingLoads[key]
    throw error
  }
}
