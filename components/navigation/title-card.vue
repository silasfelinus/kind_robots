<!-- /components/content/icons/title-card.vue -->
<template>
  <div
    class="relative w-full space-y-4 px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-7"
  >
    <!-- ── "Kind [title]" badge ───────────────────────────────────────── -->
    <div
      v-if="title"
      class="flex flex-col items-center justify-center gap-2 text-center"
    >
      <div
        class="inline-flex max-w-full items-center gap-2.5 rounded-2xl border border-base-300 bg-linear-to-r from-base-100 via-base-200 to-base-100 px-4 py-1.5 shadow-sm sm:px-5 sm:py-2"
      >
        <span
          class="inline-flex items-center justify-center whitespace-nowrap rounded-full bg-primary px-1.5 py-px text-[0.6rem] font-black uppercase tracking-[0.24em] text-primary-content sm:text-[0.65rem]"
        >
          Kind
        </span>
        <span
          class="truncate text-[clamp(1rem,2.1vw,1.5rem)] font-semibold leading-tight tracking-tight text-base-content"
        >
          {{ title }}
        </span>
      </div>
    </div>

    <!-- ── Room name + meta ──────────────────────────────────────────── -->
    <div class="space-y-2.5">
      <h1
        v-if="room"
        class="text-2xl font-black leading-tight tracking-tight sm:text-3xl lg:text-4xl xl:text-5xl"
      >
        <span
          class="inline-block bg-linear-to-r from-primary via-secondary to-accent bg-clip-text text-transparent"
        >
          The {{ room }}
        </span>
      </h1>

      <p
        v-if="subtitle"
        class="max-w-prose text-xs text-base-content/65 sm:text-sm"
      >
        {{ subtitle }}
      </p>

      <!-- Description block ─ secondary-tinted pill -->
      <div
        v-if="description"
        class="inline-flex max-w-[90%] items-start gap-2 rounded-xl border border-secondary/30 bg-secondary/10 px-3 py-2 text-[0.68rem] font-semibold leading-relaxed tracking-wide text-secondary sm:text-xs"
      >
        <icon
          name="kind-icon:sparkles"
          class="mt-px h-3.5 w-3.5 shrink-0 opacity-70"
        />
        <span>{{ description }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { usePageStore } from '@/stores/pageStore'

const pageStore = usePageStore()

const title = computed(() => pageStore.page?.title)
const room = computed(() => pageStore.page?.room)
const subtitle = computed(() => pageStore.page?.subtitle)
const description = computed(() => pageStore.page?.description)
</script>
