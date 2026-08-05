<!-- /components/builder/builder-reward-input.vue -->
<template>
  <div class="flex flex-col gap-4">
    <div
      v-if="slotKey"
      class="flex items-center justify-between gap-2 rounded-2xl border border-base-300 bg-base-200 p-3"
    >
      <div class="min-w-0">
        <p
          class="text-xs font-black uppercase tracking-widest text-base-content/50"
        >
          Reward slot
        </p>

        <p class="truncate font-black text-base-content">
          {{ slotLabel }}
        </p>
      </div>

      <button
        type="button"
        class="btn btn-sm btn-ghost rounded-xl border border-base-300"
        :disabled="store.isRewardLoading"
        @click="rerollOptions"
      >
        <Icon
          :name="store.isRewardLoading ? 'kind-icon:spinner' : 'kind-icon:dice'"
          class="h-4 w-4"
          :class="store.isRewardLoading ? 'animate-spin' : ''"
        />
        {{ store.isRewardLoading ? 'Drawing…' : 'Reroll options' }}
      </button>
    </div>

    <div
      v-if="store.rewardError"
      class="rounded-2xl border border-error/30 bg-error/10 p-4 text-sm font-bold text-error"
    >
      {{ store.rewardError }}
    </div>

    <div
      v-if="store.activeRewardOptions.length"
      class="grid grid-cols-1 gap-3 sm:grid-cols-2"
    >
      <button
        v-for="reward in store.activeRewardOptions"
        :key="reward.id"
        type="button"
        class="rounded-2xl border-2 bg-base-100 p-4 text-left transition-all hover:-translate-y-0.5 hover:border-primary/60 hover:shadow-md"
        :class="
          store.activeSelectedRewardId === reward.id
            ? 'border-primary bg-primary/10'
            : 'border-base-300'
        "
        @click="selectReward(reward.id)"
      >
        <div class="flex items-start gap-3">
          <div
            class="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-secondary/10 text-secondary"
          >
            <img
              v-if="rewardImagePath(reward)"
              :src="rewardImagePath(reward) || ''"
              :alt="reward.label || 'Reward image'"
              class="h-full w-full object-cover"
              loading="lazy"
              @error="markRewardImageFailed(reward.id)"
            />

            <Icon v-else :name="rewardIcon(reward)" class="h-6 w-6" />
          </div>

          <div class="min-w-0 flex-1">
            <div class="flex min-w-0 flex-wrap items-center gap-2">
              <p class="min-w-0 truncate font-black text-base-content">
                {{ reward.label || 'Unnamed reward' }}
              </p>

              <span
                v-if="rewardTypeLabel(reward)"
                class="badge badge-sm rounded-xl border-base-300 bg-base-200 text-[0.65rem] font-black uppercase tracking-widest text-base-content/60"
              >
                {{ rewardTypeLabel(reward) }}
              </span>
            </div>

            <p
              v-if="reward.rarity"
              class="mt-0.5 text-xs font-bold uppercase tracking-widest text-primary/70"
            >
              {{ reward.rarity }}
            </p>

            <p
              v-if="reward.description"
              class="mt-2 text-sm leading-relaxed text-base-content/60"
            >
              {{ reward.description }}
            </p>
          </div>
        </div>
      </button>
    </div>

    <div
      v-else
      class="rounded-2xl border border-dashed border-base-300 bg-base-200 p-6 text-center"
    >
      <Icon
        :name="store.isRewardLoading ? 'kind-icon:spinner' : fallbackIcon"
        class="mx-auto h-10 w-10 text-base-content/25"
        :class="store.isRewardLoading ? 'animate-spin' : ''"
      />

      <p class="mt-2 font-black text-base-content">
        {{
          store.isRewardLoading
            ? 'Drawing reward options…'
            : 'No reward options yet'
        }}
      </p>

      <p class="mx-auto mt-1 max-w-md text-sm text-base-content/50">
        {{ emptyMessage }}
      </p>

      <button
        v-if="slotKey && !store.isRewardLoading"
        type="button"
        class="btn btn-sm btn-primary mt-4 rounded-xl"
        @click="rerollOptions"
      >
        <Icon name="kind-icon:dice" class="h-4 w-4" />
        Draw options
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useBuilderStore } from '@/stores/builderStore'
import type { BuilderRewardOption } from '@/stores/helpers/builderCards'
import type { RolledReward } from '@/stores/generatorStore'

type RewardImageSource = {
  image?: string | null
  imageUrl?: string | null
  imagePath?: string | null
  image_path?: string | null
  artImagePath?: string | null
  art_image_path?: string | null
  imageData?: string | null
  image_data?: string | null
  artImage?: {
    imagePath?: string | null
    path?: string | null
    imageData?: string | null
  } | null
  art?: {
    imagePath?: string | null
    path?: string | null
  } | null
}

type RewardPayload = {
  reward?: RolledReward & RewardImageSource
  image?: string | null
  imageUrl?: string | null
  imagePath?: string | null
  image_path?: string | null
  artImagePath?: string | null
  art_image_path?: string | null
  imageData?: string | null
  image_data?: string | null
  rewardType?: string | null
}

function cleanImagePath(path: string): string {
  const trimmedPath = path.trim()

  if (!trimmedPath) return ''
  if (trimmedPath.startsWith('/')) return trimmedPath
  if (trimmedPath.startsWith('http://')) return trimmedPath
  if (trimmedPath.startsWith('https://')) return trimmedPath
  if (trimmedPath.startsWith('data:')) return trimmedPath

  return `/${trimmedPath}`
}

function rewardImagePath(option: BuilderRewardOption): string | null {
  if (failedRewardImages.value.has(option.id)) return null

  const payload = optionPayload(option)
  const reward = payload.reward
  const optionImageSource = option as BuilderRewardOption & RewardImageSource

  const imagePath =
    optionImageSource.imagePath ||
    optionImageSource.imageUrl ||
    optionImageSource.image ||
    optionImageSource.image_path ||
    optionImageSource.artImagePath ||
    optionImageSource.art_image_path ||
    optionImageSource.imageData ||
    optionImageSource.image_data ||
    optionImageSource.artImage?.imagePath ||
    optionImageSource.artImage?.path ||
    optionImageSource.artImage?.imageData ||
    optionImageSource.art?.imagePath ||
    optionImageSource.art?.path ||
    payload.imagePath ||
    payload.imageUrl ||
    payload.image ||
    payload.image_path ||
    payload.artImagePath ||
    payload.art_image_path ||
    payload.imageData ||
    payload.image_data ||
    reward?.imagePath ||
    reward?.imageUrl ||
    reward?.image ||
    reward?.image_path ||
    reward?.artImagePath ||
    reward?.art_image_path ||
    reward?.imageData ||
    reward?.image_data ||
    reward?.artImage?.imagePath ||
    reward?.artImage?.path ||
    reward?.artImage?.imageData ||
    reward?.art?.imagePath ||
    reward?.art?.path ||
    ''

  const cleanedPath = cleanImagePath(String(imagePath))

  return cleanedPath || null
}

const store = useBuilderStore()
const failedRewardImages = ref<Set<string>>(new Set())

const slotKey = computed(() => store.activeCard?.rewardSlotKey ?? '')

const slotLabel = computed(() => {
  if (!slotKey.value) return 'No slot selected'

  return slotKey.value
    .split('-')
    .filter(Boolean)
    .map((part: string) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
})

const fallbackIcon = computed(() => {
  if (slotKey.value.includes('skill')) return 'kind-icon:sparkles'
  if (slotKey.value.includes('item')) return 'kind-icon:treasure'

  return 'kind-icon:gift'
})

const emptyMessage = computed(() => {
  if (store.isRewardLoading) {
    return 'Checking your reward pool for matching options.'
  }

  if (slotKey.value.includes('skill')) {
    return 'Draw a fresh set of starting skills.'
  }

  if (slotKey.value.includes('item')) {
    return 'Draw a fresh set of starting items.'
  }

  return 'Draw a fresh set for this slot.'
})

function optionPayload(option: BuilderRewardOption): RewardPayload {
  if (option.payload && typeof option.payload === 'object') {
    return option.payload as RewardPayload
  }

  return {}
}

function payloadReward(option: BuilderRewardOption): RolledReward | null {
  const reward = optionPayload(option).reward

  if (reward && typeof reward === 'object') {
    return reward as RolledReward
  }

  return null
}

function markRewardImageFailed(optionId: string): void {
  failedRewardImages.value = new Set([...failedRewardImages.value, optionId])
}

function rewardTypeLabel(option: BuilderRewardOption): string {
  const reward = payloadReward(option)
  const payload = optionPayload(option)
  const rewardType = String(
    reward?.rewardType ?? payload.rewardType ?? '',
  ).trim()

  return rewardType ? rewardType.toLowerCase() : ''
}

function rewardIcon(option: BuilderRewardOption): string {
  const reward = payloadReward(option)
  const payload = optionPayload(option)
  const rewardType = String(
    reward?.rewardType ?? payload.rewardType ?? '',
  ).toUpperCase()

  if (option.icon) return option.icon
  if (reward?.icon) return reward.icon
  if (rewardType === 'SKILL') return 'kind-icon:sparkles'
  if (rewardType === 'ITEM') return 'kind-icon:treasure'
  if (rewardType === 'POWER') return 'kind-icon:bolt'
  if (rewardType === 'PET') return 'kind-icon:heart'
  if (rewardType === 'MAGIC') return 'kind-icon:wand'
  if (rewardType === 'FAVOR') return 'kind-icon:star'

  return fallbackIcon.value
}

function selectReward(optionId: string): void {
  if (!slotKey.value) return
  store.selectRewardOption(slotKey.value, optionId)
}

async function rerollOptions(): Promise<void> {
  if (!slotKey.value) return

  failedRewardImages.value = new Set()
  await store.rollRewardOptions(slotKey.value)
}

watch(
  slotKey,
  (nextSlotKey: string) => {
    failedRewardImages.value = new Set()

    if (!nextSlotKey) return
    if (store.activeRewardOptions.length) return

    void store.rollRewardOptions(nextSlotKey)
  },
  { immediate: true },
)
</script>
