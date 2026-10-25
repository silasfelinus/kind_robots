<template>
  <aside
    v-if="tip"
    class="cs-tip cs-frame mb-2 flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2"
    role="status"
    aria-live="polite"
    data-testid="cs-tip"
  >
    <p class="min-w-0 flex-1 basis-64 text-sm leading-snug">
      <span class="cs-kicker mr-1">Tip · {{ tip.title }}</span>
      {{ tip.text }}
    </p>
    <div class="flex shrink-0 gap-2">
      <button
        type="button"
        class="btn btn-primary btn-xs rounded-2xl"
        data-testid="cs-tip-ok"
        @click="store.seeTip(tip.id)"
      >
        Got it
      </button>
      <button
        type="button"
        class="btn btn-ghost btn-xs rounded-2xl"
        data-testid="cs-tip-off"
        @click="hide"
      >
        No more tips
      </button>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useCrystalStreetStore } from '~/stores/crystalStreetStore'

// First-week coaching (conductor crystal-street t-016): one tip at a time,
// the first time each part of the week comes up.
const store = useCrystalStreetStore()
const tip = computed(() => store.tip)

function hide(): void {
  if (tip.value) store.seeTip(tip.value.id)
  store.setSetting('tips', 'off')
}
</script>
