<!-- components/scenarios/scenario-classification.vue -->
<!-- Tier, group, and difficulty — writes directly to scenarioStore.scenarioForm. -->
<template>
  <div class="flex flex-col gap-5">
    <!-- Tier -->
    <div class="flex flex-col gap-2">
      <label
        class="text-xs font-bold uppercase tracking-widest text-base-content/50"
        >Tier</label
      >
      <div class="flex flex-wrap gap-1.5">
        <button
          v-for="t in TIER_PRESETS"
          :key="t"
          type="button"
          class="rounded-full border px-3 py-1 text-xs font-semibold capitalize transition-all"
          :class="
            form.tier === t
              ? 'border-primary bg-primary/15 text-primary'
              : 'border-base-300 bg-base-200 text-base-content/60 hover:border-primary/40 hover:text-primary'
          "
          @click="form.tier = t"
        >
          {{ t }}
        </button>
      </div>
      <input
        v-model="form.tier"
        type="text"
        class="input input-bordered input-sm w-full max-w-xs rounded-xl bg-base-100 focus:border-primary"
        placeholder="or type your own tier..."
        maxlength="100"
      />
    </div>

    <!-- Group -->
    <div class="flex flex-col gap-2">
      <label
        class="text-xs font-bold uppercase tracking-widest text-base-content/50"
        >Group</label
      >
      <input
        v-model="form.group"
        type="text"
        class="input input-bordered input-sm w-full max-w-xs rounded-xl bg-base-100 focus:border-primary"
        placeholder="dungeon-one, goblin-cave, act-two..."
        maxlength="200"
      />
      <p class="text-xs text-base-content/40">
        Scenarios with the same group string are linked together.
      </p>
    </div>

    <!-- Difficulty -->
    <div class="flex flex-col gap-2">
      <label
        class="text-xs font-bold uppercase tracking-widest text-base-content/50"
      >
        Difficulty
        <span v-if="form.difficulty != null" class="ml-2 text-primary">{{
          form.difficulty
        }}</span>
        <span v-else class="ml-2 text-base-content/30">unset</span>
      </label>
      <div class="flex items-center gap-3">
        <input
          :value="form.difficulty ?? 5"
          type="range"
          min="1"
          max="10"
          class="range range-primary range-sm flex-1 max-w-xs"
          @input="
            form.difficulty = Number(($event.target as HTMLInputElement).value)
          "
        />
        <button
          type="button"
          class="btn btn-ghost btn-xs rounded-xl text-base-content/30"
          @click="form.difficulty = null"
        >
          Clear
        </button>
      </div>
      <div class="flex max-w-xs justify-between text-xs text-base-content/30">
        <span>1 · Easy</span>
        <span>5 · Medium</span>
        <span>10 · Hard</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useScenarioStore } from '@/stores/scenarioStore'
import { TIER_PRESETS } from '@/stores/helpers/scenarioCards'

const scenarioStore = useScenarioStore()
const form = computed(() => scenarioStore.scenarioForm)
</script>
