<!-- /components/navigation/footer-selector.vue -->
<template>
  <div class="relative flex h-full w-full items-center overflow-hidden">
    <div
      ref="scrollRef"
      class="no-scrollbar flex overflow-x-auto px-8 py-2 gap-4"
      @scroll="handleScroll"
    >
      <div
        v-for="(item, i) in loopedItems"
        :key="`${item.name}-${i}`"
        class="flex h-24 w-64 shrink-0 cursor-pointer items-center justify-center rounded-2xl border transition-all duration-200"
        :class="{
          'bg-primary text-white scale-105 shadow-xl': isSelected(i),
          'bg-base-200 hover:bg-base-300': !isSelected(i),
        }"
        @click="selectIndex(i)"
      >
        <component
          :is="item.component"
          class="pointer-events-none h-full w-full"
        />
      </div>
    </div>

    <div
      class="pointer-events-none absolute inset-y-0 left-1/2 w-1 -translate-x-1/2 bg-accent opacity-40"
    />
  </div>
</template>

<script setup lang="ts">
// /components/navigation/footer-selector.vue
import { computed, onMounted, ref } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'
import ScreenFx from '@/components/screenfx/screen-fx.vue'
import KindFooter from '@/components/layout/kind-footer.vue'
import ArtGenerator from '@/components/art/art-generator.vue'

type FooterName = 'fx' | 'kind' | 'art'

type FooterOption = {
  name: FooterName
  component: object
}

const displayStore = useDisplayStore()

const options: FooterOption[] = [
  { name: 'fx', component: ScreenFx },
  { name: 'kind', component: KindFooter },
  { name: 'art', component: ArtGenerator },
]

const scrollRef = ref<HTMLElement | null>(null)
const selectedIndex = ref(0)

const loopedItems = computed<FooterOption[]>(() => [
  ...options,
  ...options,
  ...options,
])

function selectIndex(i: number) {
  selectedIndex.value = i
  const realIndex = i % options.length
  const selected = options[realIndex]

  if (!selected) return

  displayStore.setFooterComponent(selected.name)
}

function isSelected(i: number) {
  return i === selectedIndex.value
}

function handleScroll() {
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
}

onMounted(() => {
  const el = scrollRef.value
  if (!el) return

  const start = options.length
  const child = el.children[start]

  if (!(child instanceof HTMLElement)) return

  el.scrollLeft = child.offsetLeft - el.clientWidth / 2 + child.offsetWidth / 2
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
