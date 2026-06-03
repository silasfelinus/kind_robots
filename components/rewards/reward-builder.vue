<!-- /components/rewards/reward-builder.vue -->
<template>
  <div class="hidden" aria-hidden="true" />
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { REWARD_CARDS } from '@/stores/helpers/rewardCards'
import type {
  BuilderProjectConfig,
  BuilderSaveResult,
  BuilderSheet,
} from '@/stores/helpers/builderCards'
import { useBuilderStore } from '@/stores/builderStore'
import { useRewardStore } from '@/stores/rewardStore'
import { useUserStore } from '@/stores/userStore'
import type { Rarity, RewardType } from '~/prisma/generated/prisma/client'

const builder = useBuilderStore()
const rewardStore = useRewardStore()
const userStore = useUserStore()

const builderKey = 'reward'
const startCard = 'type'

const rewardTypeValues = [
  'SKILL',
  'ITEM',
  'TREASURE',
  'TITLE',
  'POWER',
  'STORY',
] as const

const rarityValues = [
  'COMMON',
  'UNCOMMON',
  'RARE',
  'EPIC',
  'LEGENDARY',
  'MYTHIC',
] as const

function sheetText(key: string): string {
  const value = builder.sheet[key]

  return typeof value === 'string' ? value : ''
}

function sheetNumber(key: string): number | null {
  const value = builder.sheet[key]

  return typeof value === 'number' ? value : null
}

function sheetBoolean(key: string, fallback = false): boolean {
  const value = builder.sheet[key]

  return typeof value === 'boolean' ? value : fallback
}

function sheetRewardType(key: string): RewardType {
  const value = sheetText(key)

  return rewardTypeValues.includes(value as RewardType)
    ? (value as RewardType)
    : 'SKILL'
}

function sheetRarity(key: string): Rarity {
  const value = sheetText(key)

  return rarityValues.includes(value as Rarity) ? (value as Rarity) : 'COMMON'
}

function defaultRewardSheet(): BuilderSheet {
  const form = rewardStore.rewardForm as Record<string, unknown>

  return {
    rewardType: typeof form.rewardType === 'string' ? form.rewardType : 'ITEM',
    rarity: typeof form.rarity === 'string' ? form.rarity : 'COMMON',
    icon: typeof form.icon === 'string' ? form.icon : 'kind-icon:gift',
    text: typeof form.text === 'string' ? form.text : '',
    power: typeof form.power === 'string' ? form.power : '',
    collection:
      typeof form.collection === 'string'
        ? form.collection
        : 'starting-character-reward',
    label: typeof form.label === 'string' ? form.label : '',
    imagePath: typeof form.imagePath === 'string' ? form.imagePath : null,
    artPrompt: typeof form.artPrompt === 'string' ? form.artPrompt : '',
    artImageId: typeof form.artImageId === 'number' ? form.artImageId : null,
    userId:
      typeof form.userId === 'number'
        ? form.userId
        : (userStore.userId ?? userStore.user?.id ?? 10),
    isPublic: typeof form.isPublic === 'boolean' ? form.isPublic : true,
    isMature: typeof form.isMature === 'boolean' ? form.isMature : false,
    isActive: typeof form.isActive === 'boolean' ? form.isActive : true,
  }
}

function syncSheetToRewardForm() {
  const resolvedUserId =
    sheetNumber('userId') ?? userStore.userId ?? userStore.user?.id ?? 10

  rewardStore.rewardForm = {
    ...rewardStore.rewardForm,
    rewardType: sheetRewardType('rewardType'),
    rarity: sheetRarity('rarity'),
    icon: sheetText('icon') || 'kind-icon:gift',
    text: sheetText('text'),
    power: sheetText('power'),
    collection: sheetText('collection') || 'starting-character-reward',
    label: sheetText('label'),
    imagePath:
      typeof builder.sheet.imagePath === 'string'
        ? builder.sheet.imagePath
        : undefined,
    artPrompt: sheetText('artPrompt'),
    artImageId: sheetNumber('artImageId') ?? undefined,
    userId: resolvedUserId,
    isPublic: sheetBoolean('isPublic', true),
    isMature: sheetBoolean('isMature', false),
    isActive: sheetBoolean('isActive', true),
  }
}
async function saveRewardBuilder(): Promise<BuilderSaveResult> {
  builder.clearError()
  syncSheetToRewardForm()

  const reward = await rewardStore.saveReward()

  if (reward?.id) {
    builder.setStatus('Reward saved.')

    return {
      success: true,
      message: 'Reward saved.',
      data: reward,
    }
  }

  const message = rewardStore.error || 'Failed to save reward.'

  builder.setLastError(new Error(message), message)

  return {
    success: false,
    message,
    data: null,
  }
}

function resetRewardBuilder() {
  rewardStore.startAddingReward()
  builder.resetBuilder(true)
  builder.selectCard(startCard)
}

const rewardBuilderConfig: BuilderProjectConfig = {
  key: builderKey,
  label: 'Reward Builder',
  title: 'Reward Builder',
  modelType: 'reward',
  storageKey: 'kindrobots.builder.reward.v1',
  cards: REWARD_CARDS,
  splash: {
    title: 'Reward Builder',
    subtitle: 'Create skills, items, titles, powers, and story trouble.',
    tagline: 'A prize, a problem, or both. Ideally both.',
    description:
      'Build a reward one card at a time: type, rarity, name, power, collection, visibility, and optional art.',
    imagePath: '/images/rewards/splash.webp',
    ctaLabel: 'Start Reward',
    secondaryLabel: 'Surprise Me',
  },
  defaultSheet: defaultRewardSheet,
  coreCardKeys: ['type', 'rarity', 'name', 'power'],
  requiredCardKeys: ['type', 'rarity', 'name', 'power'],
  finalCardKey: 'art',
  artPurpose: 'reward',
  artImageRole: 'object',
  artTitle: 'Reward Image Designer',
  artDescription: 'Create, upload, select, or generate art for this reward.',
  clearFieldDefaults: {
    imagePath: null,
    artImageId: null,
    userId: 10,
    isPublic: true,
    isMature: false,
    isActive: true,
  },
  persistActiveCard: true,
  allowCompletedCardsInDeck: false,
  suggestContext: {
    builder: 'reward',
    tone: 'Punchy, flavorful, useful in interactive narrative play.',
  },
  startCardKey: startCard,
  save: saveRewardBuilder,
  reset: resetRewardBuilder,
}

onMounted(() => {
  builder.registerBuilder(rewardBuilderConfig)
  builder.setBuilder(builderKey, true)

  if (!builder.activeCardKey && builder.visibleCards.length) {
    builder.selectCard(startCard)
  }
})
</script>
