<!-- /pages/coloring-page.vue -->
<!--
  Coloring Page Maker — a focused, prominent home for the image → coloring-page
  conversion. It's a thin wrapper around the shared <art-styler> component,
  preset to the COLORING_STYLES list so the whole surface is about one thing:
  turn any photo or design into printable line art. The full style catalog
  still lives in the Styler tab; this is the one-tap front door.
-->
<template>
  <div class="mx-auto flex w-full max-w-4xl flex-col gap-4 p-4 sm:p-6">
    <header class="flex flex-col gap-2">
      <div class="flex flex-wrap items-center gap-2">
        <span class="text-3xl leading-none">🖍️</span>
        <h1 class="text-2xl font-black text-base-content sm:text-3xl">
          Coloring Page Maker
        </h1>
        <span class="badge badge-primary badge-sm font-bold">New</span>
      </div>
      <p class="max-w-2xl text-sm text-base-content/60">
        Turn any photo or finished design into a printable black-and-white
        coloring page. Upload an image or pick one from your gallery, choose
        <b class="text-base-content/80">Coloring Page</b> for crisp line art or
        <b class="text-base-content/80">Bold Coloring</b> for thick,
        kid-friendly outlines, then generate, download, and print.
      </p>
    </header>

    <art-styler
      :styles="COLORING_STYLES"
      :source-image-id="sourceImageId"
      selected-style-key="coloring-page"
      :show-close="false"
    />
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
