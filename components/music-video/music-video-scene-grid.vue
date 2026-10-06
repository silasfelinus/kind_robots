<!-- /components/music-video/music-video-scene-grid.vue -->
<template>
  <section v-if="scenes.length" class="space-y-3">
    <div class="flex flex-wrap items-center justify-between gap-2">
      <h2 class="kr-text-black-xl text-base-content">Scenes</h2>
      <span class="kr-text-dim-sm">
        Tick the hero shots to animate; every other scene pans and zooms.
      </span>
    </div>

    <ul
      class="grid gap-3 grid-cols-[repeat(auto-fill,minmax(min(100%,15rem),1fr))]"
    >
      <li
        v-for="(scene, index) in scenes"
        :key="scene.id"
        class="kr-panel flex flex-col gap-2 p-2"
        :class="{ 'ring-2 ring-primary': heroIds.has(scene.id) }"
      >
        <div class="relative">
          <img
            v-if="
              scene.image.artImageId &&
              store.previewUrls[scene.image.artImageId]
            "
            :src="store.previewUrls[scene.image.artImageId]"
            :alt="scene.prompt || `Scene ${index + 1}`"
            class="aspect-video w-full rounded-lg object-cover"
            loading="lazy"
          />
          <div
            v-else
            class="kr-text-dim-sm grid aspect-video place-items-center rounded-lg bg-base-200"
          >
            {{ stillLabel(scene.id, scene.image.artImageId) }}
          </div>
          <span
            class="kr-badge-outline absolute left-1.5 top-1.5 bg-base-100/90"
          >
            {{ index + 1 }}
          </span>
        </div>

        <div class="flex flex-wrap gap-1">
          <span class="kr-badge-outline">
            {{ scene.startSec }}s–{{ scene.endSec }}s
          </span>
          <span class="kr-badge-outline">{{ motionLabel(scene) }}</span>
          <span
            v-if="scene.image.source !== 'generated'"
            class="kr-badge-outline"
          >
            {{ scene.image.source === 'upload' ? 'Your image' : 'Gallery art' }}
          </span>
        </div>

        <p class="kr-text-dim-sm line-clamp-3">
          {{ scene.prompt || 'No prompt yet.' }}
        </p>
        <p v-if="errorFor(scene.id)" class="text-xs text-error">
          {{ errorFor(scene.id) }}
        </p>

        <div class="mt-auto flex flex-wrap items-center gap-2">
          <label class="flex items-center gap-1 text-sm">
            <input
              type="checkbox"
              class="checkbox checkbox-sm"
              :checked="heroIds.has(scene.id)"
              :disabled="!scene.image.artImageId"
              @change="toggleHero(scene.id)"
            />
            Hero shot
          </label>
          <button
            v-if="scene.image.source === 'generated' && scene.prompt"
            type="button"
            class="kr-btn kr-btn-xs"
            :disabled="Boolean(store.busyAction)"
            @click="onRerender(scene.id, Boolean(scene.image.artImageId))"
          >
            {{ scene.image.artImageId ? 'Re-render' : 'Render' }}
          </button>
          <label
            class="kr-btn kr-btn-xs"
            :class="{ 'pointer-events-none opacity-50': store.busyAction }"
          >
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              class="hidden"
              :disabled="Boolean(store.busyAction)"
              @change="onReplace(scene.id, $event)"
            />
            Replace image
          </label>
        </div>
      </li>
    </ul>

    <div class="kr-panel flex flex-wrap items-center gap-2 p-3">
      <span class="text-sm">
        {{ heroIds.size }} hero shot{{ heroIds.size === 1 ? '' : 's' }}
        selected
      </span>
      <select
        v-model="presetId"
        class="kr-input w-auto"
        aria-label="Clip preset"
      >
        <option value="">Default clip preset</option>
        <option v-for="preset in presets" :key="preset.id" :value="preset.id">
          {{ preset.label }} ({{ preset.engine }}, {{ preset.runtimeTier }})
        </option>
      </select>
      <button
        type="button"
        class="kr-btn kr-btn-primary"
        :disabled="!heroIds.size || Boolean(store.busyAction)"
        @click="onAnimate"
      >
        <span v-if="store.busyAction === 'animate'" class="kr-spinner-xs" />
        Animate {{ heroIds.size || '' }} hero shot{{
          heroIds.size === 1 ? '' : 's'
        }}
      </button>
      <span class="kr-text-dim-sm">
        Each clip is 3–4 s of image-to-video on the local card and can take a
        long time; at most 8 per request.
      </span>
    </div>
  </section>
</template>

<script setup lang="ts">
// music-video/t-027: the scene grid. Silas, 2026-10-06: animate "4-5 hero
// shots" and let the rest pan and zoom, and replace a scene's image by hand.
import { computed, ref, watch } from 'vue'
import { useMusicVideoStore } from '@/stores/musicVideoStore'
import type { MusicVideoScene } from '@/utils/musicVideoDoc'
import { VIDEO_PRESETS } from '@/utils/videoPresets'

const store = useMusicVideoStore()
const heroIds = ref<Set<string>>(new Set())
const presetId = ref('')
const presets = VIDEO_PRESETS

const scenes = computed(() => store.current?.doc.scenes ?? [])

// A new video starts with nothing selected.
watch(
  () => store.current?.id,
  () => {
    heroIds.value = new Set()
  },
)

function toggleHero(sceneId: string) {
  const next = new Set(heroIds.value)
  if (next.has(sceneId)) next.delete(sceneId)
  else next.add(sceneId)
  heroIds.value = next
}

function stillLabel(sceneId: string, artImageId?: number): string {
  const status = store.sceneStatuses[sceneId]?.status
  if (status === 'PENDING') return 'Still queued'
  if (status === 'RUNNING') return 'Rendering still…'
  if (status === 'FAILED') return 'Still failed'
  return artImageId ? 'Loading preview…' : 'No art yet'
}

function motionLabel(scene: MusicVideoScene): string {
  const clip = store.sceneStatuses[scene.id]?.clipStatus
  if (clip === 'PENDING') return 'Clip queued'
  if (clip === 'RUNNING') return 'Animating…'
  if (clip === 'FAILED') return 'Clip failed'
  if (scene.motion.clipArtImageId) return 'Animated clip'
  return 'Pan and zoom'
}

function errorFor(sceneId: string): string {
  const row = store.sceneStatuses[sceneId]
  if (!row) return ''
  if (row.status === 'FAILED' && row.error) return `Still: ${row.error}`
  if (row.clipStatus === 'FAILED' && row.clipError) {
    return `Clip: ${row.clipError}`
  }
  return ''
}

async function onRerender(sceneId: string, hasImage: boolean) {
  if (hasImage && !window.confirm('Replace this scene’s still?')) return
  await store.renderScenes([sceneId], hasImage)
}

async function onReplace(sceneId: string, event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) await store.uploadSceneImage(sceneId, file)
  input.value = ''
}

async function onAnimate() {
  const ids = [...heroIds.value]
  const animated = scenes.value.filter(
    (scene) => ids.includes(scene.id) && scene.motion.clipArtImageId,
  )
  const force =
    animated.length > 0 &&
    window.confirm(
      `${animated.length} of these already have a clip. Replace those clips too?`,
    )
  const outcomes = await store.animateScenes(
    ids,
    presetId.value || undefined,
    force,
  )
  if (outcomes.some((outcome) => outcome.status === 'queued')) {
    heroIds.value = new Set()
  }
}
</script>
