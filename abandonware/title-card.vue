<!-- /components/content/icons/title-card.vue -->
<template>
  <div
    class="relative w-full space-y-2.5 overflow-hidden px-3 py-3 sm:space-y-3 sm:px-5 sm:py-5 md:space-y-3.5 md:px-6 md:py-6 lg:space-y-4 lg:px-8 lg:py-7"
  >
    <!-- ambient glow: hidden on mobile (it muddies small text), fades in from md -->
    <div
      class="pointer-events-none absolute -top-16 -right-16 hidden h-48 w-48 rounded-full bg-primary/20 blur-3xl md:block"
    />
    <div
      class="pointer-events-none absolute -bottom-20 -left-12 hidden h-44 w-44 rounded-full bg-accent/20 blur-3xl md:block"
    />

    <!-- ── "Kind [title]" badge ───────────────────────────────────────── -->
    <div
      v-if="title"
      class="relative flex flex-col items-center justify-center gap-2 text-center"
    >
      <div
        class="group inline-flex max-w-full items-center gap-1.5 rounded-xl border border-base-300 bg-linear-to-r from-base-100 via-base-200 to-base-100 px-2.5 py-1 shadow-sm transition-shadow duration-300 hover:shadow-md sm:gap-2 sm:rounded-2xl sm:px-4 sm:py-1.5 md:gap-2.5 md:px-5 md:py-2"
      >
        <span
          class="inline-flex items-center justify-center whitespace-nowrap rounded-full bg-primary px-1.5 py-px text-[0.55rem] font-black uppercase tracking-[0.18em] text-primary-content shadow-sm transition-transform duration-300 group-hover:scale-105 sm:text-[0.6rem] sm:tracking-[0.22em] lg:text-[0.65rem] lg:tracking-[0.24em]"
        >
          Kind
        </span>
        <span
          class="truncate text-sm font-semibold leading-tight tracking-tight text-base-content sm:text-base md:text-lg lg:text-xl xl:text-2xl"
        >
          {{ title }}
        </span>
      </div>
    </div>

    <!-- ── Room name + meta ──────────────────────────────────────────── -->
    <div class="relative space-y-2 sm:space-y-2.5">
      <h1
        v-if="room"
        class="text-xl font-black leading-tight tracking-tight sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl"
      >
        <!-- solid fallback color guarantees contrast; gradient layers on top -->
        <span
          class="inline-block bg-linear-to-r from-primary via-secondary to-accent bg-clip-text text-primary [-webkit-text-fill-color:transparent] [text-shadow:0_1px_2px_rgb(0_0_0/0.08)]"
        >
          The {{ room }}
        </span>
      </h1>

      <p
        v-if="subtitle"
        class="max-w-prose text-[0.7rem] leading-snug text-base-content/70 sm:text-xs md:text-sm"
      >
        {{ subtitle }}
      </p>

      <!-- Description block ─ secondary-tinted pill -->
      <div
        v-if="description"
        class="inline-flex max-w-full items-start gap-1.5 rounded-lg border border-secondary/30 bg-secondary/10 px-2.5 py-1.5 text-[0.62rem] font-semibold leading-relaxed tracking-wide text-secondary shadow-sm sm:max-w-[90%] sm:gap-2 sm:rounded-xl sm:px-3 sm:py-2 sm:text-[0.68rem] md:text-xs"
      >
        <icon
          name="kind-icon:sparkles"
          class="mt-px h-3 w-3 shrink-0 opacity-70 motion-safe:animate-pulse sm:h-3.5 sm:w-3.5"
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
