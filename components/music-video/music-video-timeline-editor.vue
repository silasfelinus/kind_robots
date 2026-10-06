<template>
  <section class="space-y-3">
    <div class="flex flex-wrap items-center gap-2">
      <h2 class="kr-text-black-xl text-base-content">Timeline</h2>
      <span class="kr-badge-outline">{{ durationSec }}s</span>
      <span v-if="waveError" class="kr-text-dim-sm">{{ waveError }}</span>
    </div>

    <div class="grid grid-cols-3 gap-2">
      <label class="block space-y-1">
        <span class="kr-text-dim-sm">BPM</span>
        <input
          v-model.number="grid.bpm"
          class="kr-input w-full"
          type="number"
          :min="limits.minBpm"
          :max="limits.maxBpm"
          step="0.1"
        />
      </label>
      <label class="block space-y-1">
        <span class="kr-text-dim-sm">Beat offset (s)</span>
        <input
          v-model.number="grid.offsetSec"
          class="kr-input w-full"
          type="number"
          min="0"
          step="0.01"
        />
      </label>
      <label class="block space-y-1">
        <span class="kr-text-dim-sm">Beats per bar</span>
        <input
          v-model.number="grid.beatsPerBar"
          class="kr-input w-full"
          type="number"
          min="1"
          max="16"
          step="1"
        />
      </label>
    </div>

    <div class="flex flex-wrap items-center gap-2">
      <label class="flex items-center gap-2">
        <span class="kr-text-dim-sm">Snap</span>
        <select v-model="snap" class="kr-input">
          <option value="beat">Beat</option>
          <option value="bar">Bar</option>
          <option value="free">Free</option>
        </select>
      </label>
      <span class="kr-text-dim-sm">
        Click the strip to place a scene marker; drag a marker to move it.
      </span>
    </div>

    <div
      ref="strip"
      class="relative h-28 w-full cursor-crosshair select-none overflow-hidden rounded-xl border border-base-300 bg-base-200"
      role="group"
      aria-label="Song timeline"
      @click="onStripClick"
    >
      <div
        v-for="band in bands"
        :key="band.sectionId"
        class="pointer-events-none absolute inset-y-0 border-r border-base-300/60 px-1 text-[10px] uppercase opacity-70"
        :class="band.index % 2 ? 'bg-base-300/30' : 'bg-base-300/10'"
        :style="spanStyle(band.startSec, band.endSec)"
      >
        {{ band.kind }}
      </div>
      <div
        v-for="beat in beatLines"
        :key="`b${beat.atSec}`"
        class="pointer-events-none absolute inset-y-0 w-px bg-base-content"
        :class="beat.bar ? 'opacity-40' : 'opacity-10'"
        :style="{ left: pct(beat.atSec) }"
      />
      <svg
        v-if="peaks.length"
        class="pointer-events-none absolute inset-0 h-full w-full text-primary"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path :d="wavePath" fill="currentColor" opacity="0.55" />
      </svg>
      <button
        v-for="marker in markers"
        :key="marker.id"
        type="button"
        class="absolute inset-y-0 -ml-1 w-2 cursor-ew-resize bg-secondary"
        :style="{ left: pct(marker.atSec) }"
        :aria-label="`Scene marker at ${marker.atSec} seconds`"
        @click.stop
        @pointerdown.stop.prevent="startDrag(marker.id, $event)"
        @keydown.delete.prevent="onRemove(marker.id)"
        @keydown.left.prevent="nudge(marker.id, -1)"
        @keydown.right.prevent="nudge(marker.id, 1)"
      />
    </div>

    <div class="flex flex-wrap gap-2">
      <button
        type="button"
        class="kr-btn"
        :disabled="saving || !markers.length"
        @click="clearMarkers"
      >
        Clear markers
      </button>
      <button
        type="button"
        class="kr-btn"
        :disabled="saving || !scenes.length"
        @click="onSpread"
      >
        Re-spread lyrics across scenes
      </button>
      <button
        type="button"
        class="kr-btn kr-btn-primary"
        :disabled="saving || !dirty"
        @click="onSave"
      >
        Save timeline
      </button>
    </div>

    <ul v-if="scenes.length" class="space-y-1">
      <li
        v-for="(scene, i) in scenes"
        :key="scene.id"
        class="kr-panel flex flex-wrap items-center gap-2 p-2"
      >
        <span class="kr-badge-outline">{{ i + 1 }}</span>
        <span class="kr-text-dim-sm">
          {{ scene.startSec }}s–{{ scene.endSec }}s
        </span>
        <span class="kr-text-dim-sm flex-1 truncate">
          {{ sceneLyricPreview(scene) }}
        </span>
        <button
          v-if="i > 0"
          type="button"
          class="kr-btn"
          :disabled="saving"
          @click="onMerge(scene.id)"
        >
          Merge up
        </button>
        <select
          class="kr-input"
          aria-label="Move the first line of this scene to another scene"
          :disabled="saving || !scene.lyricRefs.length"
          @change="onMoveLine(scene, $event)"
        >
          <option value="">Move first line to…</option>
          <option
            v-for="(other, j) in scenes"
            :key="other.id"
            :value="other.id"
            :disabled="other.id === scene.id"
          >
            Scene {{ j + 1 }}
          </option>
        </select>
      </li>
    </ul>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue'
import { performFetch } from '@/stores/utils'
import { useUserStore } from '@/stores/userStore'
import {
  MUSIC_VIDEO_LIMITS,
  type MusicVideoDoc,
  type MusicVideoMarker,
  type MusicVideoScene,
} from '@/utils/musicVideoDoc'
import {
  addMarker,
  assignLyricLine,
  beatTimes,
  mergeSceneBack,
  moveMarker,
  removeMarker,
  sectionBands,
  snapTime,
  spreadLyricsAcrossScenes,
  splitSceneAt,
  waveformPeaks,
  type SnapMode,
} from '@/utils/musicVideoTimeline'

const props = defineProps<{
  doc: MusicVideoDoc
  saving: boolean
}>()
const emit = defineEmits<{
  save: [payload: Pick<MusicVideoDoc, 'timeline' | 'scenes'>]
}>()

const WAVE_BUCKETS = 400
const limits = MUSIC_VIDEO_LIMITS
const userStore = useUserStore()
const strip = ref<HTMLElement | null>(null)
const snap = ref<SnapMode>('bar')
const peaks = ref<number[]>([])
const waveError = ref('')
const dirty = ref(false)
const grid = reactive({ ...props.doc.timeline.beatGrid })
const markers = ref<MusicVideoMarker[]>([...props.doc.timeline.markers])
const scenes = ref<MusicVideoScene[]>(props.doc.scenes.map((s) => ({ ...s })))
let nextId = 1

const durationSec = computed(() =>
  Math.max(props.doc.settings.durationSec, props.doc.song?.durationSec ?? 0, 1),
)
const gridValue = computed(() => ({
  bpm: Math.min(
    Math.max(Number(grid.bpm) || 100, limits.minBpm),
    limits.maxBpm,
  ),
  offsetSec: Math.max(Number(grid.offsetSec) || 0, 0),
  beatsPerBar: Math.min(
    Math.max(Math.round(Number(grid.beatsPerBar)) || 4, 1),
    16,
  ),
}))
const beatLines = computed(() => beatTimes(gridValue.value, durationSec.value))
const bands = computed(() =>
  sectionBands(props.doc.lyrics.sections, durationSec.value).map(
    (b, index) => ({
      ...b,
      index,
    }),
  ),
)
const wavePath = computed(() => {
  const n = peaks.value.length
  if (!n) return ''
  const top = peaks.value.map(
    (p, i) => `${((i / n) * 100).toFixed(2)},${(50 - p * 48).toFixed(2)}`,
  )
  const bottom = peaks.value
    .map((p, i) => `${((i / n) * 100).toFixed(2)},${(50 + p * 48).toFixed(2)}`)
    .reverse()
  return `M${top.join(' L')} L${bottom.join(' L')} Z`
})

function pct(sec: number): string {
  return `${(sec / durationSec.value) * 100}%`
}

function spanStyle(startSec: number, endSec: number) {
  return { left: pct(startSec), width: pct(endSec - startSec) }
}

function sceneLyricPreview(scene: MusicVideoScene): string {
  const first = scene.lyricRefs[0]
  if (!first) return 'No lyric lines'
  const section = props.doc.lyrics.sections.find(
    (s) => s.id === first.sectionId,
  )
  const line = section?.lines[first.lineIdx] ?? ''
  const more = scene.lyricRefs.length - 1
  return more > 0 ? `${line} (+${more} more)` : line
}

function timeAt(event: { clientX: number }): number {
  const rect = strip.value?.getBoundingClientRect()
  if (!rect || !rect.width) return 0
  const ratio = (event.clientX - rect.left) / rect.width
  return Math.min(Math.max(ratio, 0), 1) * durationSec.value
}

function newId(prefix: string, taken: { id: string }[]): string {
  let id = `${prefix}${nextId++}`
  while (taken.some((t) => t.id === id)) id = `${prefix}${nextId++}`
  return id
}

function onStripClick(event: MouseEvent) {
  const before = markers.value
  markers.value = addMarker(
    before,
    timeAt(event),
    snap.value,
    gridValue.value,
    durationSec.value,
    newId('m', before),
  )
  if (markers.value === before) return
  const added = markers.value.find((m) => !before.some((b) => b.id === m.id))
  if (added) {
    scenes.value = splitSceneAt(
      scenes.value,
      added.atSec,
      newId('s', scenes.value),
    )
  }
  dirty.value = true
}

let dragId: string | null = null
function startDrag(id: string, event: PointerEvent) {
  dragId = id
  window.addEventListener('pointermove', onDrag)
  window.addEventListener('pointerup', stopDrag, { once: true })
  void event
}
function onDrag(event: PointerEvent) {
  if (!dragId) return
  const from = markers.value.find((m) => m.id === dragId)
  const moved = moveMarker(
    markers.value,
    dragId,
    timeAt(event),
    gridValue.value,
    durationSec.value,
  )
  const to = moved.find((m) => m.id === dragId)
  if (!from || !to || from.atSec === to.atSec) return
  markers.value = moved
  retimeBoundary(from.atSec, to.atSec)
  dirty.value = true
}
function stopDrag() {
  dragId = null
  window.removeEventListener('pointermove', onDrag)
}

/** A moved marker drags the scene boundary that sat on it; the order must hold. */
function retimeBoundary(fromSec: number, toSec: number) {
  const list = scenes.value
  const i = list.findIndex((s) => Math.abs(s.startSec - fromSec) < 0.001)
  if (i <= 0) return
  const prev = list[i - 1]
  const cur = list[i]
  if (toSec <= prev.startSec || toSec >= cur.endSec) return
  const next = [...list]
  next[i - 1] = { ...prev, endSec: toSec }
  next[i] = { ...cur, startSec: toSec }
  scenes.value = next
}

function nudge(id: string, direction: number) {
  const marker = markers.value.find((m) => m.id === id)
  if (!marker) return
  const g = gridValue.value
  const step =
    marker.snap === 'free'
      ? 0.1
      : marker.snap === 'bar'
        ? (60 / g.bpm) * g.beatsPerBar
        : 60 / g.bpm
  const target = snapTime(
    marker.atSec + direction * step,
    marker.snap,
    g,
    durationSec.value,
  )
  const moved = moveMarker(markers.value, id, target, g, durationSec.value)
  const to = moved.find((m) => m.id === id)
  if (!to || to.atSec === marker.atSec) return
  markers.value = moved
  retimeBoundary(marker.atSec, to.atSec)
  dirty.value = true
}

function onRemove(id: string) {
  const marker = markers.value.find((m) => m.id === id)
  if (!marker) return
  const scene = scenes.value.find(
    (s) => Math.abs(s.startSec - marker.atSec) < 0.001,
  )
  markers.value = removeMarker(markers.value, id)
  if (scene) scenes.value = mergeSceneBack(scenes.value, scene.id)
  dirty.value = true
}

function clearMarkers() {
  for (const marker of [...markers.value]) onRemove(marker.id)
}

function onMerge(sceneId: string) {
  const scene = scenes.value.find((s) => s.id === sceneId)
  if (!scene) return
  const marker = markers.value.find(
    (m) => Math.abs(m.atSec - scene.startSec) < 0.001,
  )
  if (marker) markers.value = removeMarker(markers.value, marker.id)
  scenes.value = mergeSceneBack(scenes.value, sceneId)
  dirty.value = true
}

function onSpread() {
  scenes.value = spreadLyricsAcrossScenes(
    scenes.value,
    props.doc.lyrics.sections,
  )
  dirty.value = true
}

function onMoveLine(scene: MusicVideoScene, event: Event) {
  const select = event.target as HTMLSelectElement
  const target = select.value
  select.value = ''
  const ref = scene.lyricRefs[0]
  if (!target || !ref) return
  scenes.value = assignLyricLine(scenes.value, ref, target)
  dirty.value = true
}

function onSave() {
  emit('save', {
    timeline: {
      beatGrid: { ...gridValue.value },
      markers: markers.value.map((m) => ({ ...m })),
    },
    scenes: scenes.value.map((s) => ({ ...s })),
  })
  dirty.value = false
}

watch(
  () => [grid.bpm, grid.offsetSec, grid.beatsPerBar],
  () => {
    dirty.value = true
  },
)

watch(
  () => props.doc.scenes,
  (next) => {
    if (!dirty.value) scenes.value = next.map((s) => ({ ...s }))
  },
)

/** The song is a private row, so it is fetched as a blob with the Bearer header. */
async function loadWaveform(artImageId: number | undefined) {
  peaks.value = []
  waveError.value = ''
  if (!artImageId || !import.meta.client) return
  try {
    const meta = await performFetch<{ imagePath?: string }>(
      `/api/art/image/${artImageId}?showMature=true`,
      {},
      1,
      15_000,
    )
    const path = meta.success ? meta.data?.imagePath : null
    if (!path) throw new Error('no song path')
    const token = userStore.token || userStore.user?.token || ''
    const headers = new Headers()
    if (token) headers.set('Authorization', `Bearer ${token}`)
    const response = await fetch(path, { headers })
    if (!response.ok) throw new Error(`song ${response.status}`)
    const AudioCtx =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext
    if (!AudioCtx) throw new Error('no audio decoding')
    const ctx = new AudioCtx()
    try {
      const decoded = await ctx.decodeAudioData(await response.arrayBuffer())
      peaks.value = waveformPeaks(decoded.getChannelData(0), WAVE_BUCKETS)
    } finally {
      void ctx.close()
    }
  } catch {
    waveError.value = 'Waveform unavailable; the beat grid still works.'
  }
}

watch(() => props.doc.song?.artImageId, loadWaveform, { immediate: true })

onBeforeUnmount(stopDrag)
</script>
