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

    <art-styler :styles="COLORING_STYLES" :show-close="false" />
  </div>
</template>

<script setup lang="ts">
import { COLORING_STYLES } from '@/stores/helpers/styleHelper'
</script>
