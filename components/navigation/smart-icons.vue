<!-- /components/navigation/smart-icons.vue -->
<template>
  <div class="relative flex h-full min-h-10 w-full min-w-0 items-stretch">
    <div class="flex h-full w-full items-stretch gap-1">
      <button
        v-if="canScrollLeft && !isEditing"
        type="button"
        class="shrink-0 flex h-full aspect-square items-center justify-center rounded-2xl hover:bg-base-300/80 transition"
        @click="scrollByStep(-1)"
      >
        <div
          class="flex h-[65%] w-[65%] items-center justify-center overflow-hidden"
        >
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
            class="flex h-full aspect-square items-stretch justify-center shrink-0 text-base-content"
            :draggable="isEditing"
            @dragstart="smartbarStore.startDrag(index)"
            @dragover.prevent
            @drop="smartbarStore.dropIcon(index)"
          >
            <div
              class="flex h-full w-full min-h-0 flex-col items-center justify-center overflow-hidden rounded-2xl"
              :class="isEditing ? 'border border-base-300' : ''"
            >
              <div
                class="flex-1 min-h-0 w-full flex items-center justify-center overflow-hidden"
              >
                <div
                  v-if="isEditing"
                  class="flex h-full w-full items-center justify-center"
                >
                  <component
                    v-if="icon.component && componentMap[icon.component]"
                    :is="componentMap[icon.component]"
                    class="h-full w-full"
                  />
                  <Icon
                    v-else-if="icon.icon"
                    :name="icon.icon"
                    class="force-fill h-full w-full"
                  />
                </div>

                <NuxtLink
                  v-else-if="isNav(icon) && icon.link"
                  :to="icon.link"
                  class="flex h-full w-full items-center justify-center rounded-2xl transition"
                  :class="
                    isActiveRoute(icon) ? 'bg-primary/15' : 'hover:bg-base-300'
                  "
                >
                  <Icon
                    v-if="icon.icon"
                    :name="icon.icon"
                    class="force-fill h-full w-full"
                  />
                </NuxtLink>

                <button
                  v-else
                  type="button"
                  class="flex h-full w-full items-center justify-center rounded-2xl transition hover:bg-base-300"
                >
                  <component
                    v-if="icon.component && componentMap[icon.component]"
                    :is="componentMap[icon.component]"
                    class="h-full w-full"
                  />
                  <Icon
                    v-else-if="icon.icon"
                    :name="icon.icon"
                    class="force-fill h-full w-full"
                  />
                </button>
              </div>

              <div
                v-if="isEditing && confirmingDeleteId === icon.id"
                class="w-full flex items-center justify-center gap-1 pb-1"
              >
                <button
                  type="button"
                  class="rounded-full bg-red-500 px-2 py-0.5 text-xs text-white hover:bg-red-600 font-bold"
                  @click="removeIcon(icon.id)"
                >
                  Confirm
                </button>
                <button
                  type="button"
                  class="rounded-full bg-base-300 px-2 py-0.5 text-xs hover:bg-base-200"
                  @click="confirmingDeleteId = null"
                >
                  Cancel
                </button>
              </div>

              <button
                v-else-if="isEditing"
                type="button"
                class="rounded-full bg-red-500 px-2 py-0.5 hover:bg-red-600 font-bold text-white text-xs"
                @click="confirmingDeleteId = icon.id"
              >
                ✕
              </button>

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
        class="shrink-0 flex h-full aspect-square items-center justify-center rounded-2xl hover:bg-base-300/80 transition"
        @click="scrollByStep(1)"
      >
        <div
          class="flex h-[65%] w-[65%] items-center justify-center overflow-hidden"
        >
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

defineProps<{ prependIcons?: PrependIcon[] }>()

const smartbarStore = useSmartbarStore()
const butterflyStore = useButterflyStore()
const displayStore = useDisplayStore()
const themeStore = useThemeStore()
const userStore = useUserStore()
const milestoneStore = useMilestoneStore()
const route = useRoute()

const { isEditing, editableIcons, activeIcons } = storeToRefs(smartbarStore)
const { butterflies } = storeToRefs(butterflyStore)

const isNav = (icon: SmartIcon) => (icon?.type || '').toLowerCase() === 'nav'

const rowIcons = computed<SmartIcon[]>(() =>
  isEditing.value ? editableIcons.value : activeIcons.value,
)

const showTitles = computed(() => !isEditing.value && !displayStore.bigMode)

const activeButterflyCount = computed(
  () => butterflies.value.filter((butterfly) => !butterfly.isExiting).length,
)

const confirmingDeleteId = ref<number | null>(null)

function removeIcon(id: number) {
  smartbarStore.removeFromEditableIcons(id)
  confirmingDeleteId.value = null
}

function isActiveRoute(icon: SmartIcon) {
  return !!icon.link && route.path.startsWith(icon.link)
}

function computedLabel(icon: SmartIcon): string {
  if (icon.type !== 'utility') return icon.label || ''
  switch (icon.component) {
    case 'theme-icon':
      return themeStore.currentTheme || ''
    case 'login-icon':
      return userStore.isLoggedIn
        ? userStore.user?.username || 'User'
        : 'Login?'
    case 'jellybean-icon':
      return `${milestoneStore.milestoneCountForUser || 0} /11`
    case 'swarm-icon':
      return activeButterflyCount.value > 0
        ? `${activeButterflyCount.value} Butterflies`
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
  const dx = e.clientX - startX
  scrollContainer.value.scrollLeft = scrollStart - dx
}

function handleScrollMouseUp() {
  isDragging.value = false
}

function handleScrollTouchStart(e: TouchEvent) {
  if (!scrollContainer.value) return
  isDragging.value = true
  startX = e.touches[0]?.clientX || 0
  scrollStart = scrollContainer.value.scrollLeft
}

function handleScrollTouchMove(e: TouchEvent) {
  if (!isDragging.value || !scrollContainer.value) return
  const currentX = e.touches[0]?.clientX || 0
  const dx = currentX - startX
  scrollContainer.value.scrollLeft = scrollStart - dx
}

function handleScrollTouchEnd() {
  isDragging.value = false
}

function handleWheel(e: WheelEvent) {
  const el = scrollContainer.value
  if (!el) return
  if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
    el.scrollLeft += e.deltaY
  } else {
    el.scrollLeft += e.deltaX
  }
}

async function refreshScrollState() {
  await nextTick()
  updateScrollFlags()
}

watch(
  () => rowIcons.value.length,
  async () => {
    await refreshScrollState()
  },
)

watch(
  () => displayStore.bigMode,
  async () => {
    await refreshScrollState()
  },
)

onMounted(async () => {
  await refreshScrollState()
  window.addEventListener('resize', updateScrollFlags)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateScrollFlags)
})
</script>
