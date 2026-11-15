<template>
  <main
    class="kr-surface h-full min-h-0 overflow-hidden"
    data-layout="console-fixed"
  >
    <brainstorm-play-console />
  </main>
</template>

<script setup lang="ts">
import { gameLinkPreviewMeta } from '~/utils/gameLinkPreview'

useSeoMeta(
  gameLinkPreviewMeta('brainstorm', useRuntimeConfig().public.appBaseUrl) ?? {},
)
</script>
