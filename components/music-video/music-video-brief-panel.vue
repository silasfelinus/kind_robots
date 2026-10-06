<!-- /components/music-video/music-video-brief-panel.vue -->
<template>
  <form class="kr-panel space-y-2 p-3" @submit.prevent="onSave">
    <div class="flex flex-wrap gap-2">
      <label class="block min-w-0 flex-[1_1_12rem] space-y-0.5">
        <span class="kr-text-dim-sm">Title</span>
        <input
          v-model="form.title"
          class="kr-input w-full"
          type="text"
          maxlength="255"
        />
      </label>
      <label class="block min-w-0 flex-[3_1_18rem] space-y-0.5">
        <span class="kr-text-dim-sm">Pitch</span>
        <textarea
          v-model="form.pitch"
          class="kr-textarea text-sm"
          rows="3"
          :maxlength="limits.maxPitch"
        />
      </label>
    </div>

    <div
      class="grid gap-2 grid-cols-[repeat(auto-fit,minmax(min(100%,7rem),1fr))]"
    >
      <label class="block space-y-0.5">
        <span class="kr-text-dim-sm">Seconds</span>
        <input
          v-model.number="form.durationSec"
          class="kr-input w-full"
          type="number"
          :min="limits.minDurationSec"
          :max="limits.maxDurationSec"
        />
      </label>
      <label class="block space-y-0.5">
        <span class="kr-text-dim-sm">Aspect</span>
        <select v-model="form.aspect" class="kr-input w-full">
          <option v-for="aspect in aspects" :key="aspect" :value="aspect">
            {{ aspect }}
          </option>
        </select>
      </label>
      <label class="block space-y-0.5">
        <span class="kr-text-dim-sm">BPM</span>
        <input
          v-model.number="form.bpm"
          class="kr-input w-full"
          type="number"
          min="40"
          max="240"
          placeholder="Auto"
        />
      </label>
      <label class="block space-y-0.5">
        <span class="kr-text-dim-sm">Vocal</span>
        <select v-model="form.vocal" class="kr-input w-full">
          <option value="">Any</option>
          <option v-for="vocal in vocals" :key="vocal" :value="vocal">
            {{ vocal }}
          </option>
        </select>
      </label>
      <label class="block space-y-0.5">
        <span class="kr-text-dim-sm">Hero shots</span>
        <input
          v-model.number="form.heroShots"
          class="kr-input w-full"
          type="number"
          min="0"
          :max="limits.maxHeroShots"
          placeholder="0"
        />
      </label>
      <label class="block space-y-0.5">
        <span class="kr-text-dim-sm">Genre</span>
        <input
          v-model="form.genre"
          class="kr-input w-full"
          type="text"
          placeholder="synth rock"
        />
      </label>
      <label class="block space-y-0.5">
        <span class="kr-text-dim-sm">Mood</span>
        <input
          v-model="form.mood"
          class="kr-input w-full"
          type="text"
          placeholder="heroic"
        />
      </label>
    </div>

    <div
      class="grid gap-2 grid-cols-[repeat(auto-fit,minmax(min(100%,11rem),1fr))]"
    >
      <label class="block space-y-0.5">
        <span class="kr-text-dim-sm">Checkpoint</span>
        <select v-model="laneKey" class="kr-input w-full">
          <option value="">
            {{ form.comicSeriesId ? "The series' house lane" : 'Krea 2' }}
          </option>
          <option v-for="lane in laneChoices" :key="lane.key" :value="lane.key">
            {{ lane.label }}
          </option>
        </select>
      </label>
      <label class="block space-y-0.5">
        <span class="kr-text-dim-sm">Comic series id</span>
        <input
          v-model.number="form.comicSeriesId"
          class="kr-input w-full"
          type="number"
          min="1"
          placeholder="None"
        />
      </label>
      <div class="space-y-0.5">
        <span class="kr-text-dim-sm">LoRAs on every still</span>
        <MusicVideoLoraPicker
          v-model="form.loraResourceIds"
          :max="limits.maxLoras"
        />
      </div>
    </div>

    <label class="block space-y-0.5">
      <span class="kr-text-dim-sm"
        >Style bible (the look every frame shares)</span
      >
      <textarea
        v-model="form.styleBible"
        class="kr-textarea text-sm"
        rows="3"
        :maxlength="limits.maxStyleBible"
      />
    </label>
    <label class="block space-y-0.5">
      <span class="kr-text-dim-sm">
        Banned terms (comma separated; never in a prompt, lyric or caption)
      </span>
      <input
        v-model="form.bannedTerms"
        class="kr-input w-full text-sm"
        type="text"
      />
    </label>

    <div class="flex flex-wrap items-center gap-2">
      <button
        type="submit"
        class="kr-btn kr-btn-primary"
        :disabled="store.saving || !dirty || !form.title.trim()"
      >
        Save brief
      </button>
      <button
        type="button"
        class="kr-btn"
        :disabled="
          dirty || Boolean(store.busyAction) || !store.current?.doc.pitch.trim()
        "
        :title="
          dirty
            ? 'Save the brief first'
            : 'Let the AI fill genre, mood, BPM, vocal and the style bible from the pitch; what you set stays'
        "
        @click="store.fillBrief()"
      >
        <span v-if="store.busyAction === 'brief'" class="kr-spinner-xs" />
        Fill in from pitch
      </button>
      <span class="flex-1" />
      <button
        type="button"
        class="kr-btn kr-btn-xs"
        :disabled="store.saving"
        @click="onDelete"
      >
        Delete video
      </button>
    </div>
  </form>
</template>

<script setup lang="ts">
// music-video/t-027 settings, merged with the title and pitch in t-032.
// Silas, 2026-10-06: "settings should be on top with the name and pitch" and
// "we should be able to select the checkpoint we use for generation".
import { computed, reactive, watch } from 'vue'
import { useMusicVideoStore, type MusicVideo } from '@/stores/musicVideoStore'
import {
  MUSIC_VIDEO_ASPECTS,
  MUSIC_VIDEO_LIMITS,
  MUSIC_VIDEO_VOCALS,
  type MusicVideoAspect,
  type MusicVideoSettings,
  type MusicVideoVocal,
} from '@/utils/musicVideoDoc'
import { DEFAULT_COMIC_LANES } from '@/utils/comicLanes'

const store = useMusicVideoStore()
const aspects = MUSIC_VIDEO_ASPECTS
const vocals = MUSIC_VIDEO_VOCALS
const limits = MUSIC_VIDEO_LIMITS
// Krea 2 is the empty choice, so it is not listed twice.
const laneChoices = DEFAULT_COMIC_LANES.filter((lane) => lane.key !== 'krea2')

type BriefForm = {
  title: string
  pitch: string
  durationSec: number
  aspect: MusicVideoAspect
  bpm: number | ''
  vocal: MusicVideoVocal | ''
  genre: string
  mood: string
  styleBible: string
  bannedTerms: string
  heroShots: number | ''
  comicSeriesId: number | ''
  comicLaneKey: string
  imageLaneKey: string
  loraResourceIds: number[]
}

const form = reactive<BriefForm>(emptyForm())

function emptyForm(video?: MusicVideo | null): BriefForm {
  const settings: Partial<MusicVideoSettings> = video?.doc.settings ?? {}
  return {
    title: video?.title ?? '',
    pitch: video?.doc.pitch ?? '',
    durationSec: settings.durationSec ?? 120,
    aspect: settings.aspect ?? '16:9',
    bpm: settings.bpm ?? '',
    vocal: settings.vocal ?? '',
    genre: settings.genre ?? '',
    mood: settings.mood ?? '',
    styleBible: settings.styleBible ?? '',
    bannedTerms: (settings.bannedTerms ?? []).join(', '),
    heroShots: settings.heroShots ?? '',
    comicSeriesId: settings.comicSeriesId ?? '',
    comicLaneKey: settings.comicLaneKey ?? '',
    imageLaneKey: settings.imageLaneKey ?? '',
    loraResourceIds: [...(settings.loraResourceIds ?? [])],
  }
}

/* One select: a comic series picks among its own lanes, otherwise the shared catalogue. */
const laneKey = computed({
  get: () => (form.comicSeriesId ? form.comicLaneKey : form.imageLaneKey),
  set: (value: string) => {
    if (form.comicSeriesId) form.comicLaneKey = value
    else form.imageLaneKey = value
  },
})

function toSettings(): Partial<MusicVideoSettings> {
  const terms = form.bannedTerms
    .split(',')
    .map((term) => term.trim())
    .filter(Boolean)
  const seriesId =
    form.comicSeriesId === '' || Number(form.comicSeriesId) <= 0
      ? undefined
      : Number(form.comicSeriesId)
  return {
    durationSec: Number(form.durationSec),
    aspect: form.aspect,
    bpm: form.bpm === '' ? undefined : Number(form.bpm),
    vocal: form.vocal || undefined,
    genre: form.genre.trim() || undefined,
    mood: form.mood.trim() || undefined,
    styleBible: form.styleBible,
    bannedTerms: terms.length ? terms : undefined,
    heroShots:
      form.heroShots === '' || Number(form.heroShots) <= 0
        ? undefined
        : Math.min(Number(form.heroShots), MUSIC_VIDEO_LIMITS.maxHeroShots),
    comicSeriesId: seriesId,
    comicLaneKey: seriesId && form.comicLaneKey ? form.comicLaneKey : undefined,
    imageLaneKey: form.imageLaneKey || undefined,
    loraResourceIds: form.loraResourceIds.length
      ? form.loraResourceIds
      : undefined,
  }
}

const saved = computed(() => JSON.stringify(emptyForm(store.current)))
const dirty = computed(() => JSON.stringify(form) !== saved.value)

watch(
  () => store.current,
  (video) => Object.assign(form, emptyForm(video)),
  { immediate: true },
)

async function onSave() {
  await store.saveBrief(form.title.trim(), form.pitch, toSettings())
}

async function onDelete() {
  if (!store.current) return
  if (
    !window.confirm(`Delete "${store.current.title}"? This cannot be undone.`)
  )
    return
  await store.remove(store.current.id)
}
</script>
