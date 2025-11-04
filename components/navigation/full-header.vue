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

      <!-- Top: viewport size badge (admin only + bigMode) -->
      <div
        v-if="showViewportBadge"
        class="absolute left-[4%] right-[4%] top-2 z-40 flex justify-start pointer-events-none"
      >
        <span
          class="inline-flex max-w-full truncate text-white bg-primary/90 rounded-md px-2 py-1 text-[clamp(0.65rem,0.8vw,0.9rem)] leading-none shadow"
        >
          {{ viewportSize }}
        </span>
      </div>
    </div>

    <!-- Center smart icons bar -->
    <div class="flex-1 min-w-0 h-full flex items-stretch z-0">
      <smart-icons class="h-full w-full" />
    </div>

    <!-- Kind title column -->
    <div
      class="flex-none h-full flex items-center px-2 sm:px-3 lg:px-4 max-w-[30%]"
    >
      <h1
        class="m-0 flex flex-wrap items-baseline gap-[0.35ch] font-bold tracking-tight leading-tight text-[clamp(0.95rem,2.1vw,1.9rem)] text-base-content truncate"
      >
        <span class="whitespace-nowrap font-semibold">Kind</span>
        <span class="break-words pr-[0.25rem]">
          {{ page?.title || 'Robots' }}
        </span>
      </h1>
    </div>

    <!-- Right column smart toggles -->
    <div
      class="flex-none h-full z-0 flex items-stretch justify-end"
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
import { useUserStore } from '@/stores/userStore'

const displayStore = useDisplayStore()
const pageStore = usePageStore()
const userStore = useUserStore()

const page = computed(() => pageStore.page)
const viewportSize = computed(() => displayStore.viewportSize)
const bigMode = computed(() => displayStore.bigMode)

// only show viewport notice if admin + bigMode
const showViewportBadge = computed(() => {
  return bigMode.value && userStore.user?.Role === 'ADMIN'
})

/**
 * Avatar column: never more than roughly 1/4 of the header width.
 */
const avatarColumnClasses = computed(() =>
  bigMode.value ? 'basis-[10%] max-w-[22%]' : 'basis-[12%] max-w-[25%]',
)

/**
 * Toggle column: reasonably slim so icons can use the bar.
 */
const toggleColumnClasses = computed(() =>
  bigMode.value ? 'basis-[11%] max-w-[13%]' : 'basis-[13%] max-w-[15%]',
)
</script>
