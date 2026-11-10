<template>
  <div class="kr-surface kr-scroll h-full min-h-0">
    <SlimeCitySplash v-if="!entered" @enter="entered = true" />
    <SlimeCityGame v-else />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import SlimeCityGame from '~/pages/admin/slime-city.vue'
import { gameLinkPreviewMeta } from '~/utils/gameLinkPreview'

const entered = ref(false)

useSeoMeta(
  gameLinkPreviewMeta('slime-city', useRuntimeConfig().public.appBaseUrl) ?? {},
)
</script>
