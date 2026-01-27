<!-- /components/navigation/full-header.vue -->
<template>
  <header
    ref="headerRoot"
    :key="headerKey"
    class="w-full h-full flex items-stretch gap-0 overflow-x-hidden overflow-y-visible [isolation:isolate]"
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
      class="flex-1 h-full flex items-center px-1 md:px-2 lg:px-3 xl:px-4 py-0 min-w-0"
    >
      <div
        class="w-full flex items-center justify-between lg:gap-3 xl:gap-4 min-w-0"
      >
        <template v-if="bigMode">
          <div class="flex items-stretch gap-2 w-full min-w-0 h-full py-0">
            <span
              class="whitespace-nowrap font-extrabold tracking-tight leading-[1.05] sm:text-lg md:text-xl lg:text-2xl xl:text-4xl"
            >
              <span
                class="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent"
              >
                {{ displayTitle }}
              </span>
            </span>
            <div class="relative flex-1 min-w-0 h-full">
              <smart-icons class="h-full w-full min-w-0 px-1" />
            </div>
          </div>
        </template>

        <template v-else>
          <div
            class="min-w-0 w-full flex flex-col items-start justify-center gap-1"
          >
            <span
              class="block w-full font-extrabold tracking-tight leading-tight text-lg md:text-2xl lg:text-3xl xl:text-4xl"
            >
              <span
                class="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent"
              >
                {{ displayTitle }}
              </span>
            </span>

            <span
              v-if="showSubtitle"
              class="block w-full truncate min-w-0 italic font-medium leading-snug text-base-content/90 text-sm md:text-lg lg:text-xl xl:text-2xl"
            >
              {{ subtitle }}
            </span>
          </div>

          <div
            class="flex items-center justify-end flex-nowrap shrink-0"
            :class="[
              bigMode
                ? 'basis-auto max-w-none'
                : 'basis-[28%] max-w-[32%] h-full xl:basis-[34%] xl:max-w-[34%]',
            ]"
          >
            <div
              class="flex w-full h-full items-center justify-end xl:justify-center"
            >
              <div
                class="grid grid-cols-2 grid-rows-2 xl:grid-cols-4 xl:grid-rows-1 place-items-center w-full h-full gap-1 md:gap-1.5 lg:gap-2 p-0"
              >
                <div class="w-full h-full flex items-center justify-center">
                  <div class="aspect-square h-[70%] w-auto max-h-full">
                    <login-icon class="w-full h-full text-primary" />
                  </div>
                </div>

                <div class="w-full h-full flex items-center justify-center">
                  <div class="aspect-square h-[70%] w-auto max-h-full">
                    <jellybean-icon class="w-full h-full text-secondary" />
                  </div>
                </div>

                <div class="w-full h-full flex items-center justify-center">
                  <div class="aspect-square h-[70%] w-auto max-h-full">
                    <theme-icon class="w-full h-full text-accent" />
                  </div>
                </div>

                <div class="w-full h-full flex items-center justify-center">
                  <div class="aspect-square h-[70%] w-auto max-h-full">
                    <swarm-icon class="w-full h-full text-info" />
                  </div>
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
import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'
import { usePageStore } from '@/stores/pageStore'
import { useUserStore } from '@/stores/userStore'

const displayStore = useDisplayStore()
const pageStore = usePageStore()
const userStore = useUserStore()

const headerRoot = ref<HTMLElement | null>(null)
let ro: ResizeObserver | null = null

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
  bigMode.value
    ? 'basis-[11%] max-w-[22%] xl:basis-[22%] xl:max-w-[60%]'
    : 'basis-[13%] max-w-[25%] xl:basis-[26%] xl:max-w-[40%]',
)

const headerKey = computed(
  () =>
    `${bigMode.value}-${viewportSize.value}-${displayStore.sidebarRightState}-${displayStore.headerState}-${displayStore.showCorner}`,
)

function fireHeaderResized() {
  window.dispatchEvent(new CustomEvent('kr:header-resized'))
}

function attachObserver() {
  if (!headerRoot.value) return
  ro = new ResizeObserver(() => {
    fireHeaderResized()
  })
  ro.observe(headerRoot.value)
}

function detachObserver() {
  if (ro) {
    ro.disconnect()
    ro = null
  }
}

onMounted(() => {
  attachObserver()
  nextTick(fireHeaderResized)
})

onBeforeUnmount(() => {
  detachObserver()
})

watch(
  () => [
    bigMode.value,
    viewportSize.value,
    displayStore.sidebarRightState,
    displayStore.headerState,
    displayStore.showCorner,
  ],
  async () => {
    await nextTick()
    fireHeaderResized()
  },
  { flush: 'post' },
)
</script>
