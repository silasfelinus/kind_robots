// /stores/generatorStore.ts
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { Rarity, RewardType } from '~/prisma/generated/prisma/client'
import { performFetch } from '@/stores/utils'
import { useFacetCatalogStore } from '@/stores/facetCatalogStore'
import {
  FACET_EMERGENCY_FALLBACKS,
  type FacetEmergencyField,
} from '@/utils/facetEmergencyFallbacks'

export type RolledReward = {
  id: string
  rewardId: number
  name: string
  description?: string | null
  flavorText?: string | null
  effect?: string | null
  icon?: string | null
  imagePath?: string | null
  rarity: Rarity
  rewardType: RewardType
  payload?: Record<string, unknown>
}

type RewardRecord = {
  id: number
  name?: string | null
  slug?: string | null
  description?: string | null
  flavorText?: string | null
  effect?: string | null
  icon?: string | null
  collection?: string | null
  imagePath?: string | null
  artPrompt?: string | null
  rarity?: Rarity | null
  rewardType?: RewardType | null
  payload?: Record<string, unknown> | null
  label?: string | null
  title?: string | null
  text?: string | null
  power?: string | null
  image?: string | null
}

type RollRewardOptionsInput = {
  baseRarity?: Rarity
  count?: number
  rewardTypes?: RewardType[]
}

type GeneratorListKey =
  | 'givenName'
  | 'name'
  | 'honorific'
  | 'genre'
  | 'species'
  | 'characterClass'
  | 'class'
  | 'alignment'
  | 'genderIdentity'
  | 'gender'
  | 'personality'
  | 'quirks'
  | 'background'
  | 'backstory'
  | 'art'
  | 'artPrompt'

type RarityRollOption = {
  rarity: Rarity
  weight: number
}

// Names and honorifics are procedural language lexicons, not reusable creative
// concepts. They intentionally remain local rather than becoming Facets.
const GIVEN_NAMES = [
  'Mira',
  'Buttonwick',
  'Zora',
  'Juniper',
  'Cassian',
  'Nim',
  'Vex',
  'Tamsin',
  'Orlo',
  'Pip',
  'Ludo',
  'Maribel',
  'Quill',
  'Rook',
  'Sable',
  'Thimble',
  'Vesper',
  'Wren',
  'Yara',
  'Zig',
  'Moss',
  'Clover',
  'Fern',
  'Gadget',
  'Hex',
  'Ivy',
  'Juno',
  'Kestrel',
  'Lark',
  'Marlow',
] as const

const FAMILY_NAMES = [
  'Voss',
  'Underbridge',
  'Moonspoon',
  'Gearwhistle',
  'Holloway',
  'Softstep',
  'Ashburrow',
  'Copperpot',
  'Nightjar',
  'Velvet',
  'Grimble',
  'Fallow',
  'Widdershins',
  'Starling',
  'Bramblehook',
  'Oddwick',
  'Glasswater',
  'Mothweather',
  'Tanglebone',
  'Foxglove',
] as const

const HONORIFICS = [
  'adventurer',
  'the inconvenient',
  'formerly respectable',
  'certified menace',
  'the mildly foretold',
  'holder of several opinions',
  'technically innocent',
  'the suspiciously prepared',
  'licensed in three municipalities',
  'the one with the bag',
  'public nuisance',
  'reluctant protagonist',
  'keeper of the tiny ledger',
  'the recently noticed',
  'bearer of confusing credentials',
  'the mostly harmless',
] as const

const UPGRADE_TABLE: Record<Rarity, RarityRollOption[]> = {
  COMMON: [
    { rarity: 'COMMON', weight: 72 },
    { rarity: 'UNCOMMON', weight: 20 },
    { rarity: 'RARE', weight: 7 },
    { rarity: 'EPIC', weight: 1 },
    { rarity: 'LEGENDARY', weight: 0 },
    { rarity: 'MYTHIC', weight: 0 },
  ],
  UNCOMMON: [
    { rarity: 'UNCOMMON', weight: 68 },
    { rarity: 'RARE', weight: 22 },
    { rarity: 'EPIC', weight: 8 },
    { rarity: 'LEGENDARY', weight: 2 },
    { rarity: 'COMMON', weight: 0 },
    { rarity: 'MYTHIC', weight: 0 },
  ],
  RARE: [
    { rarity: 'RARE', weight: 65 },
    { rarity: 'EPIC', weight: 24 },
    { rarity: 'LEGENDARY', weight: 9 },
    { rarity: 'MYTHIC', weight: 2 },
    { rarity: 'COMMON', weight: 0 },
    { rarity: 'UNCOMMON', weight: 0 },
  ],
  EPIC: [
    { rarity: 'EPIC', weight: 80 },
    { rarity: 'LEGENDARY', weight: 16 },
    { rarity: 'MYTHIC', weight: 4 },
    { rarity: 'COMMON', weight: 0 },
    { rarity: 'UNCOMMON', weight: 0 },
    { rarity: 'RARE', weight: 0 },
  ],
  LEGENDARY: [
    { rarity: 'LEGENDARY', weight: 85 },
    { rarity: 'MYTHIC', weight: 15 },
    { rarity: 'COMMON', weight: 0 },
    { rarity: 'UNCOMMON', weight: 0 },
    { rarity: 'RARE', weight: 0 },
    { rarity: 'EPIC', weight: 0 },
  ],
  MYTHIC: [
    { rarity: 'MYTHIC', weight: 100 },
    { rarity: 'COMMON', weight: 0 },
    { rarity: 'UNCOMMON', weight: 0 },
    { rarity: 'RARE', weight: 0 },
    { rarity: 'EPIC', weight: 0 },
    { rarity: 'LEGENDARY', weight: 0 },
  ],
}

function pickRandom<T>(items: readonly T[]): T | null {
  if (!items.length) return null
  return items[Math.floor(Math.random() * items.length)] ?? null
}

function pickMany<T>(items: readonly T[], count: number): T[] {
  return [...items].sort(() => Math.random() - 0.5).slice(0, count)
}

function weightedRoll<T extends { weight: number }>(options: T[]): T {
  const viable = options.filter((option) => option.weight > 0)
  const total = viable.reduce((sum, option) => sum + option.weight, 0)

  if (!viable.length || total <= 0) return options[0] as T

  let roll = Math.random() * total
  for (const option of viable) {
    roll -= option.weight
    if (roll <= 0) return option
  }

  return viable[viable.length - 1] as T
}

function normalizeReward(reward: RewardRecord): RolledReward | null {
  const name = String(reward.name || reward.title || reward.text || '').trim()
  const description = String(
    reward.description || reward.text || reward.flavorText || '',
  ).trim()
  const effect = String(reward.effect || reward.power || '').trim()

  if (!reward.id || !name || !reward.rewardType) return null

  return {
    id: String(reward.id),
    rewardId: reward.id,
    name,
    description,
    flavorText: reward.flavorText ?? null,
    effect: effect || null,
    icon: reward.icon ?? null,
    imagePath: reward.imagePath ?? reward.image ?? null,
    rarity: reward.rarity ?? 'COMMON',
    rewardType: reward.rewardType,
    payload: reward.payload ?? {},
  }
}

export const useGeneratorStore = defineStore('generatorStore', () => {
  const facetCatalog = useFacetCatalogStore()
  const rewardPool = ref<RolledReward[]>([])
  const rewardLoading = ref(false)
  const rewardError = ref('')

  const rewardsLoaded = computed(() => rewardPool.value.length > 0)

  function emergencyValue(field: FacetEmergencyField): string {
    return pickRandom(FACET_EMERGENCY_FALLBACKS[field]) ?? ''
  }

  function emergencyValues(field: FacetEmergencyField, count: number): string {
    return pickMany(FACET_EMERGENCY_FALLBACKS[field], Math.max(1, count)).join(
      ', ',
    )
  }

  function facetValue(
    fieldKey: string,
    emergencyField: FacetEmergencyField,
  ): string {
    const entry = facetCatalog.randomFacetForField(fieldKey)
    return entry?.canonicalValue || entry?.title || emergencyValue(emergencyField)
  }

  function facetValues(
    fieldKey: string,
    count: number,
    emergencyField: FacetEmergencyField,
  ): string {
    const pool = facetCatalog
      .facetsForCharacterField(fieldKey)
      .filter((entry) => entry.isRandomizable && entry.randomWeight > 0)

    if (!pool.length) return emergencyValues(emergencyField, count)

    const remaining = [...pool]
    const picked: typeof pool = []
    const target = Math.max(1, count)

    while (remaining.length && picked.length < target) {
      const total = remaining.reduce(
        (sum, entry) => sum + entry.randomWeight,
        0,
      )
      let roll = Math.random() * total
      let selectedIndex = remaining.length - 1

      for (const [index, entry] of remaining.entries()) {
        roll -= entry.randomWeight
        if (roll <= 0) {
          selectedIndex = index
          break
        }
      }

      const [selected] = remaining.splice(selectedIndex, 1)
      if (selected) picked.push(selected)
    }

    return picked
      .map((entry) => entry.canonicalValue || entry.title)
      .join(', ')
  }

  async function fetchRewards(force = false): Promise<void> {
    if (rewardLoading.value) return
    if (rewardsLoaded.value && !force) return

    rewardLoading.value = true
    rewardError.value = ''

    try {
      const response = await performFetch<RewardRecord[]>('/api/rewards')
      if (!response.success) {
        rewardError.value = response.message || 'Could not load rewards.'
        return
      }

      const rawRewards: RewardRecord[] = Array.isArray(response.data)
        ? response.data
        : []
      rewardPool.value = rawRewards
        .map((reward) => normalizeReward(reward))
        .filter((reward): reward is RolledReward => Boolean(reward))
    } catch (error) {
      rewardError.value =
        error instanceof Error ? error.message : 'Could not load rewards.'
    } finally {
      rewardLoading.value = false
    }
  }

  function rarityUpgrade(baseRarity: Rarity = 'COMMON'): Rarity {
    return weightedRoll(UPGRADE_TABLE[baseRarity] ?? UPGRADE_TABLE.COMMON)
      .rarity
  }

  function rollRewardOptions(
    input: RollRewardOptionsInput | Rarity = {},
    legacyCount?: number,
  ): RolledReward[] {
    const options: RollRewardOptionsInput =
      typeof input === 'string'
        ? { baseRarity: input, count: legacyCount }
        : input
    const baseRarity = options.baseRarity ?? 'COMMON'
    const count = options.count ?? 6
    const rewardTypes = options.rewardTypes ?? []
    const results: RolledReward[] = []
    const usedIds = new Set<string>()
    let attempts = 0

    while (results.length < count && attempts < count * 30) {
      attempts++
      const rarity = rarityUpgrade(baseRarity)
      const candidates = rewardPool.value.filter((reward) => {
        if (reward.rarity !== rarity) return false
        if (rewardTypes.length && !rewardTypes.includes(reward.rewardType)) {
          return false
        }
        return !usedIds.has(reward.id)
      })
      const pick = pickRandom(candidates)
      if (!pick) continue
      usedIds.add(pick.id)
      results.push(pick)
    }

    if (results.length >= count) return results

    const fallbackCandidates = rewardPool.value.filter((reward) => {
      if (rewardTypes.length && !rewardTypes.includes(reward.rewardType)) {
        return false
      }
      return !usedIds.has(reward.id)
    })

    for (const reward of pickMany(fallbackCandidates, count - results.length)) {
      usedIds.add(reward.id)
      results.push(reward)
    }

    return results
  }

  function givenName(): string {
    const first = pickRandom(GIVEN_NAMES) ?? 'Mira'
    const last = pickRandom(FAMILY_NAMES) ?? 'Voss'
    return `${first} ${last}`
  }

  function honorific(): string {
    return pickRandom(HONORIFICS) ?? 'adventurer'
  }

  function genre(): string {
    return facetValue('genre', 'genre')
  }

  function species(): string {
    return facetValue('species', 'species')
  }

  function characterClass(): string {
    return facetValue('class', 'class')
  }

  function alignment(): string {
    return facetValue('alignment', 'alignment')
  }

  function genderIdentity(): string {
    return facetValue('gender', 'gender')
  }

  function personality(count = 3): string {
    return facetValues('personality', count, 'personality')
  }

  function quirks(count = 1): string {
    return facetValues('quirks', count, 'quirks')
  }

  function background(): string {
    return facetValue('backstory', 'backstory')
  }

  function backstory(): string {
    return facetValue('backstory', 'backstory')
  }

  function artPrompt(context: Record<string, unknown> = {}): string {
    const name = String(context.name || givenName())
    const selectedSpecies = String(context.species || species())
    const selectedClass = String(context.class || characterClass())
    const selectedGenre = String(context.genre || genre())
    const selectedPersonality = String(context.personality || personality(2))
    const selectedQuirks = String(context.quirks || quirks())

    return [
      `${name}, a ${selectedSpecies} ${selectedClass}`,
      `genre: ${selectedGenre}`,
      `personality: ${selectedPersonality}`,
      `quirks: ${selectedQuirks}`,
      'expressive character portrait',
      'dramatic readable silhouette',
      'rich fantasy editorial lighting',
      'high-detail illustration',
    ].join(', ')
  }

  function suggest(key: string, context: Record<string, unknown> = {}): string {
    if (key === 'givenName' || key === 'name') return givenName()
    if (key === 'honorific') return honorific()
    if (key === 'genre') return genre()
    if (key === 'species') return species()
    if (key === 'characterClass' || key === 'class') return characterClass()
    if (key === 'alignment') return alignment()
    if (key === 'genderIdentity' || key === 'gender') return genderIdentity()
    if (key === 'personality') return personality()
    if (key === 'quirks') return quirks()
    if (key === 'background' || key === 'backstory') return backstory()
    if (key === 'art' || key === 'artPrompt') return artPrompt(context)
    return ''
  }

  function generateName(): string {
    return givenName()
  }

  function generateAlignment(): string {
    return alignment()
  }

  function generateOne(
    key: GeneratorListKey | string,
    fallbackOrContext: string | Record<string, unknown> = {},
  ): string {
    const fallback =
      typeof fallbackOrContext === 'string' ? fallbackOrContext : ''
    const context =
      fallbackOrContext && typeof fallbackOrContext === 'object'
        ? fallbackOrContext
        : {}
    const generated = suggest(key, context).trim()
    return generated || fallback
  }

  return {
    rewardPool,
    rewardLoading,
    rewardError,
    rewardsLoaded,
    fetchRewards,
    rarityUpgrade,
    rollRewardOptions,
    givenName,
    honorific,
    genre,
    species,
    characterClass,
    alignment,
    genderIdentity,
    personality,
    quirks,
    background,
    backstory,
    artPrompt,
    suggest,
    generateName,
    generateAlignment,
    generateOne,
  }
})
