<!-- /components/adventure/adventure-builder.vue -->
<template>
  <section
    class="flex h-full min-h-0 w-full flex-col gap-3 overflow-hidden rounded-2xl bg-base-200"
  >
    <div
      v-if="saveMessage || saveError"
      class="rounded-2xl border px-4 py-3 text-sm font-semibold"
      :class="
        saveError
          ? 'border-error/30 bg-error/10 text-error'
          : 'border-success/30 bg-success/10 text-success'
      "
    >
      {{ saveError || saveMessage }}
    </div>

    <div class="flex items-center justify-end gap-2">
      <button
        type="button"
        class="btn btn-sm btn-ghost rounded-2xl text-base-content/50 hover:text-error"
        :disabled="isSaving"
        @click="resetAdventureBuilder"
      >
        <Icon name="kind-icon:trash" class="h-4 w-4" />
        Reset
      </button>

      <button
        type="button"
        class="btn btn-sm btn-primary rounded-2xl"
        :disabled="isSaving || !canSave"
        @click="saveCharacter"
      >
        <span v-if="isSaving" class="loading loading-spinner loading-xs" />
        <Icon v-else name="kind-icon:save" class="h-4 w-4" />
        {{ saveLabel }}
      </button>
    </div>

    <builder-manager class="min-h-0 flex-1" />
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useBuilderStore } from '@/stores/builderStore'
import { useGeneratorStore, type RolledReward } from '@/stores/generatorStore'
import { useUserStore } from '@/stores/userStore'
import { handleError, performFetch } from '@/stores/utils'
import type { BuilderRewardOption } from '@/stores/helpers/builderCards'
import type { Rarity } from '@/stores/rewardStore'
import {
  ADVENTURE_CARDS,
  ADVENTURE_SPLASH,
  defaultAdventureSheet,
  defaultAdventureStats,
} from '@/stores/helpers/adventureCards'
import {
  ADVENTURE_CORE_CARD_KEYS,
  adventureRewardToBuilderOption,
  builderOptionToAdventureReward,
  buildAdventureArtPrompt,
  syncAdventureStatTiers,
} from '@/stores/helpers/adventureHelper'

const builderStore = useBuilderStore()
const generatorStore = useGeneratorStore()
const userStore = useUserStore()

const savedCharId = ref<number | null>(null)
const isSaving = ref(false)
const saveMessage = ref('')
const saveError = ref('')

const ADVENTURE_STARTING_SKILL_KEY = 'starting-skill'

const ADVENTURE_REQUIRED_CARD_KEYS = [
  'role',
  'name',
  'origin',
  'identity',
  'personality',
  'stats',
  'background',
  ADVENTURE_STARTING_SKILL_KEY,
]

const ADVENTURE_SKILL_RARITY_WEIGHTS: Array<{
  rarity: Rarity
  weight: number
}> = [
  { rarity: 'COMMON', weight: 40 },
  { rarity: 'UNCOMMON', weight: 25 },
  { rarity: 'RARE', weight: 18 },
  { rarity: 'EPIC', weight: 10 },
  { rarity: 'LEGENDARY', weight: 5 },
  { rarity: 'MYTHIC', weight: 2 },
]

const canSave = computed(() => {
  return (
    Boolean(String(builderStore.sheet.name ?? '').trim()) &&
    builderStore.allComplete
  )
})

const saveLabel = computed(() =>
  isSaving.value
    ? 'Saving...'
    : savedCharId.value
      ? 'Update Character'
      : 'Save Character',
)

function rollAdventureSkillRarity(): Rarity {
  const total = ADVENTURE_SKILL_RARITY_WEIGHTS.reduce(
    (sum, option) => sum + option.weight,
    0,
  )

  let roll = Math.random() * total

  for (const option of ADVENTURE_SKILL_RARITY_WEIGHTS) {
    roll -= option.weight

    if (roll <= 0) {
      return option.rarity
    }
  }

  return 'COMMON'
}

function seedAdventureRewardSlot(slotKey: string): void {
  if (slotKey !== ADVENTURE_STARTING_SKILL_KEY) return
  if (builderStore.rewardOptions[slotKey]?.length) return

  const rarity = rollAdventureSkillRarity()
  const options = generatorStore
    .rollRewardOptions(rarity, 4)
    .map(adventureRewardToBuilderOption)

  builderStore.setRewardOptions(slotKey, options)
}

function seedActiveRewardSlot(): void {
  const slotKey = builderStore.activeCard?.rewardSlotKey

  if (!slotKey) return

  seedAdventureRewardSlot(slotKey)
}

function resetAdventureBuilder(): void {
  savedCharId.value = null
  saveMessage.value = ''
  saveError.value = ''

  builderStore.resetBuilder()
  builderStore.updateSheet({
    userId: userStore.userId || 10,
    rewards: {},
  })

  builderStore.randomCard()
}

function getAdventureRewards(): RolledReward[] {
  const rawRewards = builderStore.sheet.rewards

  if (
    !rawRewards ||
    typeof rawRewards !== 'object' ||
    Array.isArray(rawRewards)
  ) {
    return []
  }

  const selected = (rawRewards as Record<string, BuilderRewardOption>)[
    ADVENTURE_STARTING_SKILL_KEY
  ]

  return selected ? [builderOptionToAdventureReward(selected)] : []
}

async function saveRewards(): Promise<number[]> {
  const ids: number[] = []

  for (const reward of getAdventureRewards()) {
    type RewardResponse = { id: number }

    const response = await performFetch<RewardResponse>('/api/rewards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        label: reward.label,
        text: reward.text,
        power: reward.power,
        rarity: reward.rarity as Rarity,
        rewardType: 'SKILL',
        icon: reward.icon,
        collection: 'adventure-starting-skill',
        userId: userStore.userId || 10,
        isPublic: Boolean(builderStore.sheet.isPublic),
        isMature: Boolean(builderStore.sheet.isMature),
        isActive: true,
      }),
    })

    if (response.success && response.data?.id) {
      ids.push(response.data.id)
    }
  }

  return ids
}

async function saveCharacter(): Promise<void> {
  if (!canSave.value || isSaving.value) return

  isSaving.value = true
  saveMessage.value = ''
  saveError.value = ''

  try {
    syncAdventureStatTiers(builderStore.sheet)

    if (!String(builderStore.sheet.artPrompt ?? '').trim()) {
      builderStore.updateArt({
        artPrompt: buildAdventureArtPrompt(builderStore.sheet),
      })
    }

    const savedRewardIds = await saveRewards()
    const s = builderStore.sheet

    const body: Record<string, unknown> = {
      name: String(s.name ?? '').trim(),
      honorific: String(s.honorific ?? '').trim() || 'adventurer',
      genre: String(s.genre ?? '').trim() || null,
      species: String(s.species ?? '').trim() || null,
      class: String(s.class ?? '').trim() || null,
      alignment: String(s.alignment ?? '').trim() || null,
      gender: String(s.gender ?? '').trim() || null,
      personality: String(s.personality ?? '').trim() || null,
      backstory: String(s.backstory ?? '').trim() || null,
      quirks: String(s.quirks ?? '').trim() || null,
      artPrompt: String(s.artPrompt ?? '').trim() || null,
      artImageId: Number(s.artImageId ?? 0) || null,
      imagePath: s.imagePath || null,
      luck: s.luck,
      might: s.might,
      wits: s.wits,
      grace: s.grace,
      charm: s.charm,
      empathy: s.empathy,
      userId: userStore.userId || Number(s.userId ?? 10) || 10,
      isPublic: Boolean(s.isPublic),
      isMature: Boolean(s.isMature),
      isActive: true,
      experience: 0,
      level: 1,
      rewardIds: savedRewardIds,
    }

    const method = savedCharId.value ? 'PATCH' : 'POST'
    const endpoint = savedCharId.value
      ? `/api/characters/${savedCharId.value}`
      : '/api/characters'

    type CharResponse = { id: number }

    const response = await performFetch<CharResponse>(endpoint, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to save character.')
    }

    savedCharId.value = response.data.id
    saveMessage.value = `Character #${response.data.id} committed to the record. The ledger has been updated.`
  } catch (error) {
    handleError(error, 'saving adventure character')
    saveError.value =
      error instanceof Error
        ? error.message
        : 'The save failed. The ledger is unmoved.'
  } finally {
    isSaving.value = false
  }
}

onMounted(() => {
  builderStore.registerBuilder({
    key: 'adventure',
    label: 'Adventure',
    title: 'Adventure Builder',
    modelType: 'adventure',
    artPurpose: 'character',
    artImageRole: 'avatar',
    artTitle: 'Character Avatar Designer',
    artDescription:
      'Create, upload, select, or generate avatar art for this adventure character.',
    storageKey: 'kindrobots.builder.adventure.v2',
    cards: ADVENTURE_CARDS,
    splash: ADVENTURE_SPLASH,
    defaultSheet: () => defaultAdventureSheet(userStore.userId || 10),
    coreCardKeys: ADVENTURE_CORE_CARD_KEYS,
    requiredCardKeys: ADVENTURE_REQUIRED_CARD_KEYS,
    finalCardKey: 'art',
    clearFieldDefaults: {
      honorific: 'adventurer',
      imagePath: null,
      artImageId: null,
      artPrompt: '',
      userId: userStore.userId || 10,
      isPublic: true,
      isMature: false,
      rewards: {},
      stats: defaultAdventureStats(),
    },
  })

  builderStore.setBuilder('adventure')
  builderStore.updateSheet({
    userId: userStore.userId || 10,
  })

  if (!builderStore.activeCardKey && builderStore.visibleCards.length) {
    builderStore.randomCard()
  }

  seedActiveRewardSlot()
})

watch(
  () => builderStore.activeCard?.rewardSlotKey,
  () => seedActiveRewardSlot(),
)
</script>
