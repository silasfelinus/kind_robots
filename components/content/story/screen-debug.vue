<template>
  <teleport to="body">
    <!-- Floating Toggle Button -->
    <div class="fixed top-4 right-4 z-50 pointer-events-auto">
      <button
        class="bg-gray-700 text-white p-2 rounded-full shadow-md"
        @click="toggleDebug"
      >
        {{ isDebugVisible ? '🛠️' : '📌' }}
      </button>
    </div>

    <!-- Debug Panel Overlay -->
    <div
      v-if="isDebugVisible"
      class="fixed inset-0 z-40 bg-black bg-opacity-80 flex items-center justify-center overflow-auto p-6"
    >
      <client-only>
        <div
          class="bg-base-100 text-base-content p-6 rounded-xl w-full max-w-7xl shadow-2xl pointer-events-auto overflow-y-auto max-h-[90vh]"
        >
          <!-- Ruler Overlay -->
          <div class="fixed inset-0 z-30 pointer-events-none">
            <!-- Vertical Ruler -->
            <div class="absolute left-0 top-0 w-6 h-full flex flex-col text-[8px] text-white">
              <template v-for="n in 100" :key="'vh-' + n">
                <div class="w-full h-[1vh] relative">
                  <div
                    :class="[
                      n % 10 === 0
                        ? 'border-t border-white'
                        : n % 5 === 0
                          ? 'border-t border-white/50'
                          : n > 90 || n < 10
                            ? 'border-t border-white/20'
                            : 'border-t border-transparent',
                    ]"
                  ></div>
                  <span v-if="n % 10 === 0" class="absolute left-6 -translate-y-1/2">
                    {{ n }}vh
                  </span>
                </div>
              </template>
            </div>

            <!-- Horizontal Ruler -->
            <div class="absolute top-0 left-0 w-full h-6 flex text-[8px] text-white">
              <template v-for="n in 100" :key="'vw-' + n">
                <div class="relative h-full w-[1vw]">
                  <div
                    :class="[
                      n % 10 === 0
                        ? 'border-l border-white h-full'
                        : n % 5 === 0
                          ? 'border-l border-white/50 h-full'
                          : n > 90 || n < 10
                            ? 'border-l border-white/20 h-full'
                            : 'border-l border-transparent h-full',
                    ]"
                  ></div>
                  <span v-if="n % 10 === 0" class="absolute top-6 left-1">
                    {{ n }}vw
                  </span>
                </div>
              </template>
            </div>
          </div>

          <!-- Debug Info -->
          <h2 class="text-xl font-bold mb-4">🧪 Kind Robots Debug Panel</h2>

          <!-- Style Bindings -->
          <div class="space-y-6 mb-6">
            <div class="grid grid-cols-1 gap-4">
              <div class="bg-primary text-white p-4 rounded-2xl border shadow-md">
                <h3 class="font-semibold mb-2">Header Style</h3>
                <p class="text-sm font-mono">{{ headerStyle }}</p>
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div class="bg-info text-white p-4 rounded-2xl border shadow-md">
                <h3 class="font-semibold mb-2">Left Sidebar Style</h3>
                <p class="text-sm font-mono">{{ leftSidebarStyle }}</p>
              </div>
              <div class="bg-accent text-white p-4 rounded-2xl border shadow-md">
                <h3 class="font-semibold mb-2">Main Content Style</h3>
                <p class="text-sm font-mono">{{ mainContentStyle }}</p>
              </div>
              <div class="bg-warning text-white p-4 rounded-2xl border shadow-md">
                <h3 class="font-semibold mb-2">Right Sidebar Style</h3>
                <p class="text-sm font-mono">{{ rightSidebarStyle }}</p>
              </div>
            </div>

            <div class="grid grid-cols-1 gap-4">
              <div class="bg-secondary text-white p-4 rounded-2xl border shadow-md">
                <h3 class="font-semibold mb-2">Footer Style</h3>
                <p class="text-sm font-mono">{{ footerStyle }}</p>
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div class="bg-success text-white p-4 rounded-2xl border shadow-md">
                <h3 class="font-semibold mb-2">Left Toggle Style</h3>
                <p class="text-sm font-mono">{{ leftToggleStyle }}</p>
              </div>
              <div class="bg-error text-white p-4 rounded-2xl border shadow-md">
                <h3 class="font-semibold mb-2">Right Toggle Style</h3>
                <p class="text-sm font-mono">{{ rightToggleStyle }}</p>
              </div>
              <div class="bg-base-300 text-black p-4 rounded-2xl border shadow-md">
                <h3 class="font-semibold mb-2">Footer Toggle Style</h3>
                <p class="text-sm font-mono">{{ footerToggleStyle }}</p>
              </div>
            </div>
          </div>

          <!-- State & Layout -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div class="bg-base-200 p-4 rounded-2xl border border-base-300">
              <h3 class="text-lg font-semibold mb-2">State & Visibility</h3>
              <div class="space-y-1 text-sm">
                <div><strong>Header:</strong> {{ headerVisible }} ({{ headerState }})</div>
                <div><strong>Sidebar Left:</strong> {{ sidebarLeftVisible }} ({{ sidebarLeftState }})</div>
                <div><strong>Sidebar Right:</strong> {{ sidebarRightVisible }} ({{ sidebarRightState }})</div>
                <div><strong>Footer:</strong> {{ footerVisible }} ({{ footerState }})</div>
                <div><strong>Fullscreen:</strong> {{ fullscreenState }}</div>
                <div><strong>Flip:</strong> {{ flipState }}</div>
                <div><strong>Big Mode:</strong> {{ bigMode }}</div>
              </div>
            </div>

            <div class="bg-info text-white p-4 rounded-2xl border border-base-300">
              <h3 class="text-lg font-semibold mb-2">Sizes & Bases</h3>
              <div class="grid grid-cols-2 gap-2 text-sm">
                <div><strong>Header H:</strong> {{ headerHeight }}</div>
                <div><strong>Footer H:</strong> {{ footerHeight }}</div>
                <div><strong>Left W:</strong> {{ sidebarLeftWidth }}</div>
                <div><strong>Right W:</strong> {{ sidebarRightWidth }}</div>
                <div><strong>Header Base:</strong> {{ headerBase }}</div>
                <div><strong>Footer Base:</strong> {{ footerBase }}</div>
                <div><strong>Left Base:</strong> {{ sidebarLeftBase }}</div>
                <div><strong>Right Base:</strong> {{ sidebarRightBase }}</div>
                <div><strong>Section Pad:</strong> {{ sectionPadding }}</div>
              </div>
            </div>

            <div class="bg-secondary text-white p-4 rounded-2xl border border-base-300">
              <h3 class="text-lg font-semibold mb-2">Device & Viewport</h3>
              <div class="space-y-1 text-sm">
                <div><strong>Viewport:</strong> {{ viewportSize }}</div>
                <div><strong>Mobile View:</strong> {{ isMobileViewport }}</div>
                <div><strong>Large View:</strong> {{ isLargeViewport }}</div>
                <div><strong>Touch Device:</strong> {{ isTouchDevice }}</div>
                <div><strong>Is Animating:</strong> {{ isAnimating }}</div>
                <div><strong>Current Animation:</strong> {{ currentAnimation }}</div>
              </div>
            </div>
          </div>
        </div>
      </client-only>
    </div>
  </teleport>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'

const displayStore = useDisplayStore()
const isDebugVisible = ref(false)
const toggleDebug = () => {
  isDebugVisible.value = !isDebugVisible.value
}

// States & Visibility
const headerState = computed(() => displayStore.headerState)
const footerState = computed(() => displayStore.footerState)
const sidebarLeftState = computed(() => displayStore.sidebarLeftState)
const sidebarRightState = computed(() => displayStore.sidebarRightState)

const headerVisible = computed(() => displayStore.headerState !== 'hidden')
const footerVisible = computed(() => displayStore.footerState !== 'closed')
const sidebarLeftVisible = computed(() =>
  ['open', 'compact'].includes(displayStore.sidebarLeftState),
)
const sidebarRightVisible = computed(() =>
  ['open', 'compact'].includes(displayStore.sidebarRightState),
)

// Style Bindings
const headerStyle = computed(() => displayStore.headerStyle)
const footerStyle = computed(() => displayStore.footerStyle)
const leftToggleStyle = computed(() => displayStore.leftToggleStyle)
const rightToggleStyle = computed(() => displayStore.rightToggleStyle)
const footerToggleStyle = computed(() => displayStore.footerToggleStyle)
const leftSidebarStyle = computed(() => displayStore.leftSidebarStyle)
const rightSidebarStyle = computed(() => displayStore.rightSidebarStyle)
const mainContentStyle = computed(() => displayStore.mainContentStyle)

// Dimensions
const headerHeight = computed(() => displayStore.headerHeight)
const footerHeight = computed(() => displayStore.footerHeight)
const sidebarLeftWidth = computed(() => displayStore.sidebarLeftWidth)
const sidebarRightWidth = computed(() => displayStore.sidebarRightWidth)
const sidebarLeftBase = sidebarLeftWidth
const sidebarRightBase = sidebarRightWidth
const headerBase = headerHeight
const footerBase = footerHeight
const sectionPadding = computed(() => displayStore.sectionPaddingSize)

// Viewport & Layout
const viewportSize = computed(() => displayStore.viewportSize)
const isTouchDevice = computed(() => displayStore.isTouchDevice)
const isMobileViewport = computed(() => displayStore.isMobileViewport)
const isLargeViewport = computed(() => displayStore.isLargeViewport)

// Effects
const fullscreenState = computed(() => displayStore.fullscreenState)
const isAnimating = computed(() => displayStore.isAnimating)
const currentAnimation = computed(() => displayStore.currentAnimation)
const flipState = computed(() => displayStore.flipState)
const bigMode = computed(() => displayStore.bigMode)
</script>
