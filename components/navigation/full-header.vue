<!-- /components/content/navigation/full-header.vue -->
<template>
  <header
    class="w-full h-full flex items-stretch gap-0 overflow-hidden [isolation:isolate]"
  >
    <div
      class="relative flex-none h-full shrink-0 z-0 pointer-events-auto flex"
      :class="avatarColumnClasses"
    >
      <avatar-image
        alt="User Avatar"
        class="block w-full h-full object-cover object-center m-0 p-0"
      />

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

    <div
      v-if="hasHeaderContent"
      class="flex-1 h-full flex items-center px-2 sm:px-4 lg:px-6"
    >
      <div class="w-full flex flex-col gap-1.5 md:gap-2 lg:gap-2.5">
        <span
          class="text-[clamp(0.7rem,0.9vw,0.95rem)] font-semibold tracking-[0.24em] uppercase text-base-content/60"
        >
          {{ brandLine }}
        </span>

        <h1
          class="text-[clamp(1.25rem,2.4vw,2.1rem)] md:text-[clamp(1.5rem,2.7vw,2.3rem)] font-extrabold leading-tight"
        >
          <span
            class="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent"
          >
            {{ pageTitle }}
          </span>
        </h1>

        <p
          class="text-[clamp(0.85rem,1.3vw,1.1rem)] text-base-content/80 leading-snug"
        >
          {{ roomSubtitle }}
        </p>

        <div v-if="bigMode" class="mt-1 md:mt-1.5 lg:mt-2">
          <smart-icons />
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
// /components/content/navigation/full-header.vue
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

const pageTitle = computed(() => page.value?.title || 'Robots')
const brandLine = computed(() => `Kind ${pageTitle.value}`)
const roomSubtitle = computed(() => `The ${pageTitle.value} room`)

const hasHeaderContent = computed(() => Boolean(pageTitle.value))

const showViewportBadge = computed(() => {
  return userStore.user?.Role === 'ADMIN' && bigMode.value
})

const avatarColumnClasses = computed(() =>
  bigMode.value ? 'basis-[11%] max-w-[22%]' : 'basis-[13%] max-w-[25%]',
)
</script>
