<template>
  <div class="kr-surface kr-scroll h-full min-h-0">
    <SlimeCityGame />
  </div>
</template>

<script setup lang="ts">
import SlimeCityGame from '~/pages/admin/slime-city.vue'
import { gameLinkPreviewMeta } from '~/utils/gameLinkPreview'

useSeoMeta(
  gameLinkPreviewMeta('slime-city', useRuntimeConfig().public.appBaseUrl) ?? {},
)
</script>
