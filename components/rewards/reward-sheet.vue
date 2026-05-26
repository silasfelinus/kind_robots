<!-- components/rewards/reward-sheet.vue -->
<!-- Live preview sidebar showing current rewardForm state. -->
<template>
  <div class="flex flex-col gap-2 overflow-y-auto p-4">
    <p
      class="mb-1 text-xs font-bold uppercase tracking-widest text-base-content/40"
    >
      Reward Preview
    </p>

    <!-- Type + Rarity badges -->
    <div class="flex flex-wrap gap-1.5">
      <span
        v-if="form.rewardType"
        class="rounded-full bg-base-200 px-2.5 py-0.5 text-xs font-bold uppercase text-base-content/60"
      >
        {{ form.rewardType }}
      </span>
      <span
        v-if="form.rarity"
        class="rounded-full px-2.5 py-0.5 text-xs font-bold uppercase"
        :class="rarityClass(String(form.rarity))"
      >
        {{ form.rarity }}
      </span>
    </div>

    <!-- Name -->
    <div v-if="form.text" class="rounded-2xl bg-base-200 p-3">
      <p
        class="text-xs font-bold uppercase tracking-widest text-base-content/40"
      >
        Name
      </p>
      <p class="mt-1 font-black text-base-content">{{ form.text }}</p>
    </div>

    <!-- Power -->
    <div v-if="form.power" class="rounded-2xl bg-base-200 p-3">
      <p
        class="text-xs font-bold uppercase tracking-widest text-base-content/40"
      >
        Power
      </p>
      <p class="mt-1 text-sm leading-snug text-base-content/80">
        {{ form.power }}
      </p>
    </div>

    <!-- Collection -->
    <div v-if="form.collection" class="flex items-center gap-2">
      <Icon
        name="kind-icon:folder"
        class="h-3.5 w-3.5 shrink-0 text-base-content/40"
      />
      <span class="text-xs text-base-content/60">{{ form.collection }}</span>
    </div>

    <!-- Icon -->
    <div v-if="form.icon" class="flex items-center gap-2">
      <Icon :name="String(form.icon)" class="h-4 w-4 text-primary" />
      <span class="font-mono text-xs text-base-content/50">{{
        form.icon
      }}</span>
    </div>

    <!-- Art image -->
    <div v-if="form.imagePath" class="mt-1 overflow-hidden rounded-2xl">
      <img
        :src="String(form.imagePath)"
        alt="Reward art"
        class="w-full object-cover"
      />
    </div>

    <!-- Empty state -->
    <div
      v-if="!form.text && !form.rewardType"
      class="flex flex-1 flex-col items-center justify-center gap-2 py-8 text-center"
    >
      <Icon name="kind-icon:gift" class="h-8 w-8 text-base-content/15" />
      <p class="text-xs text-base-content/30">
        Your reward will appear here as you build it.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRewardStore } from '@/stores/rewardStore'
const rewardStore = useRewardStore()
const form = computed(() => rewardStore.rewardForm)

function rarityClass(rarity: string): string {
  const map: Record<string, string> = {
    COMMON: 'bg-base-300 text-base-content/50',
    UNCOMMON: 'bg-green-100 text-green-700',
    RARE: 'bg-blue-100 text-blue-700',
    EPIC: 'bg-purple-100 text-purple-700',
    LEGENDARY: 'bg-yellow-100 text-yellow-700',
    MYTHIC: 'bg-red-100 text-red-700',
  }
  return map[rarity] ?? 'bg-base-200 text-base-content/50'
}
</script>
