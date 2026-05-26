<!-- components/pitch/pitch-sheet.vue -->
<!-- Live preview sidebar for the pitch builder. -->
<template>
  <div class="flex flex-col gap-0 overflow-y-auto p-4">
    <p
      class="mb-3 text-xs font-bold uppercase tracking-widest text-base-content/40"
    >
      Pitch Preview
    </p>

    <!-- Type badge -->
    <div v-if="sheet.PitchType" class="mb-2">
      <span
        class="rounded-full px-3 py-1 text-xs font-black uppercase tracking-wider"
        :class="
          sheet.PitchType === 'ARTPITCH'
            ? 'bg-accent/15 text-accent'
            : 'bg-secondary/15 text-secondary'
        "
      >
        {{ sheet.PitchType === 'ARTPITCH' ? '🎨 Art Pitch' : '🌙 Dream' }}
      </span>
    </div>

    <!-- Pitch text (the main thing) -->
    <div v-if="sheet.pitch" class="mb-3 rounded-2xl bg-base-200 p-3">
      <p
        class="text-xs font-bold uppercase tracking-widest text-base-content/40"
      >
        Pitch
      </p>
      <p class="mt-1 text-sm font-semibold leading-snug text-base-content">
        {{ sheet.pitch }}
      </p>
    </div>

    <!-- Genre -->
    <div v-if="sheet.genre" class="mb-2 flex items-center gap-2">
      <Icon
        name="kind-icon:compass"
        class="h-3.5 w-3.5 shrink-0 text-base-content/40"
      />
      <span class="text-xs text-base-content/60">{{ sheet.genre }}</span>
    </div>

    <!-- Icon -->
    <div v-if="sheet.icon" class="mb-2 flex items-center gap-2">
      <Icon :name="sheet.icon" class="h-4 w-4 text-primary" />
      <span class="text-xs text-base-content/60 font-mono">{{
        sheet.icon
      }}</span>
    </div>

    <!-- Art prompt -->
    <div v-if="sheet.artPrompt" class="mb-2 rounded-xl bg-base-200 p-2.5">
      <p
        class="text-xs font-bold uppercase tracking-widest text-base-content/40"
      >
        Art Prompt
      </p>
      <p class="mt-1 text-xs leading-snug text-base-content/60 line-clamp-4">
        {{ sheet.artPrompt }}
      </p>
    </div>

    <!-- Art image -->
    <div v-if="sheet.highlightImage" class="mt-1 overflow-hidden rounded-2xl">
      <img
        :src="sheet.highlightImage"
        alt="Pitch image"
        class="w-full object-cover"
      />
    </div>

    <!-- Empty state -->
    <div
      v-if="!sheet.pitch && !sheet.PitchType"
      class="flex flex-1 flex-col items-center justify-center gap-2 py-8 text-center"
    >
      <Icon name="kind-icon:edit" class="h-8 w-8 text-base-content/15" />
      <p class="text-xs text-base-content/30">
        Your pitch will appear here as you build it.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { usePitchStore } from '@/stores/pitchStore'

const store = usePitchStore()
const sheet = computed(() => store.pitchForm)
</script>
