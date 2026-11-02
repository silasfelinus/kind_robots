<template>
  <main class="kr-surface">
    <div
      class="mx-auto flex h-full min-h-0 w-full max-w-[1500px] flex-col gap-2 px-2 py-2 sm:px-4"
    >
      <div v-if="!webglReady" class="kr-note kr-note-error p-5">
        This 3D pinball table requires a browser with WebGL enabled.
      </div>
      <section
        v-else
        class="zuzu-game-stage kr-scroll min-h-0 flex-1"
        aria-label="Zuzu Pinball game"
      >
        <ArcadeCabinet slug="zuzu-pinball" />
      </section>
    </div>
  </main>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { canRenderWebGL } from '~/utils/arcade/games'

useSeoMeta(
  gameLinkPreviewMeta('zuzu-pinball', useRuntimeConfig().public.appBaseUrl) ??
    {},
)
const webglReady = ref(true)

onMounted(() => {
  webglReady.value = canRenderWebGL()
})
</script>

<style scoped>
.zuzu-game-stage :deep(.cabinet-marquee),
.zuzu-game-stage :deep(.cabinet-title-plate),
.zuzu-game-stage :deep(.cabinet-hint) {
  display: none;
}

.zuzu-game-stage :deep(.cabinet-screen-wrap) {
  padding: 0.25rem;
}

.zuzu-game-stage :deep(.cabinet-bezel) {
  padding: clamp(0.35rem, 1.5%, 1rem);
}

.zuzu-game-stage :deep(.cabinet-panel) {
  gap: 0.35rem;
  padding: 0.5rem;
}

.zuzu-game-stage :deep(.arcade-cabinet--fullscreen .cabinet-screen-wrap) {
  padding: 0.5rem;
}

.zuzu-game-stage :deep(.arcade-cabinet--fullscreen .cabinet-bezel) {
  padding: 0;
}
</style>
