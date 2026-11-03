<template>
  <div class="kr-surface kr-scroll h-full min-h-0">
    <HybridizerLab />
  </div>
</template>

<script setup lang="ts">
import HybridizerLab from '~/pages/admin/hybridizer.vue'
import { gameLinkPreviewMeta } from '~/utils/gameLinkPreview'

useSeoMeta(
  gameLinkPreviewMeta('hybridizer', useRuntimeConfig().public.appBaseUrl) ?? {},
)
</script>
