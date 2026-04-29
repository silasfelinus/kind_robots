<!-- /layouts/default.vue -->
<template>
  <div class="flex min-h-dvh w-full flex-col overflow-hidden bg-base-200">
    <header
      class="fixed overflow-hidden border-b-2 border-primary-focus text-primary-content transition-[height,width,left,top] duration-200"
      :style="displayStore.headerStyle"
    >
      <slot name="header">
        <full-header />
      </slot>
    </header>

    <div
      v-if="displayStore.headerState === 'hidden'"
      class="pointer-events-none fixed left-3 top-3 z-30"
    >
      <button
        ref="headerToggleRef"
        type="button"
        class="pointer-events-auto rounded-full bg-base-100/90 px-3 py-2 shadow hover:scale-105 active:scale-95"
        @click="displayStore.toggleHeader('open')"
      >
        <Icon name="kind-icon:chevron-down" class="h-5 w-5" />
      </button>
    </div>

    <corner-panel
      v-if="displayStore.showCornerPanel"
      class="pointer-events-auto fixed"
      :style="displayStore.cornerPanelStyle"
    />

    <aside
      class="fixed overflow-visible transition-all duration-200"
      :style="displayStore.leftSidebarStyle"
    >
      <div class="h-full overflow-y-auto">
        <slot name="left">
          <splash-tutorial />
        </slot>
      </div>
    </aside>

    <aside
      class="fixed overflow-visible transition-all duration-200"
      :style="displayStore.rightSidebarStyle"
    >
      <div class="h-full overflow-y-auto">
        <slot name="right">
          <gallery-gallery />
        </slot>
      </div>
    </aside>

    <template v-if="displayStore.sidebarLeftVisible">
      <button
        :style="displayStore.leftSidebarBackToggleStyle"
        class="btn btn-circle btn-xs"
        @click="displayStore.toggleLeftSidebar('backward')"
      >
        <Icon name="kind-icon:chevron-left" class="h-4 w-4" />
      </button>

      <button
        :style="displayStore.leftSidebarForwardToggleStyle"
        class="btn btn-circle btn-xs"
        @click="displayStore.toggleLeftSidebar('forward')"
      >
        <Icon name="kind-icon:chevron-right" class="h-4 w-4" />
      </button>
    </template>

    <template v-if="displayStore.sidebarRightVisible">
      <button
        :style="displayStore.rightSidebarBackToggleStyle"
        class="btn btn-circle btn-xs"
        @click="displayStore.toggleRightSidebar('backward')"
      >
        <Icon name="kind-icon:chevron-right" class="h-4 w-4" />
      </button>

      <button
        :style="displayStore.rightSidebarForwardToggleStyle"
        class="btn btn-circle btn-xs"
        @click="displayStore.toggleRightSidebar('forward')"
      >
        <Icon name="kind-icon:chevron-left" class="h-4 w-4" />
      </button>
    </template>

    <main
      class="fixed overflow-hidden border border-base-300/60 bg-base-200 transition-all duration-200"
      :style="displayStore.mainContentStyle"
    >
      <div class="absolute inset-0 overflow-y-auto px-4 pb-4">
        <slot />
      </div>
    </main>

    <footer
      class="fixed overflow-hidden bg-base-200 transition-all duration-200"
      :style="displayStore.footerStyle"
    >
      <div class="absolute inset-0 overflow-hidden" :style="footerInnerStyle">
        <slot name="footer">
          <footer-selector />
        </slot>
      </div>
    </footer>

    <div
      class="pointer-events-none fixed p-0.5"
      :style="displayStore.leftCornerToggleStyle"
    >
      <button
        class="pointer-events-auto flex h-full w-full items-center justify-center rounded-2xl bg-base-100 shadow transition hover:scale-105 active:scale-95"
        @click="displayStore.toggleLeftSidebar('forward')"
      >
        <Icon name="kind-icon:sidebar-left" class="h-5 w-5" />
      </button>
    </div>

    <div
      class="pointer-events-none fixed p-0.5"
      :style="displayStore.leftFooterToggleStyle"
    >
      <button
        class="pointer-events-auto flex h-full w-full items-center justify-center rounded-2xl bg-base-100 shadow transition hover:scale-105 active:scale-95"
        @click="showPreviousFooter"
      >
        <Icon name="kind-icon:chevron-left" class="h-5 w-5" />
      </button>
    </div>

    <div
      class="pointer-events-none fixed"
      :style="displayStore.footerToggleStyle"
    >
      <button
        class="pointer-events-auto flex h-full w-full items-center justify-center rounded-full bg-base-100 shadow transition hover:scale-105 active:scale-95"
        @click="displayStore.toggleFooter"
      >
        <Icon name="kind-icon:chevron-up" class="h-4 w-4" />
      </button>
    </div>

    <div
      class="pointer-events-none fixed p-0.5"
      :style="displayStore.rightFooterToggleStyle"
    >
      <button
        class="pointer-events-auto flex h-full w-full items-center justify-center rounded-2xl bg-base-100 shadow transition hover:scale-105 active:scale-95"
        @click="showNextFooter"
      >
        <Icon name="kind-icon:chevron-right" class="h-5 w-5" />
      </button>
    </div>

    <div
      class="pointer-events-none fixed p-0.5"
      :style="displayStore.rightCornerToggleStyle"
    >
      <button
        class="pointer-events-auto flex h-full w-full items-center justify-center rounded-2xl bg-base-100 shadow transition hover:scale-105 active:scale-95"
        @click="displayStore.toggleRightSidebar('forward')"
      >
        <Icon name="kind-icon:sidebar-right" class="h-5 w-5" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDisplayStore } from '@/stores/displayStore'
import { useNavStore } from '@/stores/navStore'

const route = useRoute()
const router = useRouter()
const displayStore = useDisplayStore()
const navStore = useNavStore()

type FooterName = (typeof displayStore.footerComponentNames)[number]

const footerOptions = [...displayStore.footerComponentNames] as FooterName[]

const footerRouteMap: Record<FooterName, string> = {
  fx: '/butterflies',
  kind: '/bots',
  art: '/addart',
  story: '/stories',
  theme: '/themes',
  user: '/dashboard',
  lab: '/wonderlab',
  brainstorm: '/brainstorm',
  giftshop: '/giftshop',
}

const footerInnerStyle = computed(() => {
  if (!displayStore.footerContentVisible) return { padding: '0' }

  return {
    padding: '0.5rem',
  }
})

function getWrappedFooter(step: -1 | 1): FooterName {
  const current = displayStore.footerComponent
  const index = footerOptions.indexOf(current)
  const next = (index + step + footerOptions.length) % footerOptions.length
  return footerOptions[next] ?? 'kind'
}

function setFooter(name: FooterName) {
  displayStore.setFooterComponent(name)
  navStore.setFooterDashboardTab(name)

  const routePath = footerRouteMap[name]

  if (routePath && route.path !== routePath) {
    router.push(routePath)
  }
}

function showPreviousFooter() {
  setFooter(getWrappedFooter(-1))
}

function showNextFooter() {
  setFooter(getWrappedFooter(1))
}
</script>