<!-- /components/navigation/full-header.vue -->
<template>
  <header class="w-full h-full flex items-stretch gap-0 overflow-hidden [isolation:isolate]">
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
        class="absolute left-[4%] right-[4%] top-2 z-50 flex justify-start pointer-events-none"
      >
        <span
          class="inline-flex max-w-full truncate text-white bg-primary/90 rounded-md px-2 py-1 text-[clamp(0.65rem,0.8vw,0.9rem)] leading-none shadow"
        >
          {{ viewportSize }}
        </span>
      </div>
    </div>

    <div v-if="hasHeaderContent" class="flex-1 h-full flex items-center px-1 md:px-2 lg:px-3 xl:px-4">
      <div class="w-full flex items-center justify-between lg:gap-3 xl:gap-4">
        <div
          class="flex min-w-0 gap-1"
          :class="isExtraLarge ? 'flex-col items-start' : 'flex-row items-center flex-wrap'"
        >
          <span class="text-[clamp(1.1rem,1.9vw,1.6rem)] font-extrabold tracking-tight whitespace-nowrap">
            <span class="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              Kind Robots
            </span>
          </span>

          <span
            v-if="subtitle"
            class="text-[clamp(0.9rem,1.4vw,1.1rem)] text-base-content/85 leading-snug truncate min-w-0"
          >
            {{ subtitle }}
          </span>
        </div>

        <div
          class="flex items-center justify-end flex-nowrap shrink-0"
          :class="bigMode ? 'basis-auto max-w-none' : 'basis-[20%] max-w-[20%] h-full pr-1 sm:pr-2'"
        >
          <div v-if="bigMode" class="w-full max-w-full">
            <smart-icons />
          </div>

          <div v-else class="flex w-full h-full items-center justify-end">
            <div
              class="grid grid-cols-2 grid-rows-2 place-items-center
                     w-full h-full rounded-2xl border border-base-300 bg-base-200/70 shadow-inner
                     p-1 sm:p-2 md:p-3 lg:p-4 gap-1 sm:gap-2 md:gap-3"
            >
              <div class="flex items-center justify-center">
                <login-icon
                  class="w-[46%] h-[46%] sm:w-[52%] sm:h-[52%] md:w-[58%] md:h-[58%] lg:w-[62%] lg:h-[62%] text-primary"
                />
              </div>
              <div class="flex items-center justify-center">
                <jellybean-icon
                  class="w-[46%] h-[46%] sm:w-[52%] sm:h-[52%] md:w-[58%] md:h-[58%] lg:w-[62%] lg:h-[62%] text-secondary"
                />
              </div>
              <div class="flex items-center justify-center">
                <theme-icon
                  class="w-[46%] h-[46%] text-accent"
                />
              </div>
              <div class="flex items-center justify-center">
                <swarm-icon
                  class="w-[46%] h-[46%] text-info"
                />
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
// /components/navigation/full-header.vue
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
const isExtraLarge = computed(() => displayStore.viewportSize === 'extraLarge')

const subtitle = computed(() => page.value?.subtitle || '')
const hasHeaderContent = computed(() => true)

const showViewportBadge = computed(() => userStore.user?.Role === 'ADMIN')

const avatarColumnClasses = computed(() =>
  bigMode.value ? 'basis-[11%] max-w-[22%]' : 'basis-[13%] max-w-[25%]',
)
</script>