<!-- /components/navigation/footer-selector.vue -->
<template>
  <div
    class="relative flex h-full w-full items-center overflow-hidden rounded-2xl border border-base-300 bg-base-100/70"
  >
    <div
      ref="scrollRef"
      class="no-scrollbar flex h-full gap-4 overflow-x-auto px-6 py-4"
      @scroll="handleScroll"
    >
      <button
        v-for="(item, i) in loopedItems"
        :key="`${item.name}-${i}`"
        type="button"
        class="group flex h-28 w-72 shrink-0 flex-col justify-between rounded-2xl border p-4 text-left transition-all duration-200"
        :class="{
          'scale-105 border-primary bg-primary text-primary-content shadow-xl':
            isSelected(i),
          'border-base-300 bg-base-200 text-base-content hover:border-accent hover:bg-base-300':
            !isSelected(i),
        }"
        @click="selectIndex(i)"
      >
        <div class="flex items-center justify-between gap-3">
          <div class="flex items-center gap-3">
            <icon :name="item.icon" class="h-6 w-6 shrink-0" />
            <div class="min-w-0">
              <div class="truncate text-sm font-bold sm:text-base">
                {{ item.label }}
              </div>
              <div
                class="truncate text-xs opacity-70"
                :class="{ 'text-primary-content/80': isSelected(i) }"
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
            Footer
          </div>
        </div>

        <div
          class="mt-3 flex h-10 items-end gap-2 overflow-hidden rounded-xl border border-black/10 px-3 py-2"
          :class="isSelected(i) ? 'bg-primary-content/10' : 'bg-base-100'"
        >
          <div
            v-for="bar in item.previewBars"
            :key="bar"
            class="rounded-full"
            :class="isSelected(i) ? 'bg-primary-content/70' : 'bg-accent/70'"
            :style="{ width: `${bar}%`, height: '0.45rem' }"
          />
        </div>
      </button>
    </div>

    <div
      class="pointer-events-none absolute inset-y-3 left-1/2 w-1 -translate-x-1/2 rounded-full bg-accent opacity-30"
    />
  </div>
</template>

<script setup lang="ts">
// /components/navigation/footer-selector.vue
import { computed, onMounted, ref } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'

type FooterName = 'fx' | 'kind' | 'art'

type FooterOption = {
  name: FooterName
  label: string
  tagline: string
  icon: string
  previewBars: number[]
}

const displayStore = useDisplayStore()

const options: FooterOption[] = [
  {
    name: 'fx',
    label: 'Screen FX',
    tagline: 'Glowy weird little ambience machine',
    icon: 'kind-icon:stars',
    previewBars: [24, 52, 36, 68],
  },
  {
    name: 'kind',
    label: 'Kind Footer',
    tagline: 'Classic footer energy, civilized but cute',
    icon: 'kind-icon:heart',
    previewBars: [60, 30, 44],
  },
  {
    name: 'art',
    label: 'Art Generator',
    tagline: 'Prompt goblin with buttons and ambition',
    icon: 'kind-icon:palette',
    previewBars: [20, 72, 48, 35],
  },
]

const scrollRef = ref<HTMLElement | null>(null)
const selectedIndex = ref(options.length)

const loopedItems = computed<FooterOption[]>(() => [
  ...options,
  ...options,
  ...options,
])

function getRealIndex(index: number): number {
  return ((index % options.length) + options.length) % options.length
}

function isSelected(i: number): boolean {
  return i === selectedIndex.value
}

function selectIndex(i: number): void {
  selectedIndex.value = i
  const selected = options[getRealIndex(i)]

  if (!selected) return

  displayStore.setFooterComponent(selected.name)

  const el = scrollRef.value
  if (!el) return

  const child = el.children[i]
  if (!(child instanceof HTMLElement)) return

  const targetLeft =
    child.offsetLeft - el.clientWidth / 2 + child.offsetWidth / 2

  el.scrollTo({
    left: targetLeft,
    behavior: 'smooth',
  })
}

function handleScroll(): void {
  const el = scrollRef.value
  if (!el) return

  const center = el.scrollLeft + el.clientWidth / 2

  let closest = 0
  let closestDist = Infinity

  Array.from(el.children).forEach((child, i) => {
    const item = child as HTMLElement
    const itemCenter = item.offsetLeft + item.offsetWidth / 2
    const dist = Math.abs(center - itemCenter)

    if (dist < closestDist) {
      closestDist = dist
      closest = i
    }
  })

  selectedIndex.value = closest

  const selected = options[getRealIndex(closest)]
  if (!selected) return

  displayStore.setFooterComponent(selected.name)

  const totalSetWidth = el.scrollWidth / 3
  if (el.scrollLeft < totalSetWidth * 0.5) {
    el.scrollLeft += totalSetWidth
    return
  }

  if (el.scrollLeft > totalSetWidth * 1.5) {
    el.scrollLeft -= totalSetWidth
  }
}

onMounted(() => {
  const el = scrollRef.value
  if (!el) return

  const start = options.length
  selectedIndex.value = start

  const child = el.children[start]
  if (!(child instanceof HTMLElement)) return

  el.scrollLeft = child.offsetLeft - el.clientWidth / 2 + child.offsetWidth / 2

  const selected = options[getRealIndex(start)]
  if (!selected) return

  displayStore.setFooterComponent(selected.name)
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
