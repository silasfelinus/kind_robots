<!-- /components/content/navigation/full-header.vue -->
<template>
  <header
    ref="rootRef"
    class="relative w-full h-full flex items-stretch gap-0 overflow-hidden [isolation:isolate]"
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
          class="flex min-w-0 gap-1"
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
          class="relative flex items-center justify-end flex-nowrap shrink-0"
          :class="
            bigMode
              ? 'basis-auto max-w-none'
              : 'basis-[20%] max-w-[20%] h-full pr-1 sm:pr-2'
          "
        >
          <div v-if="bigMode" class="w-full max-w-full">
            <smart-icons />
          </div>

          <div v-else class="relative w-full h-full">
            <div
              v-if="useFixedUtilityBox"
              class="absolute right-0 top-1/2 -translate-y-1/2 w-[8%] h-[40%] grid grid-cols-2 grid-rows-2 place-items-center bg-base-200/70 border border-base-300 rounded-xl shadow-inner backdrop-blur-[1px]"
            >
              <div class="flex items-center justify-center">
                <login-icon class="w-[70%] h-[70%] text-primary" />
              </div>
              <div class="flex items-center justify-center">
                <jellybean-icon class="w-[70%] h-[70%] text-secondary" />
              </div>
              <div class="flex items-center justify-center">
                <theme-icon class="w-[70%] h-[70%] text-accent" />
              </div>
              <div class="flex items-center justify-center">
                <swarm-icon class="w-[70%] h-[70%] text-info" />
              </div>
            </div>

            <div
              v-else
              class="grid grid-cols-2 grid-rows-2 w-full h-full place-items-center gap-x-[4%] gap-y-[6%] bg-base-200/60 border border-base-300 rounded-xl shadow-inner"
            >
              <div class="flex items-center justify-center">
                <login-icon class="w-[40%] h-[40%] text-primary" />
              </div>
              <div class="flex items-center justify-center">
                <jellybean-icon class="w-[40%] h-[40%] text-secondary" />
              </div>
              <div class="flex items-center justify-center">
                <theme-icon class="w-[40%] h-[40%] text-accent" />
              </div>
              <div class="flex items-center justify-center">
                <swarm-icon class="w-[40%] h-[40%] text-info" />
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
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
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
const showViewportBadge = computed(
  () => userStore.user?.Role === 'ADMIN' && bigMode.value,
)
const avatarColumnClasses = computed(() =>
  bigMode.value ? 'basis-[11%] max-w-[22%]' : 'basis-[13%] max-w-[25%]',
)

const rootRef = ref<HTMLElement | null>(null)
const useFixedUtilityBox = ref(true)

let ro: ResizeObserver | null = null

onMounted(() => {
  if (!rootRef.value) return
  ro = new ResizeObserver((entries) => {
    const entry = entries[0]
    if (!entry) return
    const w = entry.contentRect.width
    const h = entry.contentRect.height
    const boxW = w * 0.04
    const boxH = h * 0.4
    useFixedUtilityBox.value = boxW >= 120 && boxH >= 140
  })
  ro.observe(rootRef.value)
})

onBeforeUnmount(() => {
  ro?.disconnect()
  ro = null
})
</script>
