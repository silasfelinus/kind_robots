<!-- /components/builder/builder-reward-input.vue -->
<template>
  <div class="flex flex-col gap-4">
    <div v-if="slotKey" class="flex items-center justify-between gap-2 rounded-2xl border border-base-300 bg-base-200 p-3">
      <div>
        <p class="text-xs font-black uppercase tracking-widest text-base-content/50">Reward slot</p>
        <p class="font-black text-base-content">{{ slotKey }}</p>
      </div>
      <button type="button" class="btn btn-sm btn-ghost rounded-xl border border-base-300" @click="selectFallbackReward">
        <Icon name="kind-icon:dice" class="h-4 w-4" />
        Seed options
      </button>
    </div>

    <div v-if="store.activeRewardOptions.length" class="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <button
        v-for="reward in store.activeRewardOptions"
        :key="reward.id"
        type="button"
        class="rounded-2xl border-2 bg-base-100 p-4 text-left transition-all hover:-translate-y-0.5 hover:border-primary/60 hover:shadow-md"
        :class="store.activeSelectedRewardId === reward.id ? 'border-primary bg-primary/10' : 'border-base-300'"
        @click="selectReward(reward.id)"
      >
        <div class="flex items-start gap-3">
          <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-secondary/10 text-secondary">
            <Icon :name="reward.icon || 'kind-icon:reward'" class="h-5 w-5" />
          </div>
          <div class="min-w-0 flex-1">
            <p class="font-black text-base-content">{{ reward.label }}</p>
            <p v-if="reward.rarity" class="mt-0.5 text-xs font-bold uppercase tracking-widest text-primary/70">{{ reward.rarity }}</p>
            <p v-if="reward.description" class="mt-2 text-sm leading-relaxed text-base-content/60">{{ reward.description }}</p>
          </div>
        </div>
      </button>
    </div>

    <div v-else class="rounded-2xl border border-dashed border-base-300 bg-base-200 p-6 text-center">
      <Icon name="kind-icon:reward" class="mx-auto h-10 w-10 text-base-content/25" />
      <p class="mt-2 font-black text-base-content">No reward options yet</p>
      <p class="mt-1 text-sm text-base-content/50">Use Seed options or let a model-specific store populate this slot.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useBuilderStore } from '@/stores/builderStore'
import type { BuilderRewardOption } from '@/stores/helpers/builderCards'

const store = useBuilderStore()
const slotKey = computed(() => store.activeCard?.rewardSlotKey ?? '')

function selectReward(optionId: string): void {
  if (!slotKey.value) return
  store.selectRewardOption(slotKey.value, optionId)
}

function selectFallbackReward(): void {
  if (!slotKey.value) return

  const options: BuilderRewardOption[] = [
    {
      id: `${slotKey.value}-spark`,
      label: 'Borrowed Spark',
      description: 'A small reusable fallback reward. Replace this with model-specific reward generation when ready.',
      rarity: 'COMMON',
      icon: 'kind-icon:sparkles',
    },
    {
      id: `${slotKey.value}-key`,
      label: 'Narrative Key',
      description: 'Unlocks one useful story turn, awkward door, or suspiciously convenient opportunity.',
      rarity: 'UNCOMMON',
      icon: 'kind-icon:key',
    },
  ]

  store.setRewardOptions(slotKey.value, options)
}
</script>
