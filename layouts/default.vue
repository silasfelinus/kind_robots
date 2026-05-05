<!-- /layouts/default.vue -->
<template>
  <div class="flex min-h-dvh w-full flex-col overflow-hidden bg-base-200">
    <header class="fixed overflow-hidden" :style="displayStore.headerStyle">
      <slot name="header">
        <full-header />
      </slot>
    </header>

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
        aria-label="Reduce left sidebar"
        @click="displayStore.toggleLeftSidebar('backward')"
      >
        <Icon name="kind-icon:chevron-left" class="h-4 w-4" />
      </button>

      <button
        :style="displayStore.leftSidebarForwardToggleStyle"
        class="btn btn-circle btn-xs"
        aria-label="Expand left sidebar"
        @click="displayStore.toggleLeftSidebar('forward')"
      >
        <Icon name="kind-icon:chevron-right" class="h-4 w-4" />
      </button>
    </template>

    <template v-if="displayStore.sidebarRightVisible">
      <button
        :style="displayStore.rightSidebarBackToggleStyle"
        class="btn btn-circle btn-xs"
        aria-label="Reduce right sidebar"
        @click="displayStore.toggleRightSidebar('backward')"
      >
        <Icon name="kind-icon:chevron-right" class="h-4 w-4" />
      </button>

      <button
        :style="displayStore.rightSidebarForwardToggleStyle"
        class="btn btn-circle btn-xs"
        aria-label="Expand right sidebar"
        @click="displayStore.toggleRightSidebar('forward')"
      >
        <Icon name="kind-icon:chevron-left" class="h-4 w-4" />
      </button>
    </template>

    <main
      class="fixed overflow-hidden bg-base-200 transition-all duration-200"
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

    <template v-if="displayStore.bottomControlRowVisible">
      <div
        v-for="(control, index) in bottomControls"
        :key="control.key"
        class="pointer-events-none fixed p-0.5"
        :style="
          displayStore.getBottomControlStyle(index, bottomControls.length)
        "
      >
        <div
          v-if="control.key === 'footer-toggle'"
          class="pointer-events-auto flex h-full w-full flex-col gap-1"
        >
          <button
            :class="[
              'group flex min-h-0 flex-1 items-center justify-center overflow-hidden border border-base-300/80 bg-base-100/95 text-base-content shadow-lg shadow-base-content/10 backdrop-blur transition-all duration-200 hover:-translate-y-0.5 hover:border-primary hover:bg-primary hover:text-primary-content hover:shadow-xl active:translate-y-0 active:scale-95',
              control.roundedClass,
              headerToggleButtonClass,
            ]"
            aria-label="Toggle header"
            type="button"
            @click="displayStore.toggleHeader()"
          >
            <span
              class="flex h-full w-full items-center justify-center rounded-[inherit] bg-linear-to-b from-white/15 to-transparent"
            >
              <Icon
                :name="headerToggleIcon"
                class="h-4 w-4 transition-transform duration-200 group-hover:scale-110"
              />
            </span>
          </button>

          <button
            :class="[
              'group flex min-h-0 flex-1 items-center justify-center overflow-hidden border border-base-300/80 bg-base-100/95 text-base-content shadow-lg shadow-base-content/10 backdrop-blur transition-all duration-200 hover:-translate-y-0.5 hover:border-primary hover:bg-primary hover:text-primary-content hover:shadow-xl active:translate-y-0 active:scale-95',
              control.roundedClass,
              control.buttonClass,
            ]"
            :aria-label="control.label"
            type="button"
            @click="control.action"
          >
            <span
              class="flex h-full w-full items-center justify-center rounded-[inherit] bg-linear-to-b from-white/15 to-transparent"
            >
              <Icon
                :name="control.icon"
                class="h-4 w-4 transition-transform duration-200 group-hover:scale-110"
              />
            </span>
          </button>
        </div>

        <button
          v-else
          :class="[
            'pointer-events-auto group flex h-full w-full items-center justify-center overflow-hidden border border-base-300/80 bg-base-100/95 text-base-content shadow-lg shadow-base-content/10 backdrop-blur transition-all duration-200 hover:-translate-y-0.5 hover:border-primary hover:bg-primary hover:text-primary-content hover:shadow-xl active:translate-y-0 active:scale-95',
            control.roundedClass,
            control.buttonClass,
          ]"
          :aria-label="control.label"
          type="button"
          @click="control.action"
        >
          <span
            class="flex h-full w-full items-center justify-center rounded-[inherit] bg-linear-to-b from-white/15 to-transparent"
          >
            <Icon
              :name="control.icon"
              class="h-5 w-5 transition-transform duration-200 group-hover:scale-110"
            />
          </span>
        </button>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDisplayStore } from '@/stores/displayStore'
import { useNavStore } from '@/stores/navStore'
import {
  fallbackFooterKey,
  footerDashboardMap,
  footerKeys,
  footerRouteMap,
  type FooterKey,
} from '@/stores/helpers/dashboardHelper'

const route = useRoute()
const router = useRouter()
const displayStore = useDisplayStore()
const navStore = useNavStore()

type FooterName = FooterKey

type BottomControl = {
  key: string
  label: string
  icon: string
  roundedClass: string
  buttonClass: string
  action: () => void
}

const footerOptions = [...footerKeys]

const headerToggleIcon = computed(() => {
  return displayStore.headerState === 'hidden'
    ? 'kind-icon:chevron-down'
    : 'kind-icon:chevron-up'
})

const headerToggleButtonClass = computed(() => {
  return displayStore.headerState === 'hidden'
    ? 'border-secondary/60 bg-secondary/15 text-secondary hover:bg-secondary hover:text-secondary-content'
    : 'border-base-300/80 bg-base-100/95 text-base-content hover:bg-secondary hover:text-secondary-content'
})

const footerToggleIcon = computed(() => {
  return displayStore.footerStage === 'priority'
    ? 'kind-icon:chevron-down'
    : 'kind-icon:chevron-up'
})

const footerInnerStyle = computed(() => {
  if (!displayStore.footerContentVisible) return { padding: '0' }

  return {
    padding: '0.5rem',
  }
})

const bottomControls = computed<BottomControl[]>(() => [
  {
    key: 'left-sidebar',
    label: 'Toggle left sidebar',
    icon: 'kind-icon:butterfly',
    roundedClass: 'rounded-2xl',
    buttonClass: 'hover:bg-secondary hover:text-secondary-content',
    action: () => displayStore.toggleLeftSidebar('forward'),
  },
  {
    key: 'previous-footer',
    label: 'Previous footer section',
    icon: 'kind-icon:chevron-left',
    roundedClass: 'rounded-2xl',
    buttonClass: 'hover:bg-accent hover:text-accent-content',
    action: showPreviousFooter,
  },
  {
    key: 'footer-toggle',
    label: 'Toggle footer',
    icon: footerToggleIcon.value,
    roundedClass: 'rounded-2xl',
    buttonClass:
      'border-primary/60 bg-primary/15 text-primary hover:bg-primary hover:text-primary-content',
    action: displayStore.toggleFooter,
  },
  {
    key: 'next-footer',
    label: 'Next footer section',
    icon: 'kind-icon:chevron-right',
    roundedClass: 'rounded-2xl',
    buttonClass: 'hover:bg-accent hover:text-accent-content',
    action: showNextFooter,
  },
  {
    key: 'right-sidebar',
    label: 'Toggle right sidebar',
    icon: 'kind-icon:sidebar-right',
    roundedClass: 'rounded-2xl',
    buttonClass: 'hover:bg-info hover:text-info-content',
    action: () => displayStore.toggleRightSidebar('forward'),
  },
])

function getWrappedFooter(step: -1 | 1): FooterName {
  const current = normalizeFooterName(displayStore.footerComponent)
  const index = footerOptions.indexOf(current)
  const next = (index + step + footerOptions.length) % footerOptions.length

  return footerOptions[next] ?? fallbackFooterKey
}

function normalizeFooterName(value: string): FooterName {
  if (value === 'kind') return 'bot'

  return footerOptions.includes(value as FooterName)
    ? (value as FooterName)
    : fallbackFooterKey
}

function setFooter(name: FooterName) {
  displayStore.setFooterComponent(name)

  const dashboardKey = footerDashboardMap[name]
  navStore.setDashboardTab(dashboardKey, 'overview')

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

onMounted(() => {
  displayStore.initialize()
})

onBeforeUnmount(() => {
  displayStore.removeViewportWatcher()
})
</script>
