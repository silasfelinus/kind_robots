<!-- components/dreams/dream-sheet.vue -->
<template>
  <div class="flex flex-col gap-2 overflow-y-auto p-4">
    <p
      class="mb-1 text-xs font-bold uppercase tracking-widest text-base-content/40"
    >
      Dream Preview
    </p>

    <div v-if="vibeTag" class="flex items-center gap-2">
      <span
        class="rounded-full bg-base-200 px-2.5 py-0.5 text-xs font-bold capitalize text-base-content/60"
      >
        {{ vibeTag }}
      </span>
      <span
        v-if="(sheet.accessMode ?? 'OPEN') !== 'OPEN'"
        class="rounded-full bg-warning/15 px-2.5 py-0.5 text-xs font-bold text-warning capitalize"
      >
        {{ (sheet.accessMode ?? 'OPEN').toLowerCase() }}
      </span>
    </div>

    <div v-if="sheet.title" class="rounded-2xl bg-base-200 p-3">
      <p
        class="text-xs font-bold uppercase tracking-widest text-base-content/40"
      >
        Title
      </p>
      <p class="mt-1 font-black text-base-content">{{ sheet.title }}</p>
    </div>

    <div v-if="sheet.description" class="rounded-2xl bg-base-200 p-3">
      <p
        class="text-xs font-bold uppercase tracking-widest text-base-content/40"
      >
        Description
      </p>
      <p class="mt-1 text-xs leading-snug text-base-content/70 line-clamp-4">
        {{ sheet.description }}
      </p>
    </div>

    <div
      v-if="sheet.currentVibe"
      class="rounded-xl border border-base-300 p-2.5"
    >
      <p
        class="text-xs font-bold uppercase tracking-widest text-base-content/40"
      >
        Current Vibe
      </p>
      <p
        class="mt-1 text-xs leading-snug text-base-content/60 italic line-clamp-3"
      >
        {{ sheet.currentVibe }}
      </p>
    </div>

    <div
      v-if="sheet.currentPrompt"
      class="rounded-xl border border-primary/20 p-2.5"
    >
      <p class="text-xs font-bold uppercase tracking-widest text-primary/60">
        Active Prompt
      </p>
      <p class="mt-1 text-xs leading-snug text-base-content/60 line-clamp-3">
        {{ sheet.currentPrompt }}
      </p>
    </div>

    <div
      v-if="sheet.artImageId || sheet.artPrompt"
      class="rounded-xl bg-base-200 p-2.5"
    >
      <p
        class="text-xs font-bold uppercase tracking-widest text-base-content/40"
      >
        Art
      </p>
      <p
        v-if="!sheet.artImageId"
        class="mt-1 text-xs text-base-content/40 italic"
      >
        Prompt ready — not yet generated
      </p>
    </div>

    <div
      v-if="!sheet.title && !vibeTag"
      class="flex flex-1 flex-col items-center justify-center gap-2 py-8 text-center"
    >
      <Icon name="kind-icon:moon" class="h-8 w-8 text-base-content/15" />
      <p class="text-xs text-base-content/30">
        Your dream will appear here as you build it.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useDreamBuilderStore } from '@/stores/dreamBuilderStore'
import { useDreamStore } from '@/stores/dreamStore'

const builder = useDreamBuilderStore()
const dreamStore = useDreamStore()
const sheet = computed(() => dreamStore.dreamForm)
const vibeTag = computed(() => builder.vibeTag)
</script>
