<!-- /components/navigation/smart-icons.vue -->
<template>
  <div class="relative flex h-full min-h-10 w-full min-w-0 items-stretch">
    <div class="flex h-full w-full items-stretch gap-1">
      <button
        v-if="canScrollLeft && !isEditing"
        type="button"
        class="absolute left-0 top-0 z-10 h-full w-8 pointer-events-none flex items-center justify-start pl-1 bg-linear-to-r from-base-100/70 to-transparent md:static md:pointer-events-auto md:h-full md:w-7 md:shrink-0 md:justify-center md:pl-0 md:rounded-xl md:bg-transparent md:hover:bg-base-300/80 transition"
        @click="scrollByStep(-1)"
      >
        <div class="flex items-center justify-center overflow-hidden h-5 w-5">
          <Icon
            name="kind-icon:chevron-left"
            class="force-fill h-full w-full"
          />
        </div>
      </button>

      <div
        ref="scrollContainer"
        class="smart-icons-scroll flex h-full min-h-0 flex-1 min-w-0 items-stretch gap-1 overflow-x-auto overflow-y-hidden transition-all duration-300"
        :class="[
          isDragging ? 'cursor-grabbing' : 'cursor-grab',
          !canScrollLeft && !canScrollRight ? 'justify-center px-2' : '',
        ]"
        @scroll="checkScrollEdgesThrottled"
        @mousedown="handleScrollMouseDown"
        @mousemove="handleScrollMouseMove"
        @mouseup="handleScrollMouseUp"
        @mouseleave="handleScrollMouseUp"
        @touchstart="handleScrollTouchStart"
        @touchmove="handleScrollTouchMove"
        @touchend="handleScrollTouchEnd"
        @wheel.passive="handleWheel"
      >
        <div ref="row" class="flex h-full min-w-max items-stretch gap-1">
          <template v-if="isEditing">
            <div class="flex h-full items-center gap-1 pr-1">
              <button
                type="button"
                class="h-full flex items-center justify-center gap-1.5 rounded-2xl bg-base-300 px-2 hover:bg-base-300/70 transition text-base-content font-bold text-sm"
                @click="smartbarStore.revertEdit()"
              >
                <div
                  class="flex h-[55%] aspect-square items-center justify-center overflow-hidden"
                >
                  <Icon name="kind-icon:x" class="force-fill h-full w-full" />
                </div>
                <span>Cancel</span>
              </button>
              <button
                v-if="smartbarStore.hasChanges"
                type="button"
                class="h-full px-3 flex items-center justify-center gap-1.5 rounded-2xl bg-primary hover:bg-primary/80 transition text-primary-content font-bold text-sm"
                @click="smartbarStore.confirmEdit()"
              >
                <div
                  class="flex h-[55%] aspect-square items-center justify-center overflow-hidden"
                >
                  <Icon
                    name="kind-icon:check"
                    class="force-fill h-full w-full"
                  />
                </div>
                <span>Save</span>
              </button>
            </div>
          </template>

          <template
            v-if="!isEditing && prependIcons && prependIcons.length > 0"
          >
            <div
              v-for="icon in prependIcons"
              :key="icon.id"
              class="flex h-full aspect-square items-stretch justify-center"
            >
              <button
                type="button"
                class="flex h-full w-full min-h-0 flex-col items-center justify-between rounded-2xl border-2 border-base-300 bg-base-200 px-1 py-1 overflow-hidden"
                :title="icon.label"
              >
                <div
                  class="flex min-h-0 flex-1 w-full items-center justify-center overflow-hidden"
                >
                  <component
                    :is="icon.component"
                    class="prepend-icon h-full w-full"
                    :class="icon.color"
                  />
                </div>
                <span
                  class="block h-[1.1em] shrink-0 text-center text-[clamp(0.55rem,0.9vw,0.9rem)] font-black uppercase leading-none tracking-[0.18em]"
                  :class="icon.color"
                >
                  {{ icon.label }}
                </span>
              </button>
            </div>
          </template>

          <div
            v-if="rowIcons.length === 0 && !isEditing"
            class="flex h-full aspect-square items-stretch justify-center"
          >
            <button
              type="button"
              class="h-full w-full flex flex-col items-center justify-center rounded-2xl border border-warning/40 bg-warning/10 text-warning"
              @click="smartbarStore.startEdit()"
            >
              <div
                class="flex h-full w-full items-center justify-center overflow-hidden"
              >
                <Icon name="kind-icon:alert" class="force-fill h-full w-full" />
              </div>
            </button>
          </div>

          <div
            v-for="(icon, index) in rowIcons"
            :key="icon.id"
            class="relative flex h-full aspect-square items-stretch justify-center shrink-0 text-base-content hover:z-10"
            :draggable="isEditing"
            @dragstart="smartbarStore.startDrag(index)"
            @dragover.prevent
            @drop="smartbarStore.dropIcon(index)"
          >
            <div
              class="flex h-full w-full min-h-0 flex-col items-center justify-center rounded-2xl"
              :class="isEditing ? 'border border-base-300' : ''"
            >
              <div
                class="flex-1 min-h-0 w-full flex items-center justify-center"
              >
                <div
                  v-if="isEditing"
                  class="w-full h-full flex items-center justify-center overflow-hidden"
                >
                  <Icon
                    :name="icon.icon || 'kind-icon:help'"
                    class="force-fill w-full h-full"
                  />
                </div>

                <NuxtLink
                  v-else-if="icon.link && icon.type !== 'utility'"
                  :to="icon.link"
                  class="w-full h-full flex items-center justify-center transition-transform sm:hover:scale-110 text-base-content"
                >
                  <div
                    class="w-full h-full flex items-center justify-center overflow-hidden"
                  >
                    <Icon
                      :name="icon.icon || 'kind-icon:help'"
                      class="force-fill w-full h-full"
                      :class="{ glow: isActiveRoute(icon) }"
                    />
                  </div>
                </NuxtLink>

                <div
                  v-else-if="
                    icon.type === 'utility' &&
                    icon.component &&
                    componentMap[icon.component]
                  "
                  class="w-full h-full min-h-0 flex items-center justify-center overflow-hidden"
                >
                  <component
                    :is="componentMap[icon.component]"
                    class="utility-icon h-full w-full"
                  />
                </div>

                <div
                  v-else
                  class="w-[90%] h-[90%] flex items-center justify-center overflow-hidden"
                >
                  <Icon
                    :name="icon.icon || 'kind-icon:help'"
                    class="force-fill w-full h-full"
                  />
                </div>
              </div>

              <div
                v-if="isEditing"
                class="w-full flex items-center justify-center shrink-0"
                style="height: 22%"
              >
                <template v-if="confirmingDeleteId === icon.id">
                  <button
                    class="text-[0.6rem] bg-gray-300 text-black rounded-full px-1.5 py-0.5 hover:bg-gray-400 mr-1 font-bold"
                    @click="confirmingDeleteId = null"
                  >
                    No
                  </button>
                  <button
                    class="text-[0.6rem] bg-red-600 text-white rounded-full px-1.5 py-0.5 hover:bg-red-700 font-bold"
                    @click="removeIcon(icon.id)"
                  >
                    Remove
                  </button>
                </template>
                <button
                  v-else
                  class="text-[0.6rem] bg-red-500 text-white rounded-full px-1.5 py-0.5 hover:bg-red-600 font-bold"
                  @click="confirmingDeleteId = icon.id"
                >
                  ✕
                </button>
              </div>

              <div
                v-else-if="showTitles"
                class="w-full flex items-center justify-center shrink-0"
                style="height: 22%"
              >
                <span
                  class="text-center font-bold truncate max-w-full leading-none"
                  style="font-size: clamp(0.55rem, 1vw, 0.8rem)"
                  :title="computedLabel(icon)"
                >
                  {{ computedLabel(icon) }}
                </span>
              </div>
            </div>
          </div>

          <div
            v-if="isEditing"
            class="flex h-full aspect-square items-stretch justify-center shrink-0"
          >
            <NuxtLink
              to="/icons"
              class="h-full w-full flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-primary/50 bg-primary/10 hover:bg-primary/20 transition"
            >
              <div
                class="flex h-full w-full items-center justify-center overflow-hidden"
              >
                <Icon
                  name="kind-icon:plus"
                  class="force-fill h-full w-full text-primary"
                />
              </div>
            </NuxtLink>
          </div>

          <div
            v-if="!isEditing"
            class="flex h-full aspect-square items-stretch justify-center shrink-0"
          >
            <button
              type="button"
              class="h-full w-full flex flex-col items-center justify-center rounded-2xl hover:bg-base-300"
              @click="smartbarStore.startEdit()"
            >
              <div
                class="flex h-full w-full items-center justify-center overflow-hidden"
              >
                <Icon
                  name="kind-icon:settings"
                  class="force-fill h-full w-full"
                />
              </div>
            </button>
          </div>
        </div>
      </div>

      <button
        v-if="canScrollRight && !isEditing"
        type="button"
        class="absolute right-0 top-0 z-10 h-full w-8 pointer-events-none flex items-center justify-end pr-1 bg-linear-to-l from-base-100/70 to-transparent md:static md:pointer-events-auto md:h-full md:w-7 md:shrink-0 md:justify-center md:pr-0 md:rounded-xl md:bg-transparent md:hover:bg-base-300/80 transition"
        @click="scrollByStep(1)"
      >
        <div class="flex items-center justify-center overflow-hidden h-5 w-5">
          <Icon
            name="kind-icon:chevron-right"
            class="force-fill h-full w-full"
          />
        </div>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount, computed, nextTick } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute } from 'vue-router'
import { useSmartbarStore, type SmartIcon } from '@/stores/smartbarStore'
import { useDisplayStore } from '@/stores/displayStore'
import { useThemeStore } from '@/stores/themeStore'
import { useUserStore } from '@/stores/userStore'
import { useMilestoneStore } from '@/stores/milestoneStore'
import { useButterflyStore } from '@/stores/butterflyStore'

import SwarmIcon from '@/components/icons/swarm-icon.vue'
import ThemeIcon from '@/components/wonderlab/theme-icon.vue'
import LoginIcon from '@/components/icons/login-icon.vue'
import JellybeanIcon from '@/components/icons/jellybean-icon.vue'

const butterflyStore = useButterflyStore()

const componentMap: Record<string, any> = {
  'swarm-icon': SwarmIcon,
  'theme-icon': ThemeIcon,
  'login-icon': LoginIcon,
  'jellybean-icon': JellybeanIcon,
}

interface PrependIcon {
  id: string
  component: string
  color: string
  label: string
}

const props = defineProps<{ prependIcons?: PrependIcon[] }>()

const smartbarStore = useSmartbarStore()
const displayStore = useDisplayStore()
const themeStore = useThemeStore()
const userStore = useUserStore()
const milestoneStore = useMilestoneStore()
const route = useRoute()

const { isEditing, editableIcons, activeIcons } = storeToRefs(smartbarStore)

const rowIcons = computed<SmartIcon[]>(() =>
  isEditing.value ? editableIcons.value : activeIcons.value,
)

const showTitles = computed(() => !isEditing.value && !displayStore.bigMode)

const confirmingDeleteId = ref<number | null>(null)

function removeIcon(id: number) {
  smartbarStore.removeFromEditableIcons(id)
  confirmingDeleteId.value = null
}

function isActiveRoute(icon: SmartIcon) {
  return !!(icon.link && route.path.startsWith(icon.link))
}

function computedLabel(icon: SmartIcon): string {
  if (icon.type !== 'utility') return icon.label || ''

  switch (icon.component) {
    case 'theme-icon':
      return themeStore.currentTheme || 'Theme'
    case 'login-icon':
      return userStore.isLoggedIn
        ? userStore.user?.username || 'User'
        : 'Login?'
    case 'jellybean-icon':
      return `${milestoneStore.milestoneCountForUser || 0} /11`
    case 'swarm-icon':
      return butterflyStore.butterflies.some((b) => !b.isExiting)
        ? 'Swarm On'
        : 'Swarm'
    default:
      return icon.label || ''
  }
}

const scrollContainer = ref<HTMLElement | null>(null)
const row = ref<HTMLElement | null>(null)
const isDragging = ref(false)
const canScrollLeft = ref(false)
const canScrollRight = ref(false)

let scrollTick = false
let startX = 0
let scrollStart = 0
const EPSILON = 2

function updateScrollFlags() {
  const el = scrollContainer.value
  if (!el) return
  if (el.scrollWidth <= el.clientWidth + 1) {
    canScrollLeft.value = false
    canScrollRight.value = false
    return
  }
  const maxScrollLeft = el.scrollWidth - el.clientWidth
  canScrollLeft.value = el.scrollLeft > EPSILON
  canScrollRight.value = maxScrollLeft - el.scrollLeft > EPSILON
}

function checkScrollEdgesThrottled() {
  if (scrollTick) return
  scrollTick = true
  requestAnimationFrame(() => {
    updateScrollFlags()
    scrollTick = false
  })
}

function scrollByStep(direction: -1 | 1) {
  const el = scrollContainer.value
  if (!el) return
  const step = Math.max(160, el.clientWidth * 0.8)
  el.scrollBy({ left: direction * step, behavior: 'smooth' })
}

function handleScrollMouseDown(e: MouseEvent) {
  if (!scrollContainer.value) return
  isDragging.value = true
  startX = e.clientX
  scrollStart = scrollContainer.value.scrollLeft
  e.preventDefault()
}

function handleScrollMouseMove(e: MouseEvent) {
  if (!isDragging.value || !scrollContainer.value) return
  scrollContainer.value.scrollLeft = scrollStart - (e.clientX - startX)
}

function handleScrollMouseUp() {
  if (!isDragging.value) return
  isDragging.value = false
  requestAnimationFrame(updateScrollFlags)
}

function handleScrollTouchStart(e: TouchEvent) {
  const touch = e.touches[0]
  if (!touch || !scrollContainer.value) return
  isDragging.value = true
  startX = touch.clientX
  scrollStart = scrollContainer.value.scrollLeft
}

function handleScrollTouchMove(e: TouchEvent) {
  const touch = e.touches[0]
  if (!touch || !isDragging.value || !scrollContainer.value) return
  scrollContainer.value.scrollLeft = scrollStart - (touch.clientX - startX)
}

function handleScrollTouchEnd() {
  if (!isDragging.value) return
  isDragging.value = false
  requestAnimationFrame(updateScrollFlags)
}

function handleWheel(e: WheelEvent) {
  const el = scrollContainer.value
  if (!el) return
  if (Math.abs(e.deltaX) < Math.abs(e.deltaY)) {
    el.scrollBy({ left: e.deltaY, behavior: 'auto' })
  }
}

function syncAfterLayout() {
  nextTick(() => requestAnimationFrame(updateScrollFlags))
}

watch(() => rowIcons.value.length, syncAfterLayout)
watch(() => props.prependIcons?.length, syncAfterLayout)
watch(
  () => [
    displayStore.bigMode,
    displayStore.viewportSize,
    displayStore.headerState,
    displayStore.sidebarRightState,
  ],
  syncAfterLayout,
  { flush: 'post' },
)

let resizeObserver: ResizeObserver | null = null
let rowResizeObserver: ResizeObserver | null = null
let mutationObserver: MutationObserver | null = null

onMounted(() => {
  const el = scrollContainer.value
  const content = row.value
  if (!el || !content) return

  resizeObserver = new ResizeObserver(checkScrollEdgesThrottled)
  rowResizeObserver = new ResizeObserver(checkScrollEdgesThrottled)
  mutationObserver = new MutationObserver(checkScrollEdgesThrottled)

  resizeObserver.observe(el)
  rowResizeObserver.observe(content)
  mutationObserver.observe(content, { childList: true })

  syncAfterLayout()
})

onBeforeUnmount(() => {
  const el = scrollContainer.value
  const content = row.value
  if (resizeObserver && el) resizeObserver.unobserve(el)
  if (rowResizeObserver && content) rowResizeObserver.unobserve(content)
  if (mutationObserver) mutationObserver.disconnect()
})
</script>

<style scoped>
.smart-icons-scroll {
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.smart-icons-scroll::-webkit-scrollbar {
  width: 0;
  height: 0;
}
.glow {
  box-shadow: 0 0 8px rgba(255, 255, 0, 0.8);
  transition: box-shadow 0.3s ease-in-out;
}

.prepend-icon :deep(svg),
.prepend-icon :deep(img),
.prepend-icon :deep(.iconify),
.prepend-icon :deep(i),
.force-fill :deep(svg),
.force-fill :deep(img),
.force-fill :deep(.iconify),
.force-fill :deep(i),
.utility-icon :deep(svg),
.utility-icon :deep(img),
.utility-icon :deep(.iconify),
.utility-icon :deep(i) {
  width: 100%;
  height: 100%;
  display: block;
}

.force-fill :deep(svg),
.force-fill :deep(.iconify),
.force-fill :deep(path) {
  fill: hsl(var(--a));
  color: hsl(var(--a));
}

.force-fill,
.utility-icon {
  display: flex;
  width: 100%;
  height: 100%;
}
</style>
