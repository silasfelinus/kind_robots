<template>
  <main class="kr-surface">
    <div class="kr-scroll mx-auto w-full max-w-[1500px] px-2 py-2 sm:px-4">
      <div v-if="!user.initialized" class="grid min-h-96 place-items-center">
        <span class="kr-spinner-lg-primary" />
      </div>
      <div
        v-else-if="!user.isAdmin"
        class="kr-note kr-note-error mx-auto mt-12 max-w-xl p-8 text-center"
      >
        This pinball table is in its private engineering workshop.
      </div>
      <template v-else>
        <div v-if="!webglReady" class="kr-note kr-note-error p-5">
          This 3D pinball table requires a browser with WebGL enabled.
        </div>
        <section v-else class="zuzu-game-stage" aria-label="Zuzu Pinball game">
          <ArcadeCabinet slug="zuzu-pinball" />
        </section>

        <details
          class="mt-4 rounded-2xl border border-base-content/15 bg-base-200/50"
        >
          <summary class="cursor-pointer px-4 py-3 text-sm font-semibold">
            Workshop tools · insert light-map editor
          </summary>
          <div class="p-2 sm:p-4">
            <ArcadePinballLightMap :table="ZUZU_LAST_BELL_GREYBOX" />
          </div>
        </details>
      </template>
    </div>
  </main>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useUserStore } from '~/stores/userStore'
import { canRenderWebGL } from '~/utils/arcade/games'
import { ZUZU_LAST_BELL_GREYBOX } from '~/utils/arcade/pinball/tables/zuzuLastBell/table'

const user = useUserStore()
const webglReady = ref(true)

onMounted(async () => {
  webglReady.value = canRenderWebGL()
  await user.initialize()
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
