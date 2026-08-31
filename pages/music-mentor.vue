<template>
  <div class="kr-surface">
    <div class="kr-scroll kr-container max-w-3xl p-6 space-y-6">
      <header class="flex items-start gap-3">
        <div
          class="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary"
        >
          <Icon name="kind-icon:microphone" class="size-6" />
        </div>
        <div class="min-w-0 flex-1 space-y-1">
          <p class="text-2xl font-black tracking-tight">Music Mentor</p>
          <p class="text-sm text-base-content/60">
            Upload a recording of your sung medley and get honest, specific
            feedback on the singing and the arrangement. Everything is analyzed
            <strong>in your browser</strong> — the audio never leaves your
            device, and nothing is stored.
          </p>
          <p class="text-xs text-base-content/50">
            Honest heads-up: this measures the objective stuff (pitch, timing,
            dynamics, structure) and reasons over your setlist. It can't judge
            tone, emotion, or "is this a good voice" — that still needs a human
            ear.
          </p>
        </div>
      </header>

      <!-- File -->
      <section class="space-y-2">
        <label class="font-semibold">
          Recording <span class="text-error">*</span>
        </label>
        <input
          type="file"
          accept="audio/*,video/*,.mp3,.m4a,.wav,.ogg,.mp4,.mov"
          class="file-input file-input-bordered w-full"
          @change="onFileChange"
        />
        <p v-if="fileName" class="text-xs opacity-70">
          {{ fileName }} ({{ fileSizeMb }} MB) — only the audio track is read.
        </p>
        <p v-else class="text-xs opacity-50">
          Audio or video is fine (mp3, m4a, wav, or an iPhone mp4/mov — we just
          read the audio). Up to {{ MAX_MB }} MB.
        </p>
      </section>

      <!-- Setlist -->
      <section class="space-y-2">
        <label class="font-semibold">Setlist / notes</label>
        <textarea
          v-model="setlist"
          rows="4"
          class="textarea textarea-bordered w-full"
          placeholder="List the songs in your medley (and keys if you know them), plus anything you want feedback on. This sharpens the arrangement feedback."
        />
      </section>

      <!-- Dimensions -->
      <section class="space-y-2">
        <label class="font-semibold">What should I listen for?</label>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="opt in DIMENSIONS"
            :key="opt.value"
            type="button"
            class="btn btn-sm"
            :class="selected.includes(opt.value) ? 'btn-accent' : 'btn-outline'"
            @click="toggle(opt.value)"
          >
            {{ opt.label }}
          </button>
        </div>
        <p class="text-xs opacity-60">
          Pick at least one. All four selected by default.
        </p>
      </section>

      <!-- Analyze -->
      <section class="space-y-3">
        <button
          type="button"
          class="btn btn-accent btn-lg w-full"
          :disabled="!canAnalyze"
          @click="run"
        >
          <span
            v-if="store.isBusy"
            class="loading loading-spinner loading-sm"
          />
          {{ analyzeLabel }}
        </button>

        <div v-if="store.state.message" class="text-sm opacity-70 text-center">
          {{ store.state.message }}
        </div>

        <div
          v-if="store.state.error"
          class="alert alert-error text-sm"
          role="alert"
        >
          {{ store.state.error }}
        </div>
      </section>

      <!-- Feedback -->
      <section v-if="store.state.feedback" class="space-y-2">
        <h2 class="font-semibold">Mentor feedback</h2>
        <div
          class="whitespace-pre-line rounded-2xl border border-base-300 bg-base-200/60 p-4 text-sm leading-relaxed"
        >
          {{ store.state.feedback }}
        </div>
      </section>

      <!-- Extracted features (transparency) -->
      <details v-if="store.state.features" class="text-sm">
        <summary class="cursor-pointer opacity-70">
          What I measured (the numbers behind the feedback)
        </summary>
        <div class="mt-2 grid gap-2 sm:grid-cols-2">
          <div
            v-for="row in featureRows"
            :key="row.label"
            class="kr-panel-flat flex justify-between gap-3 rounded-lg px-3 py-2"
          >
            <span class="opacity-70">{{ row.label }}</span>
            <span class="font-medium text-right">{{ row.value }}</span>
          </div>
        </div>
        <ul
          v-if="store.state.features.notes.length"
          class="mt-3 list-disc space-y-1 pl-5 text-xs opacity-70"
        >
          <li v-for="(note, i) in store.state.features.notes" :key="i">
            {{ note }}
          </li>
        </ul>
      </details>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  useMusicMentorStore,
  type MentorDimension,
} from '@/stores/musicMentorStore'
import { useUserStore } from '@/stores/userStore'

const MAX_MB = 250

const DIMENSIONS: { value: MentorDimension; label: string }[] = [
  { value: 'intonation', label: 'Intonation / pitch' },
  { value: 'timing', label: 'Timing & rhythm' },
  { value: 'dynamics', label: 'Dynamics & expression' },
  { value: 'arrangement', label: 'Arrangement & structure' },
]

const store = useMusicMentorStore()
const userStore = useUserStore()

const isLoggedIn = computed(() => userStore.isLoggedIn)

const file = ref<File | null>(null)
const fileName = ref('')
const fileSizeMb = ref('0')
const setlist = ref('')
const selected = ref<MentorDimension[]>(DIMENSIONS.map((d) => d.value))

const canAnalyze = computed(
  () =>
    isLoggedIn.value &&
    !store.isBusy &&
    file.value !== null &&
    selected.value.length > 0,
)

const analyzeLabel = computed(() => {
  if (!isLoggedIn.value) return 'Sign in to analyze'
  if (store.isBusy) return 'Analyzing…'
  if (!file.value) return 'Choose a recording first'
  return 'Analyze my medley'
})

const featureRows = computed(() => {
  const f = store.state.features
  if (!f) return []
  const fmt = (n: number | null, suffix = '') =>
    n === null ? '—' : `${n.toFixed(1)}${suffix}`
  return [
    { label: 'Duration', value: fmt(f.durationSec, ' s') },
    { label: 'Tempo', value: fmt(f.tempoBpm, ' BPM') },
    { label: 'Pitch center', value: fmt(f.pitchCenterHz, ' Hz') },
    { label: 'Pitch stability', value: fmt(f.pitchStabilityCents, ' ¢') },
    { label: 'Pitch range', value: fmt(f.pitchRangeSemitones, ' semitones') },
    { label: 'Dynamic range', value: fmt(f.dynamicRangeDb, ' dB') },
    { label: 'Voiced', value: fmt(f.voicedFraction * 100, '%') },
    { label: 'Sections detected', value: String(f.sectionCount) },
  ]
})

function toggle(d: MentorDimension) {
  const i = selected.value.indexOf(d)
  if (i >= 0) selected.value.splice(i, 1)
  else selected.value.push(d)
}

function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  const f = input.files?.[0] ?? null
  if (!f) return
  if (f.size > MAX_MB * 1024 * 1024) {
    store.state.error = `File is too large. Maximum is ${MAX_MB} MB.`
    input.value = ''
    return
  }
  file.value = f
  fileName.value = f.name
  fileSizeMb.value = (f.size / 1024 / 1024).toFixed(1)
  store.reset()
}

async function run() {
  if (!file.value || !canAnalyze.value) return
  await store.analyze(file.value, selected.value, setlist.value)
}
</script>
