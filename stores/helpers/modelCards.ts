// /stores/helpers/modelCards.ts
import type { BuilderCard } from '@/stores/helpers/builderCards'
import { ADVENTURE_CARDS } from '@/stores/helpers/adventureCards'
import { ART_CARDS } from '@/stores/helpers/artCards'
import { BOT_CARDS } from '@/stores/helpers/botCards'
import { DREAM_CARDS } from '@/stores/helpers/dreamCards'
import { LAB_CARDS } from '@/stores/helpers/labCards'
import { NAV_CARDS } from '@/stores/helpers/navCards'
import { PITCH_CARDS } from '@/stores/helpers/pitchCards'
import { REWARD_CARDS } from '@/stores/helpers/rewardCards'
import { SCENARIO_CARDS } from '@/stores/helpers/scenarioCards'

export type BuilderCardsKey =
  | 'adventureCards'
  | 'artCards'
  | 'botCards'
  | 'dreamCards'
  | 'labCards'
  | 'navCards'
  | 'pitchCards'
  | 'rewardCards'
  | 'scenarioCards'
  | 'userCards'

export const modelCards: Partial<Record<BuilderCardsKey, BuilderCard[]>> = {
  adventureCards: ADVENTURE_CARDS,
  artCards: ART_CARDS,
  botCards: BOT_CARDS,
  dreamCards: DREAM_CARDS,
  labCards: LAB_CARDS,
  navCards: NAV_CARDS,
  pitchCards: PITCH_CARDS,
  rewardCards: REWARD_CARDS,
  scenarioCards: SCENARIO_CARDS,
}

export function isBuilderCardsKey(value: string): value is BuilderCardsKey {
  return value in modelCards || value === 'userCards'
}

export function getModelCards(value?: string | null): BuilderCard[] {
  const key = (value ?? '').trim()

  if (!key || !isBuilderCardsKey(key)) return []

  return modelCards[key as BuilderCardsKey] ?? []
}
