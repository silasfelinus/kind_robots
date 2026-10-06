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

    <!-- Lyrics this scene carries, edited in place (t-032) -->
    <div v-if="draft.lyrics.length" class="space-y-0.5">
      <!-- field-sizing grows each line to fit, so long lyrics wrap in full -->
      <textarea
        v-for="line in draft.lyrics"
        :key="`${line.sectionId}:${line.lineIdx}`"
        v-model="line.text"
        class="kr-textarea min-h-0 py-1 text-sm italic leading-snug [field-sizing:content]"
        rows="1"
        :maxlength="limits.maxLine"
        aria-label="Lyric line"
      />
    </div>

    <div class="flex flex-wrap items-center gap-1">
      <button
        type="button"
        class="kr-btn kr-btn-xs"
        :class="{ 'kr-btn-primary': draft.kind === 'clip' }"
        :aria-pressed="draft.kind === 'clip'"
        title="Hero shots are animated as image-to-video clips"
        @click="draft.kind = draft.kind === 'clip' ? 'kenburns' : 'clip'"
      >
        {{ draft.kind === 'clip' ? '★ Hero' : '☆ Hero' }}
      </button>
      <select
        v-if="draft.kind === 'kenburns'"
        v-model="draft.preset"
        class="kr-input w-auto py-0 text-xs"
        aria-label="Pan and zoom direction"
      >
        <option v-for="preset in kenBurns" :key="preset" :value="preset">
          {{ kenBurnsLabels[preset] }}
        </option>
      </select>
      <select
        v-model="draft.transition"
        class="kr-input w-auto py-0 text-xs"
        aria-label="Transition into this scene"
      >
        <option value="cut">Cut in</option>
        <option value="crossfade">Fade in</option>
      </select>
      <input
        v-if="draft.transition === 'crossfade'"
        v-model.number="draft.transitionSec"
        class="kr-input w-14 py-0 text-xs"
        type="number"
        min="0.1"
        :max="limits.maxTransitionSec"
        step="0.1"
        aria-label="Crossfade seconds"
      />
      <span class="kr-badge-outline text-xs">{{ motionBadge }}</span>
      <span
        v-if="scene.image.source !== 'generated'"
        class="kr-badge-outline text-xs"
      >
        {{ scene.image.source === 'upload' ? 'Your image' : 'Gallery art' }}
      </span>
    </div>
    <p v-if="errorText" class="text-xs text-error">{{ errorText }}</p>

    <!-- Hero: the animation prompt and its controls -->
    <div v-if="draft.kind === 'clip'" class="space-y-1">
      <textarea
        v-model="draft.motionPrompt"
        class="kr-textarea text-sm leading-snug"
        rows="3"
        :maxlength="limits.maxPrompt"
        placeholder="Animation prompt: one camera move plus one action"
        aria-label="Animation prompt"
      />
      <div class="flex flex-wrap items-center gap-1">
        <select
          v-if="motionPresets.length"
          class="kr-input w-auto py-0 text-xs"
          aria-label="Apply an animation preset"
          @change="onApplyPreset"
        >
          <option value="">Preset…</option>
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
          End on next image
        </label>
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
          {{ scene.motion.clipArtImageId ? 'Re-animate' : 'Animate' }}
        </button>
      </div>
    </div>

    <!-- Image -->
    <textarea
      v-model="draft.prompt"
      class="kr-textarea text-sm leading-snug"
      rows="5"
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
      <button
        type="button"
        class="kr-btn kr-btn-xs"
        :aria-expanded="picking"
        @click="picking = !picking"
      >
        Replace image
      </button>
      <button
        type="button"
        class="kr-btn kr-btn-xs"
        :class="{
          'kr-btn-primary': draft.laneKey || draft.loraResourceIds.length,
        }"
        :aria-expanded="showLook"
        @click="showLook = !showLook"
      >
        Checkpoint{{ draft.loraResourceIds.length ? ' + LoRA' : '' }}
      </button>
    </div>
    <MusicVideoImagePicker
      v-if="picking"
      :disabled="busy"
      @pick="onPick"
      @upload="onUpload"
      @close="picking = false"
    />
    <div v-if="showLook" class="kr-panel space-y-1 p-2">
      <select
        v-model="draft.laneKey"
        class="kr-input w-full py-0 text-xs"
        aria-label="Checkpoint for this scene"
      >
        <option value="">The video's checkpoint</option>
        <option v-for="lane in lanes" :key="lane.key" :value="lane.key">
          {{ lane.label }}
        </option>
      </select>
      <MusicVideoLoraPicker
        v-model="draft.loraResourceIds"
        :max="limits.maxLoras"
        label="Add a LoRA to this scene"
      />
      <p class="kr-text-dim-sm">Applies the next time this still renders.</p>
    </div>

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
// it's animated or to change panning direction". t-032: the lyrics sit under
// the image they belong to, and marking a hero shows its animation prompt.
import { computed, reactive, ref, watch } from 'vue'
import { useMusicVideoStore } from '@/stores/musicVideoStore'
import { MUSIC_VIDEO_LIMITS, type MusicVideoScene } from '@/utils/musicVideoDoc'
import { DEFAULT_COMIC_LANES } from '@/utils/comicLanes'
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
const lanes = DEFAULT_COMIC_LANES
const showClip = ref(true)
const picking = ref(false)
const showLook = ref(false)

type LyricDraft = { sectionId: string; lineIdx: number; text: string }

type Draft = {
  prompt: string
  kind: 'kenburns' | 'clip'
  preset: MusicVideoKenBurnsPreset
  motionPrompt: string
  endOnNext: boolean
  transition: 'cut' | 'crossfade'
  transitionSec: number
  laneKey: string
  loraResourceIds: number[]
  lyrics: LyricDraft[]
}

function lyricLines(scene: MusicVideoScene): LyricDraft[] {
  const sections = store.current?.doc.lyrics.sections ?? []
  return scene.lyricRefs.flatMap((lyricRef) => {
    const text = sections.find((section) => section.id === lyricRef.sectionId)
      ?.lines[lyricRef.lineIdx]
    return text === undefined ? [] : [{ ...lyricRef, text }]
  })
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
    laneKey: scene.image.laneKey ?? '',
    loraResourceIds: [...(scene.image.loraResourceIds ?? [])],
    lyrics: lyricLines(scene),
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
  const image: MusicVideoScene['image'] = { ...scene.image }
  if (draft.laneKey) image.laneKey = draft.laneKey
  else delete image.laneKey
  if (draft.loraResourceIds.length) {
    image.loraResourceIds = [...draft.loraResourceIds]
  } else delete image.loraResourceIds
  const next: MusicVideoScene = {
    ...scene,
    image,
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
  const before = lyricLines(props.scene)
  const lyricEdits = draft.lyrics.filter(
    (line, i) => line.text.trim() && line.text !== before[i]?.text,
  )
  return store.updateScene(props.scene.id, applyDraft, lyricEdits)
}

async function onRender() {
  if (dirty.value && !(await save())) return
  const replacing = Boolean(props.scene.image.artImageId)
  if (replacing && !window.confirm('Replace this scene’s image?')) return
  await store.renderScenes([props.scene.id], replacing)
}

async function onUpload(file: File) {
  if (await store.uploadSceneImage(props.scene.id, file)) picking.value = false
}

async function onPick(artImageId: number) {
  if (!Number.isInteger(artImageId) || artImageId <= 0) return
  if (await store.setSceneImage(props.scene.id, artImageId)) {
    picking.value = false
  }
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
