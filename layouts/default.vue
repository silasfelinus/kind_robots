<!-- /layouts/default.vue -->
<template>
  <div
    class="flex h-dvh w-full flex-col overflow-hidden bg-base-100 text-base-content"
  >
    <section
      v-if="showHeader"
      class="relative flex-none w-full border-b border-base-300"
      :style="{ height: `calc(var(--vh, 1vh) * ${headerHeight})` }"
    >
      <span
        class="pointer-events-none absolute right-[0.65rem] top-[0.45rem] z-10 whitespace-nowrap rounded-full border border-base-content/10 bg-base-100/70 px-[0.42rem] py-[0.18rem] text-[0.58rem] font-black uppercase tracking-[0.22em] text-base-content/30 backdrop-blur-md"
      >
        Header
      </span>

      <button
        class="absolute right-[0.4rem] top-[0.4rem] z-20 flex h-[1.4rem] w-[1.4rem] items-center justify-center rounded-full border border-base-content/15 bg-base-100/70 text-[0.6rem] leading-none text-base-content/45 backdrop-blur-md transition hover:border-error/35 hover:bg-error/12 hover:text-error"
        title="Hide header"
        @click="displayStore.changeState('headerState', 'hidden')"
      >
        ✕
      </button>

      <div class="h-full w-full min-h-0">
        <slot name="header">
          <main-header />
        </slot>
      </div>
    </section>

    <button
      v-else
      class="flex h-5 w-full flex-none items-center justify-center border-y border-dashed border-base-content/15 bg-transparent text-[0.58rem] font-extrabold uppercase tracking-[0.16em] text-base-content/30 transition hover:bg-base-content/5 hover:text-base-content/65"
      @click="displayStore.changeState('headerState', 'open')"
    >
      + Header
    </button>

    <template v-if="isMobile">
      <main class="relative flex-1 min-h-0 w-full overflow-hidden">
        <span
          class="pointer-events-none absolute right-[0.65rem] top-[0.45rem] z-10 whitespace-nowrap rounded-full border border-base-content/10 bg-base-100/70 px-[0.42rem] py-[0.18rem] text-[0.58rem] font-black uppercase tracking-[0.22em] text-base-content/20 backdrop-blur-md"
        >
          {{ mobileRegionLabel }}
        </span>

        <div
          class="absolute left-[0.45rem] top-[0.45rem] z-20 flex gap-[0.35rem]"
        >
          <button
            class="rounded-full border border-base-content/15 bg-base-100/70 px-[0.55rem] py-[0.2rem] text-[0.58rem] font-extrabold uppercase tracking-[0.08em] text-base-content/45 backdrop-blur-md transition hover:bg-base-content/5 hover:text-base-content/70"
            :class="
              activeMobileRegion === 'left'
                ? 'border-primary/35 bg-primary/15 text-primary'
                : ''
            "
            @click="setMobileRegion('left')"
          >
            Left
          </button>

          <button
            class="rounded-full border border-base-content/15 bg-base-100/70 px-[0.55rem] py-[0.2rem] text-[0.58rem] font-extrabold uppercase tracking-[0.08em] text-base-content/45 backdrop-blur-md transition hover:bg-base-content/5 hover:text-base-content/70"
            :class="
              activeMobileRegion === 'center'
                ? 'border-primary/35 bg-primary/15 text-primary'
                : ''
            "
            @click="setMobileRegion('center')"
          >
            Main
          </button>

          <button
            class="rounded-full border border-base-content/15 bg-base-100/70 px-[0.55rem] py-[0.2rem] text-[0.58rem] font-extrabold uppercase tracking-[0.08em] text-base-content/45 backdrop-blur-md transition hover:bg-base-content/5 hover:text-base-content/70"
            :class="
              activeMobileRegion === 'right'
                ? 'border-primary/35 bg-primary/15 text-primary'
                : ''
            "
            @click="setMobileRegion('right')"
          >
            Right
          </button>
        </div>

        <transition name="mobile-panel" mode="out-in">
          <section
            :key="activeMobileRegion"
            class="h-full w-full min-h-0 overflow-y-auto overscroll-contain px-3 py-4"
          >
            <template v-if="activeMobileRegion === 'left'">
              <slot name="left">
                <left-sidebar />
              </slot>
            </template>

            <template v-else-if="activeMobileRegion === 'right'">
              <slot name="right">
                <right-sidebar />
              </slot>
            </template>

            <template v-else>
              <slot />
            </template>
          </section>
        </transition>
      </main>
    </template>

    <template v-else>
      <div class="flex flex-1 min-h-0 w-full overflow-hidden">
        <aside
          v-if="showLeftSidebar"
          class="relative flex-none h-full border-r border-base-300"
          :style="{ width: `${sidebarLeftWidth}vw` }"
        >
          <span
            class="pointer-events-none absolute left-2 top-1/2 z-10 -translate-y-1/2 -rotate-90 whitespace-nowrap rounded-full border border-base-content/10 bg-base-100/70 px-[0.42rem] py-[0.18rem] text-[0.58rem] font-black uppercase tracking-[0.22em] text-base-content/30 backdrop-blur-md"
          >
            Left
          </span>

          <button
            class="absolute right-[0.4rem] top-[0.4rem] z-20 flex h-[1.4rem] w-[1.4rem] items-center justify-center rounded-full border border-base-content/15 bg-base-100/70 text-[0.6rem] leading-none text-base-content/45 backdrop-blur-md transition hover:border-error/35 hover:bg-error/12 hover:text-error"
            title="Hide left sidebar"
            @click="displayStore.changeState('sidebarLeftState', 'hidden')"
          >
            ✕
          </button>

          <div class="h-full w-full min-h-0 overflow-y-auto">
            <slot name="left">
              <left-sidebar />
            </slot>
          </div>
        </aside>

        <button
          v-else
          class="flex h-full w-5 flex-none items-center justify-center border-x border-dashed border-base-content/15 bg-transparent text-[0.7rem] text-base-content/30 transition hover:bg-base-content/5 hover:text-base-content/65"
          @click="displayStore.changeState('sidebarLeftState', 'open')"
        >
          +
        </button>

        <main
          class="relative flex-1 min-w-0 h-full overflow-y-auto overscroll-contain"
        >
          <span
            class="pointer-events-none absolute right-[0.65rem] top-[0.45rem] z-10 whitespace-nowrap rounded-full border border-base-content/10 bg-base-100/70 px-[0.42rem] py-[0.18rem] text-[0.58rem] font-black uppercase tracking-[0.22em] text-base-content/20 backdrop-blur-md"
          >
            Main
          </span>

          <div class="h-full w-full min-h-0 px-4 py-4">
            <slot />
          </div>
        </main>

        <aside
          v-if="showRightSidebar"
          class="relative flex-none h-full border-l border-base-300"
          :style="{ width: `${sidebarRightWidth}vw` }"
        >
          <span
            class="pointer-events-none absolute right-2 top-1/2 z-10 -translate-y-1/2 rotate-90 whitespace-nowrap rounded-full border border-base-content/10 bg-base-100/70 px-[0.42rem] py-[0.18rem] text-[0.58rem] font-black uppercase tracking-[0.22em] text-base-content/30 backdrop-blur-md"
          >
            Right
          </span>

          <button
            class="absolute right-[0.4rem] top-[0.4rem] z-20 flex h-[1.4rem] w-[1.4rem] items-center justify-center rounded-full border border-base-content/15 bg-base-100/70 text-[0.6rem] leading-none text-base-content/45 backdrop-blur-md transition hover:border-error/35 hover:bg-error/12 hover:text-error"
            title="Hide right sidebar"
            @click="displayStore.changeState('sidebarRightState', 'hidden')"
          >
            ✕
          </button>

          <div class="h-full w-full min-h-0 overflow-y-auto">
            <slot name="right">
              <right-sidebar />
            </slot>
          </div>
        </aside>

        <button
          v-else
          class="flex h-full w-5 flex-none items-center justify-center border-x border-dashed border-base-content/15 bg-transparent text-[0.7rem] text-base-content/30 transition hover:bg-base-content/5 hover:text-base-content/65"
          @click="displayStore.changeState('sidebarRightState', 'open')"
        >
          +
        </button>
      </div>
    </template>

    <section
      v-if="showFooter"
      class="relative flex-none w-full border-t border-base-300"
      :style="{ height: `calc(var(--vh, 1vh) * ${footerHeight})` }"
    >
      <span
        class="pointer-events-none absolute right-[0.65rem] top-[0.45rem] z-10 whitespace-nowrap rounded-full border border-base-content/10 bg-base-100/70 px-[0.42rem] py-[0.18rem] text-[0.58rem] font-black uppercase tracking-[0.22em] text-base-content/30 backdrop-blur-md"
      >
        Footer
      </span>

      <button
        class="absolute right-[0.4rem] top-[0.4rem] z-20 flex h-[1.4rem] w-[1.4rem] items-center justify-center rounded-full border border-base-content/15 bg-base-100/70 text-[0.6rem] leading-none text-base-content/45 backdrop-blur-md transition hover:border-error/35 hover:bg-error/12 hover:text-error"
        title="Hide footer"
        @click="displayStore.changeState('footerState', 'hidden')"
      >
        ✕
      </button>

      <div class="h-full w-full min-h-0">
        <slot name="footer">
          <main-footer />
        </slot>
      </div>
    </section>

    <button
      v-else
      class="flex h-5 w-full flex-none items-center justify-center border-y border-dashed border-base-content/15 bg-transparent text-[0.58rem] font-extrabold uppercase tracking-[0.16em] text-base-content/30 transition hover:bg-base-content/5 hover:text-base-content/65"
      @click="displayStore.changeState('footerState', 'open')"
    >
      + Footer
    </button>
  </div>
</template>

<script setup lang="ts">
// /layouts/default.vue
import { computed } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'

const displayStore = useDisplayStore()

const isMobile = computed(() => displayStore.viewportSize === 'mobile')

const showHeader = computed(() => displayStore.headerState !== 'hidden')
const showFooter = computed(() => displayStore.footerState !== 'hidden')

const showLeftSidebar = computed(() =>
  ['open', 'compact'].includes(displayStore.sidebarLeftState),
)

const showRightSidebar = computed(() =>
  ['open', 'compact'].includes(displayStore.sidebarRightState),
)

const headerHeight = computed(() => displayStore.headerHeight)
const footerHeight = computed(() => displayStore.footerHeight)
const sidebarLeftWidth = computed(() => displayStore.sidebarLeftWidth)
const sidebarRightWidth = computed(() => displayStore.sidebarRightWidth)

const activeMobileRegion = computed<'left' | 'center' | 'right'>(() => {
  if (displayStore.showLeft) return 'left'
  if (displayStore.showRight) return 'right'
  return 'center'
})

const mobileRegionLabel = computed(() => {
  if (activeMobileRegion.value === 'left') return 'Left'
  if (activeMobileRegion.value === 'right') return 'Right'
  return 'Main'
})

function setMobileRegion(region: 'left' | 'center' | 'right') {
  displayStore.showLeft = region === 'left'
  displayStore.showCenter = region === 'center'
  displayStore.showRight = region === 'right'
  displayStore.saveState()
}
</script>

<style scoped>
.mobile-panel-enter-active,
.mobile-panel-leave-active {
  transition:
    opacity 0.18s ease,
    transform 0.18s ease;
}

.mobile-panel-enter-from {
  opacity: 0;
  transform: translateX(18px);
}

.mobile-panel-leave-to {
  opacity: 0;
  transform: translateX(-18px);
}
</style>
