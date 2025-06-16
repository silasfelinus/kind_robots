// /components/content/art/art-info.vue
<template>
  <div class="space-y-2">
    <h2 class="text-xl font-bold">🖼️ Artwork Info</h2>

    <p v-if="art.promptString" class="text-sm text-base-content">
      <span class="font-semibold">Prompt:</span>
      {{ art.promptString }}
    </p>

    <p v-if="art.negativePrompt" class="text-sm text-base-content">
      <span class="font-semibold">Negative:</span>
      {{ art.negativePrompt }}
    </p>

    <p v-if="art.checkpoint" class="text-sm text-base-content">
      <span class="font-semibold">Model:</span> {{ art.checkpoint }}
    </p>

    <p v-if="art.sampler" class="text-sm text-base-content">
      <span class="font-semibold">Sampler:</span> {{ art.sampler }}
    </p>

    <p v-if="art.seed !== undefined" class="text-sm text-base-content">
      <span class="font-semibold">Seed:</span> {{ art.seed }}
    </p>

    <p v-if="art.steps" class="text-sm text-base-content">
      <span class="font-semibold">Steps:</span> {{ art.steps }}
    </p>

    <p v-if="art.cfg !== undefined" class="text-sm text-base-content">
      <span class="font-semibold">CFG:</span> {{ art.cfg
      }}<span v-if="art.cfgHalf">.5</span>
    </p>

    <p v-if="art.createdAt" class="text-sm text-base-content">
      <span class="font-semibold">Created:</span>
      {{ new Date(art.createdAt).toLocaleString() }}
    </p>

    <pre
      v-if="artImage?.imageData"
      class="bg-base-300 p-2 rounded-md text-xs whitespace-pre-wrap"
      >{{ artImage }}</pre
    >
  </div>
</template>

<script setup lang="ts">
import type { Art, ArtImage } from '@/stores/artStore.ts'

defineProps<{
  art: Art
  artImage?: ArtImage | null
}>()
</script>

<style scoped></style>
