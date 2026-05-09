<template>
  <div class="flex min-h-dvh w-full flex-col overflow-hidden bg-base-200">
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

    <header
      class="fixed overflow-hidden transition-all duration-200"
      :style="displayStore.headerStyle"
    >
      <slot name="header">
        <full-header />
      </slot>
    </header>

    <template v-if="displayStore.bottomControlRowVisible">
      <div
        v-for="(control, index) in bottomControls"
        :key="control.key"
        class="pointer-events-none fixed p-0.5"
        :style="displayStore.getBottomControlStyle(control.index, 5)"
      >
        <button
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
import { useDisplayStore } from '@/stores/displayStore'

const displayStore = useDisplayStore()

type BottomControl = {
  key: string
  index: number
  label: string
  icon: string
  roundedClass: string
  buttonClass: string
  action: () => void
}
const headerToggleIcon = computed(() => {
  return displayStore.headerState === 'hidden'
    ? 'kind-icon:chevron-up'
    : 'kind-icon:chevron-down'
})

const headerToggleButtonClass = computed(() => {
  return displayStore.headerState === 'hidden'
    ? 'border-secondary/60 bg-secondary/15 text-secondary hover:bg-secondary hover:text-secondary-content'
    : 'border-base-300/80 bg-base-100/95 text-base-content hover:bg-secondary hover:text-secondary-content'
})

const bottomControls = computed<BottomControl[]>(() => [
  {
    key: 'left-sidebar',
    index: 0,
    label: 'Toggle left sidebar',
    icon: 'kind-icon:butterfly',
    roundedClass: 'rounded-2xl',
    buttonClass: 'hover:bg-secondary hover:text-secondary-content',
    action: () => displayStore.toggleLeftSidebar('forward'),
  },
  {
    key: 'header-toggle',
    index: 2,
    label: 'Toggle header',
    icon: headerToggleIcon.value,
    roundedClass: 'rounded-2xl',
    buttonClass: headerToggleButtonClass.value,
    action: () => displayStore.toggleHeader(),
  },
  {
    key: 'right-sidebar',
    index: 4,
    label: 'Toggle right sidebar',
    icon: 'kind-icon:sidebar-right',
    roundedClass: 'rounded-2xl',
    buttonClass: 'hover:bg-info hover:text-info-content',
    action: () => displayStore.toggleRightSidebar('forward'),
  },
])

onMounted(() => {
  displayStore.initialize()
})

onBeforeUnmount(() => {
  displayStore.removeViewportWatcher()
})
</script>
