<!-- /components/navigation/full-header.vue -->
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
        class="absolute left-[4%] right-[4%] top-2 z-50 flex justify-start pointer-events-none"
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
      class="flex-1 h-full flex items-center px-1 md:px-2 lg:px-3 xl:px-4"
    >
      <div class="w-full flex items-center justify-between lg:gap-3 xl:gap-4">
        <div
          class="min-w-0 w-full grid grid-cols-2 items-center gap-1 lg:flex lg:flex-row lg:items-center lg:gap-2"
        >
          <span
            class="whitespace-nowrap font-extrabold tracking-tight text-[clamp(1.1rem,2.2vw,1.6rem)] lg:text-[clamp(1.8rem,3.4vw,2.8rem)] xl:text-[clamp(2.2rem,3.8vw,3.2rem)]"
          >
            <span
              class="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent"
            >
              {{ displayTitle }}
            </span>
          </span>

          <span
            v-if="showSubtitle"
            class="truncate min-w-0 text-base-content/85 text-[clamp(0.9rem,1.6vw,1.1rem)] lg:text-[clamp(1.2rem,2.0vw,1.4rem)]"
          >
            {{ subtitle }}
          </span>
        </div>

        <div
          class="flex items-center justify-end flex-nowrap shrink-0"
          :class="
            bigMode ? 'basis-auto max-w-none' : 'basis-[20%] max-w-[20%] h-full'
          "
        >
          <div v-if="bigMode" class="w-full max-w-full">
            <smart-icons />
          </div>

          <div v-else class="flex w-full h-full items-center justify-end">
            <div
              class="grid grid-cols-2 grid-rows-2 place-items-stretch w-full h-full gap-1 md:gap-2 lg:gap-3"
            >
              <div class="w-full h-full flex items-center justify-center">
                <login-icon class="w-[45%] h-[45%] text-primary" />
              </div>
              <div class="w-full h-full flex items-center justify-center">
                <jellybean-icon class="w-[45%] h-[45%] text-secondary" />
              </div>
              <div class="w-full h-full flex items-center justify-center">
                <theme-icon class="w-[45%] h-[45%] text-accent" />
              </div>
              <div class="w-full h-full flex items-center justify-center">
                <swarm-icon class="w-[45%] h-[45%] text-info" />
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

const subtitle = computed(() => page.value?.subtitle || '')
const showSubtitle = computed(() => !bigMode.value && !!subtitle.value)

const displayTitle = computed(() =>
  bigMode.value ? `Kind ${page.value?.title || ''}` : 'Kind Robots',
)

const hasHeaderContent = computed(() => true)
const showViewportBadge = computed(() => userStore.user?.Role === 'ADMIN')

const avatarColumnClasses = computed(() =>
  bigMode.value ? 'basis-[11%] max-w-[22%]' : 'basis-[13%] max-w-[25%]',
)
</script>
