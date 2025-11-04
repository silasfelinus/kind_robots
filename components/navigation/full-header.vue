<!-- /components/content/navigation/full-header.vue -->
<template>
  <header
    class="w-full h-full flex items-stretch gap-0 rounded-2xl bg-base-300 overflow-hidden [isolation:isolate]"
  >
    <!-- Avatar column -->
    <div
      class="relative flex-none h-full shrink-0 z-0 pointer-events-auto flex"
      :class="avatarColumnClasses"
    >
      <avatar-image
        alt="User Avatar"
        class="block w-full h-full object-cover object-center m-0 p-0"
      />

      <!-- Top: viewport size badge (inside avatar) -->
      <div
        class="absolute left-[4%] right-[4%] top-2 z-40 flex justify-start pointer-events-none"
      >
        <span
          class="inline-flex max-w-full truncate text-white bg-primary/90 rounded-md px-2 py-1 text-[clamp(0.65rem,0.8vw,0.9rem)] leading-none shadow"
        >
          {{ viewportSize }}
        </span>
      </div>

      <!-- Middle: title overlay only in non bigMode -->
      <div
        v-if="!bigMode"
        class="absolute inset-y-0 left-[3%] right-[4%] z-40 flex items-center pointer-events-none"
      >
        <h1
          class="m-0 flex flex-wrap items-baseline gap-[0.35ch] font-bold tracking-tight leading-tight text-[clamp(0.9rem,5.2vh,2.75rem)]"
        >
          <span
            class="text-white bg-primary/90 rounded-md px-1 py-[0.125em] whitespace-nowrap"
          >
            Kind
          </span>
          <span
            class="text-white break-words pr-[0.25rem] drop-shadow-[0_1px_2px_rgba(0,0,0,0.55)]"
          >
            {{ page?.title || 'Robots' }}
          </span>
        </h1>
      </div>

      <!-- Bottom: subtitle badge (inside avatar) -->
      <div
        v-if="subtitle"
        class="absolute left-[4%] right-[4%] bottom-2 z-40 flex justify-start pointer-events-none"
      >
        <span
          class="inline-flex max-w-full truncate bg-base-100/90 text-black border border-black rounded-md px-2 py-1 text-[clamp(0.7rem,0.9vw,1rem)] leading-none shadow"
        >
          {{ subtitle }}
        </span>
      </div>
    </div>

    <!-- Center smart icons bar -->
    <div class="flex-1 min-w-0 h-full flex items-stretch z-0">
      <smart-icons class="h-full w-full" />
    </div>

    <!-- Right column smart toggles -->
    <div
      class="flex-none h-full z-0 flex items-stretch justify-end pr-1"
      :class="toggleColumnClasses"
    >
      <smart-toggles class="h-full w-full" />
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'
import { usePageStore } from '@/stores/pageStore'

const displayStore = useDisplayStore()
const pageStore = usePageStore()

const page = computed(() => pageStore.page)
const viewportSize = computed(() => displayStore.viewportSize)
const bigMode = computed(() => displayStore.bigMode)
const subtitle = computed(() => pageStore.page?.subtitle)

/**
 * Avatar column: never more than roughly 1/4 of the header width.
 * In bigMode we go a bit slimmer so the center panel has more room.
 */
const avatarColumnClasses = computed(() =>
  bigMode.value ? 'basis-[10%] max-w-[22%]' : 'basis-[12%] max-w-[25%]',
)

/**
 * Toggle column: slim on desktop, even slimmer in bigMode.
 * This keeps the vertical stack readable without bullying the center icons.
 */
const toggleColumnClasses = computed(() =>
  bigMode.value ? 'basis-[14%] max-w-[16%]' : 'basis-[17%] max-w-[20%]',
)
</script>
