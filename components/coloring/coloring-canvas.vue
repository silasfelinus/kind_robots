<!-- /components/coloring/coloring-canvas.vue -->
<template>
  <svg
    v-if="page.mode === 'svg-regions'"
    :viewBox="`0 0 ${page.viewBox.width} ${page.viewBox.height}`"
    class="h-auto w-full select-none rounded-2xl border border-base-300 bg-white"
    role="img"
    :aria-label="page.title || 'Coloring page'"
  >
    <image
      v-if="page.layers.underlay"
      :href="page.layers.underlay"
      x="0"
      y="0"
      :width="page.viewBox.width"
      :height="page.viewBox.height"
    />

    <path
      v-for="region in page.regions ?? []"
      :key="region.id"
      :d="region.d"
      :fill="fillFor(region.id)"
      stroke="#171312"
      stroke-width="3"
      stroke-linejoin="round"
      :class="interactive ? 'cursor-pointer transition-opacity' : ''"
      :opacity="
        selectedRegionIds?.length && !selectedRegionIds.includes(region.id)
          ? 0.92
          : 1
      "
      @click="interactive && emit('regionClick', region.id)"
    >
      <title v-if="region.label">{{ region.label }}</title>
    </path>

    <path
      v-if="page.layers.decor"
      :d="page.layers.decor"
      fill="none"
      stroke="#171312"
      stroke-width="4"
      stroke-linecap="round"
      pointer-events="none"
    />

    <image
      v-if="page.layers.lineArt"
      :href="page.layers.lineArt"
      x="0"
      y="0"
      :width="page.viewBox.width"
      :height="page.viewBox.height"
      pointer-events="none"
    />

    <template v-if="selectedRegionIds?.length">
      <path
        v-for="region in selectedRegions"
        :key="`ring-${region.id}`"
        :d="region.d"
        fill="none"
        stroke="oklch(var(--p))"
        stroke-width="6"
        stroke-dasharray="12 8"
        pointer-events="none"
      />
    </template>
  </svg>

  <div
    v-else
    class="flex min-h-40 flex-col items-center justify-center gap-2 rounded-2xl border border-warning/40 bg-warning/10 p-6 text-center"
  >
    <Icon name="kind-icon:alert" class="h-8 w-8 text-warning" />
    <p class="text-sm font-semibold text-warning">
      Raster coloring pages aren't supported yet — this page needs the
      flood-fill engine (coming with the generated sets).
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { BLANK_COLOR_VALUE } from '@/stores/helpers/coloring'
import type {
  ColoringPageDefinition,
  ColoringRegion,
} from '@/stores/helpers/coloring'

const props = withDefaults(
  defineProps<{
    page: ColoringPageDefinition
    /** regionId -> colorId; the canvas is controlled and never mutates this. */
    fills: Record<string, string>
    selectedRegionIds?: string[]
    interactive?: boolean
    /** Resolves a colorId to a hex value (store-owned palette lookup). */
    paletteResolver: (colorId: string) => string
  }>(),
  { selectedRegionIds: () => [], interactive: true },
)

const emit = defineEmits<{
  regionClick: [regionId: string]
}>()

const selectedRegions = computed<ColoringRegion[]>(() => {
  if (!props.selectedRegionIds?.length) return []

  return (props.page.regions ?? []).filter((region) =>
    props.selectedRegionIds!.includes(region.id),
  )
})

function fillFor(regionId: string): string {
  const colorId = props.fills[regionId]
  if (!colorId) return BLANK_COLOR_VALUE
  return props.paletteResolver(colorId)
}
</script>
