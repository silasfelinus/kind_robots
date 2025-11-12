<!-- /components/navigation/full-header.vue -->
<template>
  <header
    class="w-full h-full flex items-stretch gap-0 overflow-x-visible overflow-y-hidden [isolation:isolate]"
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
          class="inline-flex max-w-full truncate text-white bg-primary/90 rounded-md px-2 py-1 text-[clamp(0.7rem,1vw,1rem)] leading-none shadow"
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
        <template v-if="bigMode">
          <div class="flex items-center gap-2 min-w-0 w-full">
            <span
              class="whitespace-nowrap font-extrabold tracking-tight text-[clamp(2.2rem,6vw,4rem)] xl:text-[clamp(2.6rem,6.5vw,4.5rem)]"
            >
              <span
                class="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent"
              >
                {{ displayTitle }}
              </span>
            </span>

            <div class="relative flex-1 min-w-0 h-full">
              <div
                class="h-full w-full overflow-x-auto overflow-y-visible overscroll-x-contain whitespace-nowrap [scrollbar-gutter:stable]"
              >
                <smart-icons class="min-w-max h-full px-1 inline-flex" />
              </div>
            </div>
          </div>
        </template>

        <template v-else>
          <div
            class="min-w-0 w-full flex flex-col items-start justify-center gap-[2px]"
          >
            <span
              class="block w-full font-extrabold tracking-tight text-[clamp(2.2rem,6vw,3rem)]"
            >
              <span
                class="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent"
              >
                {{ displayTitle }}
              </span>
            </span>

            <span
              v-if="showSubtitle"
              class="block w-full truncate min-w-0 italic font-medium leading-tight text-base-content/90 text-[clamp(1rem,3.2vw,1.25rem)]"
            >
              {{ subtitle }}
            </span>
          </div>

          <div
            class="flex items-center justify-end flex-nowrap shrink-0"
            :class="[
              bigMode
                ? 'basis-auto max-w-none'
                : 'basis-[22%] max-w-[22%] h-full xl:basis-[38%] xl:max-w-[38%]',
            ]"
          >
            <div
              class="flex w-full h-full items-center justify-end xl:justify-center"
            >
              <div
                class="grid grid-cols-2 grid-rows-2 xl:grid-cols-4 xl:grid-rows-1 place-items-center w-full h-full gap-1 md:gap-1.5 lg:gap-2 p-1"
              >
                <div class="w-full h-full flex items-center justify-center">
                  <login-icon
                    class="shrink-0 w-[clamp(1.75rem,2.6vw,3rem)] h-[clamp(1.75rem,2.6vw,3rem)] text-primary"
                  />
                </div>
                <div class="w-full h-full flex items-center justify-center">
                  <jellybean-icon
                    class="shrink-0 w-[clamp(1.75rem,2.6vw,3rem)] h-[clamp(1.75rem,2.6vw,3rem)] text-secondary"
                  />
                </div>
                <div class="w-full h-full flex items-center justify-center">
                  <theme-icon
                    class="shrink-0 w-[clamp(1.75rem,2.6vw,3rem)] h-[clamp(1.75rem,2.6vw,3rem)] text-accent"
                  />
                </div>
                <div class="w-full h-full flex items-center justify-center">
                  <swarm-icon
                    class="shrink-0 w-[clamp(1.75rem,2.6vw,3rem)] h-[clamp(1.75rem,2.6vw,3rem)] text-info"
                  />
                </div>
              </div>
            </div>
          </div>
        </template>
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
