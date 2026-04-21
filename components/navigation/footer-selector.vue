<!-- /components/navigation/footer-selector.vue -->
<template>
  <div
    class="relative flex h-full w-full items-center overflow-hidden rounded-2xl border border-base-300 bg-base-100/80 shadow-inner"
    @mouseenter="pauseDrift"
    @mouseleave="resumeDrift"
  >
    <div
      class="pointer-events-none absolute inset-y-2 left-1/2 z-20 w-1 -translate-x-1/2 rounded-full bg-accent opacity-35"
    />

    <div
      ref="scrollRef"
      class="no-scrollbar flex h-full w-full items-center gap-4 overflow-x-auto px-6 py-4 scroll-smooth"
      @scroll="handleScroll"
      @pointerdown="handlePointerDown"
      @pointerup="handlePointerUp"
      @pointercancel="handlePointerUp"
    >
      <button
        v-for="(item, i) in loopedItems"
        :key="`${item.name}-${i}`"
        type="button"
        class="group relative flex shrink-0 flex-col justify-between rounded-2xl border p-4 text-left transition-all duration-300 ease-out"
        :class="cardClass(i)"
        @click="selectIndex(i)"
      >
        <div class="flex items-start justify-between gap-3">
          <div class="flex min-w-0 items-center gap-3">
            <div
              class="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border"
              :class="
                isSelected(i)
                  ? 'border-primary-content/20 bg-primary-content/10'
                  : 'border-base-300 bg-base-100'
              "
            >
              <icon :name="item.icon" class="h-5 w-5" />
            </div>

            <div class="min-w-0">
              <div class="truncate text-sm font-bold sm:text-base">
                {{ item.label }}
              </div>
              <div
                class="mt-0.5 line-clamp-2 text-xs"
                :class="
                  isSelected(i)
                    ? 'text-primary-content/80'
                    : 'text-base-content/70'
                "
              >
                {{ item.tagline }}
              </div>
            </div>
          </div>

          <div
            class="rounded-full px-2 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.18em]"
            :class="
              isSelected(i)
                ? 'bg-primary-content/15 text-primary-content'
                : 'bg-base-300 text-base-content/70'
            "
          >
            {{ item.badge }}
          </div>
        </div>

        <div
          class="mt-4 rounded-2xl border px-3 py-3"
          :class="
            isSelected(i)
              ? 'border-primary-content/15 bg-primary-content/10'
              : 'border-base-300 bg-base-100'
          "
        >
          <div class="flex items-end gap-2">
            <div
              v-for="bar in item.previewBars"
              :key="`${item.name}-${bar}`"
              class="rounded-full transition-all duration-300"
              :class="isSelected(i) ? 'bg-primary-content/75' : 'bg-accent/70'"
              :style="{
                width: `${bar}%`,
                height: isSelected(i) ? '0.6rem' : '0.45rem',
              }"
            />
          </div>

          <div
            class="mt-3 text-[0.7rem] uppercase tracking-[0.16em]"
            :class="
              isSelected(i) ? 'text-primary-content/75' : 'text-base-content/50'
            "
          >
            {{ item.previewLabel }}
          </div>
        </div>

        <div
          v-if="isSelected(i)"
          class="pointer-events-none absolute inset-x-3 -bottom-2 h-3 rounded-full bg-primary/30 blur-md"
        />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
// /components/navigation/footer-selector.vue
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'

type FooterName = 'fx' | 'kind' | 'art'

type FooterOption = {
  name: FooterName
  label: string
  tagline: string
  icon: string
  badge: string
  previewLabel: string
  previewBars: number[]
}

const displayStore = useDisplayStore()

const options: FooterOption[] = [
  {
    name: 'fx',
    label: 'Screen FX',
    tagline: 'Ambient shimmer and weird little visual drama',
    icon: 'kind-icon:stars',
    badge: 'Glow',
    previewLabel: 'Animated effects footer',
    previewBars: [18, 44, 30, 62],
  },
  {
    name: 'kind',
    label: 'Kind Footer',
    tagline: 'Classic home-base footer with civilized vibes',
    icon: 'kind-icon:heart',
    badge: 'Core',
    previewLabel: 'Standard navigation footer',
    previewBars: [56, 26, 38],
  },
  {
    name: 'art',
    label: 'Art Generator',
    tagline: 'Prompt goblin controls with maximum ambition',
    icon: 'kind-icon:palette',
    badge: 'Create',
    previewLabel: 'Interactive art controls',
    previewBars: [22, 70, 40, 34],
  },
]

const scrollRef = ref<HTMLElement | null>(null)
const selectedIndex = ref(options.length)
const isPointerDown = ref(false)
const isPaused = ref(false)

let driftTimer: number | null = null
let snapTimer: number | null = null
let syncingScroll = false

const loopedItems = computed<FooterOption[]>(() => [
  ...options,
  ...options,
  ...options,
])

function getRealIndex(index: number): number {
  return ((index % options.length) + options.length) % options.length
}

function isSelected(index: number): boolean {
  return index === selectedIndex.value
}

function cardClass(index: number): string {
  if (isSelected(index)) {
    return 'h-32 w-80 scale-105 border-primary bg-primary text-primary-content shadow-xl'
  }

  const distance = Math.abs(index - selectedIndex.value)

  if (distance === 1) {
    return 'h-28 w-72 scale-[0.98] border-base-300 bg-base-200 text-base-content shadow-md hover:border-accent hover:bg-base-300'
  }

  return 'h-24 w-64 scale-95 border-base-300 bg-base-200/90 text-base-content/85 shadow-sm hover:border-accent hover:bg-base-300'
}

function setFooterFromIndex(index: number): void {
  const selected = options[getRealIndex(index)]
  if (!selected) return
  displayStore.setFooterComponent(selected.name)
}

function centerOnIndex(
  index: number,
  behavior: ScrollBehavior = 'smooth',
): void {
  const el = scrollRef.value
  if (!el) return

  const child = el.children[index]
  if (!(child instanceof HTMLElement)) return

  const targetLeft =
    child.offsetLeft - el.clientWidth / 2 + child.offsetWidth / 2

  el.scrollTo({
    left: targetLeft,
    behavior,
  })
}

function selectIndex(index: number): void {
  selectedIndex.value = index
  setFooterFromIndex(index)
  centerOnIndex(index, 'smooth')
}

function normalizeLoopPosition(): void {
  const el = scrollRef.value
  if (!el || syncingScroll) return

  const totalSetWidth = el.scrollWidth / 3
  if (!Number.isFinite(totalSetWidth) || totalSetWidth <= 0) return

  if (el.scrollLeft < totalSetWidth * 0.5) {
    syncingScroll = true
    el.scrollLeft += totalSetWidth
    syncingScroll = false
    return
  }

  if (el.scrollLeft > totalSetWidth * 1.5) {
    syncingScroll = true
    el.scrollLeft -= totalSetWidth
    syncingScroll = false
  }
}

function updateSelectedFromScroll(): void {
  const el = scrollRef.value
  if (!el) return

  const center = el.scrollLeft + el.clientWidth / 2
  let closest = 0
  let closestDist = Infinity

  Array.from(el.children).forEach((child, index) => {
    const item = child as HTMLElement
    const itemCenter = item.offsetLeft + item.offsetWidth / 2
    const dist = Math.abs(center - itemCenter)

    if (dist < closestDist) {
      closestDist = dist
      closest = index
    }
  })

  selectedIndex.value = closest
  setFooterFromIndex(closest)
}

function scheduleSnap(): void {
  if (snapTimer) {
    window.clearTimeout(snapTimer)
  }

  snapTimer = window.setTimeout(() => {
    if (isPointerDown.value) return
    centerOnIndex(selectedIndex.value, 'smooth')
  }, 120)
}

function handleScroll(): void {
  normalizeLoopPosition()
  updateSelectedFromScroll()
  scheduleSnap()
}

function handlePointerDown(): void {
  isPointerDown.value = true
  pauseDrift()
}

function handlePointerUp(): void {
  isPointerDown.value = false
  scheduleSnap()
  resumeDrift()
}

function pauseDrift(): void {
  isPaused.value = true

  if (driftTimer) {
    window.clearInterval(driftTimer)
    driftTimer = null
  }
}

function resumeDrift(): void {
  isPaused.value = false
  startDrift()
}

function startDrift(): void {
  if (driftTimer || isPaused.value) return

  driftTimer = window.setInterval(() => {
    const el = scrollRef.value
    if (!el || isPointerDown.value) return

    el.scrollLeft += 0.45
  }, 16)
}

onMounted(async () => {
  await nextTick()

  const el = scrollRef.value
  if (!el) return

  const start = options.length
  selectedIndex.value = start
  setFooterFromIndex(start)
  centerOnIndex(start, 'auto')
  startDrift()
})

onBeforeUnmount(() => {
  if (driftTimer) {
    window.clearInterval(driftTimer)
  }

  if (snapTimer) {
    window.clearTimeout(snapTimer)
  }
})
</script>

<style scoped>
.no-scrollbar::-webkit-scrollbar {
  display: none;
}

.no-scrollbar {
  scrollbar-width: none;
}
</style>
