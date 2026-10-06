<!-- /components/music-video/music-video-scene-card.vue -->
<template>
  <li class="kr-panel flex flex-col gap-2 p-2">
    <div class="relative">
      <video
        v-if="clipSrc && showClip"
        :src="clipSrc"
        class="aspect-video w-full rounded-lg bg-black object-cover"
        muted
        loop
        autoplay
        playsinline
      />
      <img
        v-else-if="stillSrc"
        :src="stillSrc"
        :alt="scene.prompt || `Scene ${index + 1}`"
        class="aspect-video w-full rounded-lg object-cover"
        loading="lazy"
      />
      <div
        v-else
        class="kr-text-dim-sm grid aspect-video place-items-center rounded-lg bg-base-200"
      >
        {{ stillLabel }}
      </div>
      <span class="kr-badge-outline absolute left-1.5 top-1.5 bg-base-100/90">
        {{ index + 1 }} · {{ scene.startSec }}s–{{ scene.endSec }}s
      </span>
      <button
        v-if="clipSrc"
        type="button"
        class="kr-btn kr-btn-xs absolute right-1.5 top-1.5"
        @click="showClip = !showClip"
      >
        {{ showClip ? 'Show still' : 'Play clip' }}
      </button>
    </div>

    <div class="flex flex-wrap gap-1">
      <span class="kr-badge-outline">{{ motionBadge }}</span>
      <span v-if="scene.image.source !== 'generated'" class="kr-badge-outline">
        {{ scene.image.source === 'upload' ? 'Your image' : 'Gallery art' }}
      </span>
    </div>
    <p v-if="errorText" class="text-xs text-error">{{ errorText }}</p>

    <!-- Image -->
    <fieldset class="space-y-1">
      <legend class="kr-text-dim-sm">Image</legend>
      <textarea
        v-model="draft.prompt"
        class="kr-input w-full text-sm"
        rows="3"
        :maxlength="limits.maxPrompt"
        placeholder="What this scene shows"
        aria-label="Scene prompt"
      />
      <div class="flex flex-wrap items-center gap-1">
        <button
          type="button"
          class="kr-btn kr-btn-xs"
          :disabled="busy || !draft.prompt.trim()"
          @click="onRender"
        >
          {{ scene.image.artImageId ? 'Re-render' : 'Render' }}
        </button>
        <label
          class="kr-btn kr-btn-xs"
          :class="{ 'pointer-events-none opacity-50': busy }"
        >
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            class="hidden"
            :disabled="busy"
            @change="onUpload"
          />
          Upload image
        </label>
        <input
          v-model.number="artImageId"
          class="kr-input w-24 text-sm"
          type="number"
          min="1"
          placeholder="Art #"
          aria-label="Use an existing ArtImage id"
        />
        <button
          type="button"
          class="kr-btn kr-btn-xs"
          :disabled="busy || !artImageId"
          @click="onUseArt"
        >
          Use art
        </button>
      </div>
    </fieldset>

    <!-- Motion -->
    <fieldset class="space-y-1">
      <legend class="kr-text-dim-sm">Motion</legend>
      <div class="flex flex-wrap items-center gap-1">
        <select
          v-model="draft.kind"
          class="kr-input w-auto text-sm"
          aria-label="Motion"
        >
          <option value="kenburns">Pan and zoom</option>
          <option value="clip">Animated clip</option>
        </select>
        <select
          v-if="draft.kind === 'kenburns'"
          v-model="draft.preset"
          class="kr-input w-auto text-sm"
          aria-label="Pan and zoom direction"
        >
          <option v-for="preset in kenBurns" :key="preset" :value="preset">
            {{ kenBurnsLabels[preset] }}
          </option>
        </select>
      </div>
      <template v-if="draft.kind === 'clip'">
        <textarea
          v-model="draft.motionPrompt"
          class="kr-input w-full text-sm"
          rows="2"
          :maxlength="limits.maxPrompt"
          placeholder="One camera move plus one action, e.g. slow push in as the hand closes on the hilt"
          aria-label="Animation prompt"
        />
        <div class="flex flex-wrap items-center gap-1">
          <select
            v-if="motionPresets.length"
            class="kr-input w-auto text-sm"
            aria-label="Apply an animation preset"
            @change="onApplyPreset"
          >
            <option value="">Apply preset…</option>
            <option
              v-for="preset in motionPresets"
              :key="preset.id"
              :value="preset.id"
            >
              {{ preset.name }}
            </option>
          </select>
          <label class="flex items-center gap-1 text-xs">
            <input
              v-model="draft.endOnNext"
              type="checkbox"
              class="checkbox checkbox-xs"
            />
            End on next scene's image
          </label>
        </div>
        <button
          type="button"
          class="kr-btn kr-btn-xs kr-btn-primary"
          :disabled="busy || !scene.image.artImageId"
          :title="
            scene.image.artImageId
              ? 'Queue an image-to-video clip from this still'
              : 'The scene needs an image first'
          "
          @click="onAnimate"
        >
          <span v-if="store.busyAction === 'animate'" class="kr-spinner-xs" />
          {{ scene.motion.clipArtImageId ? 'Re-animate' : 'Animate now' }}
        </button>
      </template>
    </fieldset>

    <!-- Transition -->
    <fieldset class="flex flex-wrap items-center gap-1">
      <legend class="kr-text-dim-sm">Into this scene</legend>
      <select
        v-model="draft.transition"
        class="kr-input w-auto text-sm"
        aria-label="Transition into this scene"
      >
        <option value="cut">Cut</option>
        <option value="crossfade">Crossfade</option>
      </select>
      <input
        v-if="draft.transition === 'crossfade'"
        v-model.number="draft.transitionSec"
        class="kr-input w-20 text-sm"
        type="number"
        min="0.1"
        :max="limits.maxTransitionSec"
        step="0.1"
        aria-label="Crossfade seconds"
      />
    </fieldset>

    <button
      v-if="dirty"
      type="button"
      class="kr-btn kr-btn-primary mt-auto"
      :disabled="store.saving"
      @click="save"
    >
      Save scene
    </button>
  </li>
</template>

<script setup lang="ts">
// music-video/t-030. Silas, 2026-10-06: the animate control belongs on each
// scene, "as well as being able to change/upload the image, change whether
// it's animated or to change panning direction".
import { computed, reactive, ref, watch } from 'vue'
import { useMusicVideoStore } from '@/stores/musicVideoStore'
import { MUSIC_VIDEO_LIMITS, type MusicVideoScene } from '@/utils/musicVideoDoc'
import {
  MUSIC_VIDEO_KEN_BURNS_PRESETS,
  sceneKenBurnsPreset,
  type MusicVideoKenBurnsPreset,
} from '@/utils/musicVideoMotion'

const props = defineProps<{
  scene: MusicVideoScene
  index: number
  /** The clip quality preset chosen above the grid ('' for the default). */
  clipPresetId: string
}>()

const store = useMusicVideoStore()
const limits = MUSIC_VIDEO_LIMITS
const kenBurns = MUSIC_VIDEO_KEN_BURNS_PRESETS
const kenBurnsLabels: Record<MusicVideoKenBurnsPreset, string> = {
  'zoom-in': 'Zoom in',
  'zoom-out': 'Zoom out',
  'pan-left': 'Pan left',
  'pan-right': 'Pan right',
}
const showClip = ref(true)
const artImageId = ref<number | ''>('')

type Draft = {
  prompt: string
  kind: 'kenburns' | 'clip'
  preset: MusicVideoKenBurnsPreset
  motionPrompt: string
  endOnNext: boolean
  transition: 'cut' | 'crossfade'
  transitionSec: number
}

function toDraft(scene: MusicVideoScene, index: number): Draft {
  return {
    prompt: scene.prompt,
    kind: scene.motion.kind,
    preset: sceneKenBurnsPreset(scene, index),
    motionPrompt: scene.motionPrompt ?? '',
    endOnNext: scene.motion.lastFrame === 'next-scene',
    transition: scene.transition,
    transitionSec: scene.transitionSec || 0.5,
  }
}

const draft = reactive<Draft>(toDraft(props.scene, props.index))
const saved = computed(() => JSON.stringify(toDraft(props.scene, props.index)))
const dirty = computed(() => JSON.stringify(draft) !== saved.value)
watch(saved, () => Object.assign(draft, toDraft(props.scene, props.index)))

const busy = computed(() => Boolean(store.busyAction) || store.saving)
const motionPresets = computed(
  () => store.current?.doc.settings.motionPresets ?? [],
)
const status = computed(() => store.sceneStatuses[props.scene.id])
const stillSrc = computed(() =>
  props.scene.image.artImageId
    ? (store.previewUrls[props.scene.image.artImageId] ?? '')
    : '',
)
const clipSrc = computed(() =>
  props.scene.motion.clipArtImageId
    ? (store.previewUrls[props.scene.motion.clipArtImageId] ?? '')
    : '',
)

const stillLabel = computed(() => {
  const value = status.value?.status
  if (value === 'PENDING') return 'Still queued'
  if (value === 'RUNNING') return 'Rendering still…'
  if (value === 'FAILED') return 'Still failed'
  return props.scene.image.artImageId ? 'Loading preview…' : 'No image yet'
})

const motionBadge = computed(() => {
  const clip = status.value?.clipStatus
  if (clip === 'PENDING') return 'Clip queued'
  if (clip === 'RUNNING') return 'Animating…'
  if (clip === 'FAILED') return 'Clip failed'
  if (props.scene.motion.clipArtImageId) return 'Animated clip'
  if (props.scene.motion.kind === 'clip') return 'To animate'
  return kenBurnsLabels[sceneKenBurnsPreset(props.scene, props.index)]
})

const errorText = computed(() => {
  const row = status.value
  if (!row) return ''
  if (row.status === 'FAILED' && row.error) return `Still: ${row.error}`
  if (row.clipStatus === 'FAILED' && row.clipError) {
    return `Clip: ${row.clipError}`
  }
  return ''
})

function applyDraft(scene: MusicVideoScene): MusicVideoScene {
  const motion: MusicVideoScene['motion'] =
    draft.kind === 'clip'
      ? {
          ...scene.motion,
          kind: 'clip',
          preset: draft.preset,
        }
      : // Back to pan and zoom: an old clip no longer plays.
        { kind: 'kenburns', preset: draft.preset }
  if (draft.kind === 'clip' && draft.endOnNext) motion.lastFrame = 'next-scene'
  else delete motion.lastFrame
  const next: MusicVideoScene = {
    ...scene,
    prompt: draft.prompt.trim(),
    promptSource:
      draft.prompt.trim() !== scene.prompt ? 'user' : scene.promptSource,
    motion,
    transition: draft.transition,
    transitionSec:
      draft.transition === 'crossfade'
        ? Math.min(Math.max(Number(draft.transitionSec) || 0.5, 0.1), 5)
        : 0,
  }
  const motionPrompt = draft.motionPrompt.trim()
  if (motionPrompt) next.motionPrompt = motionPrompt
  else delete next.motionPrompt
  return next
}

async function save(): Promise<boolean> {
  return store.updateScene(props.scene.id, applyDraft)
}

async function onRender() {
  if (dirty.value && !(await save())) return
  const replacing = Boolean(props.scene.image.artImageId)
  if (replacing && !window.confirm('Replace this scene’s image?')) return
  await store.renderScenes([props.scene.id], replacing)
}

async function onUpload(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) await store.uploadSceneImage(props.scene.id, file)
  input.value = ''
}

async function onUseArt() {
  const id = Number(artImageId.value)
  if (!Number.isInteger(id) || id <= 0) return
  if (await store.setSceneImage(props.scene.id, id)) artImageId.value = ''
}

function onApplyPreset(event: Event) {
  const select = event.target as HTMLSelectElement
  const preset = motionPresets.value.find((item) => item.id === select.value)
  if (preset) draft.motionPrompt = preset.prompt
  select.value = ''
}

async function onAnimate() {
  if (dirty.value && !(await save())) return
  const replacing = Boolean(props.scene.motion.clipArtImageId)
  if (replacing && !window.confirm('Replace this scene’s clip?')) return
  await store.animateScenes(
    [props.scene.id],
    props.clipPresetId || undefined,
    replacing,
  )
}
</script>
