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
      <div class="w-full flex flex-col gap-2 md:gap-2.5 lg:gap-3">
        <div class="flex flex-col gap-0.5 md:gap-1">
          <span
            class="text-[clamp(0.75rem,1vw,1rem)] font-semibold tracking-[0.24em] uppercase text-base-content/70"
          >
            <span
              class="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent"
            >
              Kind Robots
            </span>
          </span>

          <p
            class="text-[clamp(0.9rem,1.4vw,1.15rem)] text-base-content/85 leading-snug"
          >
            {{ roomSubtitle }}
          </p>
        </div>

        <div
          class="flex items-center justify-between gap-2 md:gap-3 lg:gap-4"
        >
          <span
            class="text-[clamp(1.05rem,1.9vw,1.5rem)] font-bold tracking-tight text-base-content"
          >
            Kind {{ pageTitle }}
          </span>

          <div class="flex items-center justify-end gap-1.5 md:gap-2 min-w-0">
            <div v-if="bigMode" class="w-full max-w-full">
              <smart-icons />
            </div>

            <div
              v-else
              class="flex items-center justify-end gap-1.5 md:gap-2 w-full max-w-full"
            >
              <div
                v-for="icon in utilityIcons"
                :key="icon.name"
                class="flex-1 min-w-0 flex justify-center"
              >
                <component :is="icon.component" :compact="compact" />
              </div>
            </div>
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
import { useIconStore } from '@/stores/iconStore'

const displayStore = useDisplayStore()
const pageStore = usePageStore()
const userStore = useUserStore()
const iconStore = useIconStore()

const page = computed(() => pageStore.page)
const viewportSize = computed(() => displayStore.viewportSize)
const bigMode = computed(() => displayStore.bigMode)

const pageTitle = computed(() => page.value?.title || 'Robots')
const roomSubtitle = computed(() => `The ${pageTitle.value} room`)

const hasHeaderContent = computed(() => Boolean(pageTitle.value))

const showViewportBadge = computed(() => {
  return userStore.user?.Role === 'ADMIN' && bigMode.value
})

const avatarColumnClasses = computed(() =>
  bigMode.value ? 'basis-[11%] max-w-[22%]' : 'basis-[13%] max-w-[25%]',
)

const utilityIcons = computed(() => iconStore.utilityIcons || [])
const compact = computed(() => !bigMode.value)
</script>