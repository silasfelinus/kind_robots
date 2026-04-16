<!-- /components/navigation/full-header.vue -->
<template>
  <header
    ref="headerRoot"
    :key="headerKey"
    class="isolate flex h-full w-full items-stretch gap-0 overflow-x-hidden overflow-y-visible"
  >
    <button
      type="button"
      class="relative z-0 flex h-full shrink-0 flex-none pointer-events-auto overflow-hidden"
      :class="avatarColumnClasses"
      :title="avatarToggleTitle"
      @click="toggleHeaderCompact"
    >
      <avatar-image
        alt="User Avatar"
        class="m-0 block h-full w-full object-cover object-center p-0"
      />

      <div
        v-if="showViewportBadge"
        class="pointer-events-none absolute left-[4%] right-[4%] top-2 z-50 flex justify-start"
      >
        <span
          class="inline-flex max-w-full truncate rounded-md bg-primary/90 px-2 py-1 text-[clamp(0.7rem,1vw,1rem)] leading-none text-white shadow"
        >
          {{ viewportSize }}
        </span>
      </div>
    </button>

    <div
      v-if="hasHeaderContent"
      class="flex h-full min-w-0 flex-1 items-center px-1 py-0 md:px-2 lg:px-3 xl:px-4"
    >
      <div
        class="flex h-full w-full min-w-0 items-center justify-between lg:gap-3 xl:gap-4"
      >
        <template v-if="isCompactHeader">
          <div class="flex h-full w-full min-w-0 items-center gap-2 py-0">
            <span
              class="shrink-0 whitespace-nowrap font-extrabold tracking-tight leading-[1.05] sm:text-lg md:text-xl lg:text-2xl xl:text-4xl"
            >
              <span
                class="bg-linear-to-r from-primary via-secondary to-accent bg-clip-text text-transparent"
              >
                {{ displayTitle }}
              </span>
            </span>

            <div class="relative h-full min-w-0 flex-1">
              <smart-icons class="h-full w-full min-w-0 px-1" />
            </div>
          </div>
        </template>

        <template v-else>
          <div
            class="flex w-full min-w-0 flex-col items-start justify-center gap-1"
          >
            <span
              class="block w-full font-extrabold tracking-tight leading-tight text-lg md:text-2xl lg:text-3xl xl:text-4xl"
            >
              <span
                class="bg-linear-to-r from-primary via-secondary to-accent bg-clip-text text-transparent"
              >
                {{ displayTitle }}
              </span>
            </span>

            <span
              v-if="showSubtitle"
              class="block min-w-0 w-full truncate italic font-medium leading-snug text-base-content/90 text-sm md:text-lg lg:text-xl xl:text-2xl"
            >
              {{ subtitle }}
            </span>
          </div>

          <div
            class="flex h-full shrink-0 flex-nowrap items-center justify-end overflow-hidden basis-[28%] max-w-[32%] xl:basis-[34%] xl:max-w-[34%]"
          >
            <div
              class="flex h-full w-full items-center justify-end xl:justify-center"
            >
              <div
                class="grid h-full w-full grid-cols-4 grid-rows-1 place-items-center p-0"
              >
                <div class="flex h-full w-full items-center justify-center">
                  <div class="aspect-square h-[70%] w-auto max-h-full">
                    <login-icon class="h-full w-full text-primary" />
                  </div>
                </div>

                <div class="flex h-full w-full items-center justify-center">
                  <div class="aspect-square h-[70%] w-auto max-h-full">
                    <jellybean-icon class="h-full w-full text-secondary" />
                  </div>
                </div>

                <div class="flex h-full w-full items-center justify-center">
                  <div class="aspect-square h-[70%] w-auto max-h-full">
                    <theme-icon class="h-full w-full text-accent" />
                  </div>
                </div>

                <div class="flex h-full w-full items-center justify-center">
                  <div class="aspect-square h-[70%] w-auto max-h-full">
                    <swarm-icon class="h-full w-full text-info" />
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
const headerState = computed(() => displayStore.headerState)
const isCompactHeader = computed(() => headerState.value === 'compact')
const isOpenHeader = computed(() => headerState.value === 'open')

const subtitle = computed(() => page.value?.subtitle || '')
const showSubtitle = computed(() => isOpenHeader.value && !!subtitle.value)

const displayTitle = computed(() => {
  if (isCompactHeader.value) {
    return `Kind ${page.value?.title || ''}`.trim()
  }

  return 'Kind Robots'
})

const hasHeaderContent = computed(() => headerState.value !== 'hidden')
const showViewportBadge = computed(() => userStore.user?.Role === 'ADMIN')

const avatarColumnClasses = computed(() => {
  if (isCompactHeader.value) {
    return 'basis-[11%] max-w-[22%] xl:basis-[22%] xl:max-w-[60%]'
  }

  return 'basis-[13%] max-w-[25%] xl:basis-[26%] xl:max-w-[40%]'
})

const avatarToggleTitle = computed(() => {
  if (headerState.value === 'open') return 'Compact header'
  return 'Open header'
})

const headerKey = computed(() => {
  return [
    headerState.value,
    viewportSize.value,
    displayStore.sidebarLeftState,
    displayStore.sidebarRightState,
  ].join('-')
})

function toggleHeaderCompact() {
  if (displayStore.headerState === 'hidden') {
    displayStore.changeState('headerState', 'open')
    return
  }

  if (displayStore.headerState === 'open') {
    displayStore.changeState('headerState', 'compact')
    return
  }

  displayStore.changeState('headerState', 'open')
}

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
  if (!ro) return
  ro.disconnect()
  ro = null
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
    headerState.value,
    viewportSize.value,
    displayStore.sidebarLeftState,
    displayStore.sidebarRightState,
  ],
  async () => {
    await nextTick()
    fireHeaderResized()
  },
  { flush: 'post' },
)
</script>
