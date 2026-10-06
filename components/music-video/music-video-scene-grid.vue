<!-- /components/music-video/music-video-scene-grid.vue -->
<template>
  <section v-if="scenes.length" class="space-y-3">
    <div class="flex flex-wrap items-center justify-between gap-2">
      <h2 class="kr-text-black-xl text-base-content">Scenes</h2>
      <span class="kr-text-dim-sm">
        Set a scene to "Animated clip" for a hero shot; every other scene pans
        and zooms.
      </span>
    </div>

    <div class="kr-panel flex flex-wrap items-center gap-2 p-2">
      <select
        v-model="clipPresetId"
        class="kr-input w-auto text-sm"
        aria-label="Clip quality preset"
      >
        <option value="">Default clip preset</option>
        <option v-for="preset in presets" :key="preset.id" :value="preset.id">
          {{ preset.label }} ({{ preset.engine }}, {{ preset.runtimeTier }})
        </option>
      </select>
      <button
        type="button"
        class="kr-btn kr-btn-primary"
        :disabled="!waiting.length || Boolean(store.busyAction)"
        @click="animateWaiting"
      >
        Animate {{ waiting.length }} marked scene{{
          waiting.length === 1 ? '' : 's'
        }}
      </button>
      <span class="kr-text-dim-sm">
        Each clip is 3–4 s of image-to-video on the local card and can take a
        long time.
      </span>
    </div>

    <ul
      class="grid gap-3 grid-cols-[repeat(auto-fill,minmax(min(100%,22rem),1fr))]"
    >
      <MusicVideoSceneCard
        v-for="(scene, index) in scenes"
        :key="scene.id"
        :scene="scene"
        :index="index"
        :clip-preset-id="clipPresetId"
      />
    </ul>
  </section>
</template>

<script setup lang="ts">
// music-video/t-030: the scene gallery. Each card carries its own image,
// motion and transition controls (music-video-scene-card).
import { computed, ref } from 'vue'
import { useMusicVideoStore } from '@/stores/musicVideoStore'
import { VIDEO_PRESETS } from '@/utils/videoPresets'

const store = useMusicVideoStore()
const clipPresetId = ref('')
const presets = VIDEO_PRESETS

const scenes = computed(() => store.current?.doc.scenes ?? [])

/** Marked "Animated clip", has its image, and no clip finished or queued. */
const waiting = computed(() =>
  scenes.value.filter((scene) => {
    if (scene.motion.kind !== 'clip') return false
    if (!scene.image.artImageId || scene.motion.clipArtImageId) return false
    const clip = store.sceneStatuses[scene.id]?.clipStatus
    return clip !== 'PENDING' && clip !== 'RUNNING'
  }),
)

async function animateWaiting() {
  await store.animateScenes(
    waiting.value.slice(0, 8).map((scene) => scene.id),
    clipPresetId.value || undefined,
  )
}
</script>
