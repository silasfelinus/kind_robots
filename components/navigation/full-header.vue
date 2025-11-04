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

    <!-- Kind title column -->
    <div
      class="flex-none h-full flex items-center px-2 sm:px-3 lg:px-4 max-w-[30%]"
    >
      <div
        class="inline-flex max-w-full items-center gap-2 rounded-2xl border border-base-content/10 bg-base-100/80 px-3 py-1.5 sm:px-4 sm:py-2 shadow-sm backdrop-blur-sm"
      >
        <!-- Kind pill -->
        <span
          class="inline-flex items-center justify-center rounded-full bg-primary/90 px-2 py-[0.1rem] text-[0.6rem] sm:text-[0.7rem] font-semibold tracking-wide uppercase text-primary-content whitespace-nowrap"
        >
          Kind
        </span>

        <!-- Title + optional subtitle -->
        <div class="flex flex-col min-w-0">
          <span
            class="truncate font-semibold leading-tight text-[clamp(0.85rem,1.7vw,1.25rem)] text-base-content drop-shadow-sm"
          >
            {{ page?.title || 'Robots' }}
          </span>
          <span
            v-if="subtitle"
            class="truncate text-[0.65rem] sm:text-[0.75rem] text-base-content/70"
          >
            {{ subtitle }}
          </span>
        </div>
      </div>
    </div>

    <!-- Center smart icons bar -->
    <div class="flex-1 min-w-0 h-full flex items-stretch z-0">
      <smart-icons class="h-full w-full" />
    </div>

    <!-- Right column smart toggles (no fixed width, hugs content) -->
    <div class="flex-none h-full z-0 flex items-center px-1">
      <smart-toggles />
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
const subtitle = computed(() => pageStore.page?.subtitle)

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
</script>
