<!-- /pages/coloring-page.vue -->
<!--
  Coloring Page Maker — a focused, prominent home for the image → coloring-page
  conversion. It's a thin wrapper around the shared <art-styler> component,
  preset to the COLORING_STYLES list so the whole surface is about one thing:
  turn any photo or design into printable line art. The full style catalog
  still lives in the Styler tab; this is the one-tap front door.
-->
<template>
  <div class="kr-surface h-full min-h-0">
    <div class="kr-scroll kr-container-canvas flex flex-col gap-3 p-3 sm:p-4">
      <header class="flex items-start gap-3">
        <div
          class="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary"
        >
          <Icon name="kind-icon:magic" class="kr-icon-6" />
        </div>
        <div class="min-w-0 flex-1">
          <div class="flex flex-wrap items-center gap-2">
            <p
              class="text-2xl font-black tracking-tight text-base-content sm:text-3xl"
            >
              Coloring Page Maker
            </p>
            <span class="kr-badge-primary-sm font-bold">New</span>
          </div>
          <p class="kr-text-dim-sm max-w-3xl">
            Turn a photo or artwork into printable line art. Pick a source,
            choose your style, and create your next coloring page.
          </p>
        </div>
      </header>

      <art-styler
        :styles="COLORING_STYLES"
        :source-image-id="sourceImageId"
        selected-style-key="coloring-page"
        :show-close="false"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from '#app'
import { COLORING_STYLES } from '@/stores/helpers/styleHelper'

const route = useRoute()

// Deep link from a gallery image card: /coloring-page?imageId=123 lands here
// with that image already loaded as the source and "Coloring Page" preselected,
// so it's one tap to generate.
const sourceImageId = computed<number | null>(() => {
  const raw = Array.isArray(route.query.imageId)
    ? route.query.imageId[0]
    : route.query.imageId
  const id = Number(raw)
  return Number.isInteger(id) && id > 0 ? id : null
})
</script>
