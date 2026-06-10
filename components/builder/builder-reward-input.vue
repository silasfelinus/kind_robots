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
        @click="rerollOptions"
      >
        <Icon name="kind-icon:dice" class="h-4 w-4" />
        Reroll options
      </button>
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
            class="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-secondary/10 text-secondary"
          >
            <Icon :name="reward.icon || fallbackIcon" class="h-5 w-5" />
          </div>

          <div class="min-w-0 flex-1">
            <p class="font-black text-base-content">
              {{ rewardTitle(reward) }}
            </p>

            <p
              v-if="reward.rarity"
              class="mt-0.5 text-xs font-bold uppercase tracking-widest text-primary/70"
            >
              {{ reward.rarity }}
            </p>

            <p
              v-if="rewardDescription(reward)"
              class="mt-2 text-sm leading-relaxed text-base-content/60"
            >
              {{ rewardDescription(reward) }}
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
        :name="fallbackIcon"
        class="mx-auto h-10 w-10 text-base-content/25"
      />

      <p class="mt-2 font-black text-base-content">No reward options yet</p>

      <p class="mx-auto mt-1 max-w-md text-sm text-base-content/50">
        Draw a fresh set for this slot.
      </p>

      <button
        v-if="slotKey"
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
import { computed, watch } from 'vue'
import { useAdventureStore } from '@/stores/adventureStore'
import type { RolledReward } from '@/stores/generatorStore'

const store = useAdventureStore()

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
  return 'kind-icon:reward'
})

function rewardPayload(reward: RolledReward): Record<string, unknown> {
  return (reward as { payload?: Record<string, unknown> }).payload ?? {}
}

function rewardString(
  reward: RolledReward,
  keys: string[],
  fallback = '',
): string {
  const payload = rewardPayload(reward)
  const source = reward as unknown as Record<string, unknown>

  for (const key of keys) {
    const directValue = source[key]
    if (typeof directValue === 'string' && directValue.trim()) {
      return directValue
    }

    const payloadValue = payload[key]
    if (typeof payloadValue === 'string' && payloadValue.trim()) {
      return payloadValue
    }
  }

  return fallback
}

function rewardTitle(reward: RolledReward): string {
  return rewardString(
    reward,
    ['label', 'name', 'title', 'text', 'reward', 'power'],
    'Unnamed reward',
  )
}

function rewardDescription(reward: RolledReward): string {
  return rewardString(reward, [
    'description',
    'summary',
    'subtext',
    'text',
    'power',
  ])
}

function selectReward(optionId: string): void {
  if (!slotKey.value) return
  store.selectRewardOption(slotKey.value, optionId)
}

function rerollOptions(): void {
  if (!slotKey.value) return
  store.rollRewardOptions(slotKey.value)
}

watch(
  slotKey,
  (nextSlotKey: string) => {
    if (!nextSlotKey) return
    if (store.activeRewardOptions.length) return
    store.rollRewardOptions(nextSlotKey)
  },
  { immediate: true },
)
</script>
