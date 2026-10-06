<!-- /components/music-video/music-video-settings-panel.vue -->
<template>
  <form class="kr-panel space-y-3 p-3" @submit.prevent="onSave">
    <div class="flex flex-wrap items-center justify-between gap-2">
      <h2 class="kr-text-black-xl text-base-content">Settings</h2>
      <span class="kr-text-dim-sm">
        Used by the lyrics, the song and every scene prompt.
      </span>
    </div>

    <div
      class="grid gap-3 grid-cols-[repeat(auto-fit,minmax(min(100%,10rem),1fr))]"
    >
      <label class="block space-y-1">
        <span class="kr-text-dim-sm">Length (seconds)</span>
        <input
          v-model.number="form.durationSec"
          class="kr-input w-full"
          type="number"
          :min="limits.minDurationSec"
          :max="limits.maxDurationSec"
        />
      </label>
      <label class="block space-y-1">
        <span class="kr-text-dim-sm">Aspect</span>
        <select v-model="form.aspect" class="kr-input w-full">
          <option v-for="aspect in aspects" :key="aspect" :value="aspect">
            {{ aspect }}
          </option>
        </select>
      </label>
      <label class="block space-y-1">
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
      <label class="block space-y-1">
        <span class="kr-text-dim-sm">Vocal</span>
        <select v-model="form.vocal" class="kr-input w-full">
          <option value="">Any</option>
          <option v-for="vocal in vocals" :key="vocal" :value="vocal">
            {{ vocal }}
          </option>
        </select>
      </label>
      <label class="block space-y-1">
        <span class="kr-text-dim-sm">Genre</span>
        <input
          v-model="form.genre"
          class="kr-input w-full"
          type="text"
          placeholder="synth rock"
        />
      </label>
      <label class="block space-y-1">
        <span class="kr-text-dim-sm">Hero shots to animate</span>
        <input
          v-model.number="form.heroShots"
          class="kr-input w-full"
          type="number"
          min="0"
          :max="limits.maxHeroShots"
          placeholder="0"
        />
      </label>
      <label class="block space-y-1">
        <span class="kr-text-dim-sm">Mood</span>
        <input
          v-model="form.mood"
          class="kr-input w-full"
          type="text"
          placeholder="heroic"
        />
      </label>
    </div>

    <label class="block space-y-1">
      <span class="kr-text-dim-sm"
        >Style bible (the look every frame shares)</span
      >
      <textarea
        v-model="form.styleBible"
        class="kr-input w-full"
        rows="3"
        :maxlength="limits.maxStyleBible"
      />
    </label>
    <div
      class="grid gap-3 grid-cols-[repeat(auto-fit,minmax(min(100%,12rem),1fr))]"
    >
      <label class="block space-y-1">
        <span class="kr-text-dim-sm">Comic series id (optional)</span>
        <input
          v-model.number="form.comicSeriesId"
          class="kr-input w-full"
          type="number"
          min="1"
          placeholder="Render stills in a comic's style"
        />
      </label>
      <label class="block space-y-1">
        <span class="kr-text-dim-sm">Comic lane</span>
        <select
          v-model="form.comicLaneKey"
          class="kr-input w-full"
          :disabled="!form.comicSeriesId"
        >
          <option value="">The series' house lane</option>
          <option v-for="lane in lanes" :key="lane.key" :value="lane.key">
            {{ lane.label }}
          </option>
        </select>
      </label>
    </div>
    <label class="block space-y-1">
      <span class="kr-text-dim-sm">
        Banned terms (comma separated; never in a prompt, lyric or caption)
      </span>
      <input v-model="form.bannedTerms" class="kr-input w-full" type="text" />
    </label>

    <div class="flex flex-wrap items-center gap-2">
      <button
        type="submit"
        class="kr-btn kr-btn-primary"
        :disabled="store.saving || !dirty"
      >
        Save settings
      </button>
      <button
        type="button"
        class="kr-btn"
        :disabled="
          dirty || Boolean(store.busyAction) || !store.current?.doc.pitch.trim()
        "
        :title="
          dirty
            ? 'Save your settings first'
            : 'Let the AI fill genre, mood, BPM, vocal and the style bible from the pitch; what you set stays'
        "
        @click="store.fillBrief()"
      >
        <span v-if="store.busyAction === 'brief'" class="kr-spinner-xs" />
        Fill in from pitch
      </button>
    </div>
  </form>
</template>

<script setup lang="ts">
// music-video/t-027: a new video got the defaults (120 s, 16:9) with no way
// to change them outside the API.
import { computed, reactive, watch } from 'vue'
import { useMusicVideoStore } from '@/stores/musicVideoStore'
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
const lanes = DEFAULT_COMIC_LANES

type SettingsForm = {
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
}

const form = reactive<SettingsForm>(emptyForm())

function emptyForm(settings?: MusicVideoSettings): SettingsForm {
  return {
    durationSec: settings?.durationSec ?? 120,
    aspect: settings?.aspect ?? '16:9',
    bpm: settings?.bpm ?? '',
    vocal: settings?.vocal ?? '',
    genre: settings?.genre ?? '',
    mood: settings?.mood ?? '',
    styleBible: settings?.styleBible ?? '',
    bannedTerms: (settings?.bannedTerms ?? []).join(', '),
    heroShots: settings?.heroShots ?? '',
    comicSeriesId: settings?.comicSeriesId ?? '',
    comicLaneKey: settings?.comicLaneKey ?? '',
  }
}

function toSettings(): Partial<MusicVideoSettings> {
  const terms = form.bannedTerms
    .split(',')
    .map((term) => term.trim())
    .filter(Boolean)
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
    comicSeriesId:
      form.comicSeriesId === '' || Number(form.comicSeriesId) <= 0
        ? undefined
        : Number(form.comicSeriesId),
    comicLaneKey:
      form.comicSeriesId !== '' && form.comicLaneKey
        ? form.comicLaneKey
        : undefined,
  }
}

const saved = computed(() =>
  JSON.stringify(emptyForm(store.current?.doc.settings)),
)
const dirty = computed(() => JSON.stringify(form) !== saved.value)

watch(
  () => store.current?.doc.settings,
  (settings) => Object.assign(form, emptyForm(settings)),
  { immediate: true },
)

async function onSave() {
  await store.saveSettings(toSettings())
}
</script>
