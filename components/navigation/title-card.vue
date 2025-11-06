<!-- /components/content/icons/title-card.vue -->
<template>
  <div
    class="relative h-full overflow-y-auto px-4 py-4 sm:px-5 sm:py-5 lg:px-6 lg:py-6 space-y-3 sm:space-y-4"
  >
    <div
      v-if="icon"
      class="pointer-events-none absolute -top-10 -right-6 md:-top-12 md:-right-8 opacity-20 rotate-6"
    >
      <Icon
        :name="icon"
        class="w-24 h-24 sm:w-32 sm:h-32 lg:w-40 lg:h-40 text-primary"
      />
    </div>

    <!-- Kind title row -->
    <div v-if="title" class="flex items-center justify-between gap-3 mb-0.5">
      <div
        class="inline-flex max-w-full items-center gap-2.5 rounded-2xl border border-black bg-base-100/95 px-3 py-1.5 sm:px-4 sm:py-1.5 shadow-md"
      >
        <span
          class="inline-flex items-center justify-center rounded-full bg-black text-base-100 px-2.5 py-px text-[0.6rem] sm:text-[0.7rem] font-semibold tracking-[0.22em] uppercase whitespace-nowrap"
        >
          Kind
        </span>

        <span
          class="truncate font-semibold leading-tight text-[clamp(0.95rem,1.9vw,1.4rem)] tracking-tight"
        >
          {{ title }}
        </span>
      </div>

      <button
        v-if="theme && themeStore.currentTheme !== theme"
        type="button"
        @click="themeStore.setActiveTheme(theme)"
        class="inline-flex items-center justify-center rounded-full border border-black bg-accent px-3 py-1 text-[0.7rem] sm:text-xs lg:text-sm font-semibold text-black shadow-sm hover:translate-y-[1px] hover:shadow-md transition"
      >
        <span
          class="mr-1.5 text-[0.65rem] uppercase tracking-[0.16em] opacity-80"
        >
          Theme
        </span>
        <span class="font-mono">{{ theme }}</span>
      </button>
    </div>

    <!-- Room, subtitle, description -->
    <div class="space-y-1.5 sm:space-y-2">
      <h1
        v-if="room"
        class="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-black leading-tight tracking-tight"
      >
        <span
          class="inline-block bg-clip-text text-transparent bg-gradient-to-r from-primary via-secondary to-accent drop-shadow-[0_1px_0_rgba(0,0,0,0.55)]"
        >
          The {{ room }}
        </span>
      </h1>

      <p
        v-if="subtitle"
        class="text-xs sm:text-sm text-base-content/80 max-w-prose"
      >
        {{ subtitle }}
      </p>

      <p
        v-if="description"
        class="inline-flex w-full sm:max-w-[90%] items-center rounded-full border border-black bg-secondary px-4 py-1 text-[0.7rem] sm:text-xs font-semibold uppercase tracking-[0.18em] leading-relaxed whitespace-normal"
      >
        {{ description }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
// /components/content/icons/title-card.vue
import { computed } from 'vue'
import { Icon } from '#components'
import { usePageStore } from '@/stores/pageStore'
import { useThemeStore } from '@/stores/themeStore'

const pageStore = usePageStore()
const themeStore = useThemeStore()

const title = computed(() => pageStore.page?.title)
const room = computed(() => pageStore.page?.room)
const subtitle = computed(() => pageStore.page?.subtitle)
const description = computed(() => pageStore.page?.description)
const icon = computed(() => pageStore.page?.icon)
const theme = computed(() => pageStore.page?.theme)
</script>
