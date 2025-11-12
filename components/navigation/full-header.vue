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
      <div
        class="w-full flex items-center justify-between gap-2 sm:gap-3 lg:gap-4"
      >
        <div
          class="flex min-w-0 gap-2 sm:gap-3"
          :class="
            isExtraLarge
              ? 'flex-col items-start'
              : 'flex-row items-center flex-wrap'
          "
        >
          <span
            class="text-[clamp(1.1rem,1.9vw,1.6rem)] font-extrabold tracking-tight whitespace-nowrap"
          >
            <span
              class="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent"
            >
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
          class="flex items-center justify-end gap-1 md:gap-2 flex-nowrap shrink-0"
        >
          <div v-if="bigMode" class="w-full max-w-full">
            <smart-icons />
          </div>

          <div
            v-else
            class="grid grid-cols-2 grid-rows-2 gap-1 md:gap-1.5 aspect-square max-h-[3rem] sm:max-h-[3.25rem] md:max-h-[3.5rem] lg:max-h-[3.75rem] xl:max-h-[4rem]"
          >
            <icon-display
              v-for="icon in utilityIcons"
              :key="icon.id"
              :icon="icon"
              class="w-full h-full"
            />
          </div>
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
import { useSmartbarStore } from '@/stores/smartbarStore'
import type { SmartIcon } from '@/stores/smartbarStore'

const displayStore = useDisplayStore()
const pageStore = usePageStore()
const userStore = useUserStore()
const smartbarStore = useSmartbarStore()

const page = computed(() => pageStore.page)
const viewportSize = computed(() => displayStore.viewportSize)
const bigMode = computed(() => displayStore.bigMode)
const isExtraLarge = computed(() => displayStore.viewportSize === 'extraLarge')

const subtitle = computed(() => page.value?.subtitle || '')
const hasHeaderContent = computed(() => true)

const showViewportBadge = computed(() => {
  return userStore.user?.Role === 'ADMIN' && bigMode.value
})

const avatarColumnClasses = computed(() =>
  bigMode.value ? 'basis-[11%] max-w-[22%]' : 'basis-[13%] max-w-[25%]',
)

const utilityIcons = computed<SmartIcon[]>(() =>
  smartbarStore.activeIcons
    .filter((icon) => icon.type === 'utility')
    .slice(0, 4),
)
</script>