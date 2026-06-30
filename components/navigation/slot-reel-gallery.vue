<!-- /components/navigation/slot-reel-gallery.vue -->
<template>
  <div ref="containerEl" class="relative h-full min-h-72 overflow-hidden rounded-2xl bg-base-300/40">
    <div class="pointer-events-none absolute inset-x-0 top-0 z-20 h-24 bg-gradient-to-b from-base-100 to-transparent" />
    <div class="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-24 bg-gradient-to-t from-base-100 to-transparent" />

    <div
      class="pointer-events-none absolute inset-x-2 z-10 rounded-xl ring-1 ring-primary/50"
      :style="windowStyle"
      aria-hidden="true"
    />

    <div class="flex h-full gap-2 p-2">
      <div
        v-for="(col, ci) in columns"
        :key="ci"
        class="relative min-w-0 flex-1 overflow-hidden"
        @mouseenter="pausedCol = ci"
        @mouseleave="pausedCol = -1"
      >
        <div class="reel-track" :class="{ 'reel-paused': pausedCol === ci }" :style="trackStyle(ci, col.length / 2)">
          <div
            v-for="(item, ii) in col"
            :key="`${ci}-${ii}-${item.id}`"
            class="reel-item group relative w-full cursor-pointer overflow-hidden rounded-xl border border-base-300/50 bg-base-200 transition-all hover:border-primary/70 hover:shadow-lg hover:shadow-primary/10"
            @click="$emit('select', { id: item.id })"
          >
            <img
              v-if="item.imagePath"
              :src="item.imagePath"
              :alt="item.title"
              class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
              loading="lazy"
            />
            <div
              v-else
              class="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10"
            >
              <Icon name="kind-icon:image" class="h-8 w-8 text-base-content/20" />
            </div>
            <div class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-base-300/90 to-transparent px-2 pb-1.5 pt-8">
              <p class="truncate text-center text-xs font-black text-base-content drop-shadow">
                {{ item.title || `#${item.id}` }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div
      v-if="!items.length"
      class="absolute inset-0 z-30 flex flex-col items-center justify-center gap-3 text-center"
    >
      <Icon name="kind-icon:gallery" class="h-14 w-14 text-base-content/20" />
      <p class="text-sm font-black text-base-content/40">Nothing in the reel yet.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import type { CSSProperties } from 'vue'

interface GalleryItem {
  id: number | string
  title: string
  imagePath: string
  description: string
}

const props = withDefaults(
  defineProps<{
    items: GalleryItem[]
    itemH?: number
  }>(),
  {
    itemH: 176,
  },
)

defineEmits<{
  select: [{ id: number | string }]
}>()

const ITEM_GAP = 8
const COL_SPEEDS_PX_S = [28, 20, 15, 24]

const containerEl = ref<HTMLElement | null>(null)
const pausedCol = ref(-1)
const effectiveColCount = ref(3)

function updateColCount() {
  if (!import.meta.client) return
  const w = containerEl.value?.clientWidth ?? window.innerWidth
  effectiveColCount.value = w < 480 ? 2 : 3
}

onMounted(() => {
  updateColCount()
  window.addEventListener('resize', updateColCount)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateColCount)
})

const columns = computed<GalleryItem[][]>(() => {
  if (!props.items.length) return []
  const count = Math.min(effectiveColCount.value, props.items.length)
  const cols: GalleryItem[][] = Array.from({ length: count }, () => [])

  props.items.forEach((item, i) => {
    cols[i % count]!.push(item)
  })

  return cols.map((col) => {
    let base = col
    while (base.length < 4) base = [...base, ...base]
    return [...base, ...base]
  })
})

const unitH = computed(() => props.itemH + ITEM_GAP)

const windowStyle = computed<CSSProperties>(() => ({
  top: '88px',
  height: `${props.itemH}px`,
  boxShadow: '0 0 32px 6px hsl(var(--p) / 0.12)',
}))

function trackStyle(ci: number, singleCount: number): CSSProperties {
  const singleH = singleCount * unitH.value
  const speed = COL_SPEEDS_PX_S[ci % COL_SPEEDS_PX_S.length] ?? 20
  const durationMs = Math.max(3000, Math.round((singleH / speed) * 1000))

  return {
    '--item-h': `${props.itemH}px`,
    '--item-gap': `${ITEM_GAP}px`,
    '--single-h': `${singleH}px`,
    '--reel-duration': `${durationMs}ms`,
  } as CSSProperties
}
</script>

<style scoped>
.reel-track {
  display: flex;
  flex-direction: column;
  will-change: transform;
  animation: reel-scroll-up var(--reel-duration) linear infinite;
}

.reel-track.reel-paused {
  animation-play-state: paused;
}

.reel-item {
  height: var(--item-h);
  flex-shrink: 0;
  margin-bottom: var(--item-gap);
}

@keyframes reel-scroll-up {
  from {
    transform: translateY(0);
  }
  to {
    transform: translateY(calc(-1 * var(--single-h)));
  }
}

@media (prefers-reduced-motion: reduce) {
  .reel-track {
    animation: none;
  }
}
</style>
