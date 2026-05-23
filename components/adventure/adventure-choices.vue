<!-- components/adventure/adventure-choices.vue -->
<!--
  Routes store.activeStep.inputType to the correct input primitive.
  adventure-art is stubbed here — it gets its own full component later.

  inputType map:
    preset  → adventure-preset
    text    → adventure-text
    long    → adventure-text  (same component, detects inputType internally)
    stats   → adventure-stats
    reward  → adventure-reward
    list    → adventure-list
    art     → inline stub (replaced by adventure-art in a later pass)

  No props. No emits. Pure store-driven routing.
-->
<template>
  <div class="w-full">
    <Transition name="step-crossfade" mode="out-in">
      <!-- Preset: illustrated choice buttons -->
      <adventure-preset
        v-if="inputType === 'preset'"
        :key="`preset-${stepKey}`"
      />

      <!-- Text or long: free entry with suggest -->
      <adventure-text
        v-else-if="inputType === 'text' || inputType === 'long'"
        :key="`text-${stepKey}`"
      />

      <!-- List: searchable chip grid -->
      <adventure-list
        v-else-if="inputType === 'list'"
        :key="`list-${stepKey}`"
      />

      <!-- Stats: 1–6 block assignment grid -->
      <adventure-stats
        v-else-if="inputType === 'stats'"
        :key="`stats-${stepKey}`"
      />

      <!-- Reward: four-option rarity card picker -->
      <adventure-reward
        v-else-if="inputType === 'reward'"
        :key="`reward-${stepKey}`"
      />

      <!-- Art: stub until adventure-art.vue is built -->
      <div
        v-else-if="inputType === 'art'"
        :key="`art-${stepKey}`"
        class="rounded-2xl border border-dashed border-base-300 bg-base-200/50 p-6 text-center"
      >
        <Icon
          name="kind-icon:palette"
          class="mx-auto h-10 w-10 text-primary/40"
        />
        <p class="mt-3 font-bold text-base-content/50">
          Portrait builder loading...
        </p>
        <p class="mt-1 text-sm text-base-content/30">
          The artist is sharpening their pencil. This panel arrives shortly.
        </p>
      </div>

      <!-- Unknown input type — shouldn't happen, but the void needs filling -->
      <div
        v-else
        :key="`unknown-${stepKey}`"
        class="rounded-2xl border border-dashed border-error/30 bg-error/5 p-4 text-center text-sm text-error/70"
      >
        Unknown input type: {{ inputType ?? 'none' }}. The sheet is confused.
        This is embarrassing for everyone.
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAdventureStore } from '@/stores/adventureStore'

const store = useAdventureStore()

const activeStep = computed(() => store.activeStep)
const inputType = computed(() => activeStep.value?.inputType ?? null)
const stepKey = computed(() => activeStep.value?.key ?? 'empty')
</script>

<style scoped>
.step-crossfade-enter-active {
  transition:
    opacity 180ms ease,
    transform 180ms ease;
}
.step-crossfade-leave-active {
  transition:
    opacity 120ms ease,
    transform 120ms ease;
  position: absolute;
  width: 100%;
}
.step-crossfade-enter-from {
  opacity: 0;
  transform: translateY(6px);
}
.step-crossfade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
