<template>
  <div class="kr-surface">
    <div class="kr-scroll kr-container max-w-4xl p-4 sm:p-6">
      <div class="kr-panel space-y-5 p-5 sm:p-6">
        <header class="flex items-start gap-3 border-b border-base-300 pb-5">
          <div
            class="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary"
          >
            <Icon name="kind-icon:microphone" class="kr-icon-6" />
          </div>
          <div class="min-w-0 flex-1 space-y-2">
            <p class="kr-text-black-2xl tracking-tight">Music Mentor</p>
            <p class="text-sm leading-relaxed text-base-content/75">
              Upload a song or medley for focused feedback on pitch, timing,
              dynamics, and arrangement.
            </p>
            <div
              class="flex items-start gap-2 rounded-xl bg-base-200/80 px-3 py-2 text-sm text-base-content/75"
            >
              <Icon name="kind-icon:shield" class="kr-icon-4 mt-0.5 shrink-0" />
              <p>
                <strong>Your recording stays on your device.</strong> We analyze
                it in your browser and send only the measurements, your notes,
                and your selected feedback areas for coaching.
              </p>
            </div>
            <p class="kr-text-faded-xs">
              Music Mentor can measure technique and structure; tone, emotion,
              and artistic taste still need a human ear.
            </p>
          </div>
        </header>

      <div v-if="!isLoggedIn" class="alert alert-warning text-sm" role="alert">
        You need to be signed in to run an analysis — the coaching step is
        billed to your account's mana.
      </div>

      <!-- File -->
      <section class="space-y-2">
        <label class="font-semibold">
          1. Add a recording <span class="text-error">*</span>
        </label>
        <input
          type="file"
          accept="audio/*,video/*,.mp3,.m4a,.wav,.ogg,.mp4,.mov"
          class="file-input file-input-bordered w-full"
          @change="onFileChange"
        />
        <p v-if="fileName" class="text-xs text-base-content/65">
          {{ fileName }} · {{ fileSizeMb }} MB · only the audio track is
          analyzed
        </p>
        <p v-else class="text-xs text-base-content/55">
          MP3, M4A, WAV, MP4, or MOV · up to {{ MAX_MB }} MB. For video, only
          the audio track is analyzed.
        </p>
      </section>

      <!-- Setlist -->
      <section class="space-y-2">
        <label class="font-semibold">
          2. Add context
          <span class="text-xs font-normal text-base-content/55">(optional)</span>
        </label>
        <textarea
          v-model="setlist"
          rows="4"
          class="textarea textarea-bordered w-full"
          placeholder="Songs, keys if you know them, and anything you want the mentor to focus on."
        />
      </section>

      <!-- Dimensions -->
      <section class="space-y-2">
        <label class="font-semibold">3. Choose feedback</label>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="opt in DIMENSIONS"
            :key="opt.value"
            type="button"
            class="kr-btn-plain"
            :class="selected.includes(opt.value) ? 'btn-accent' : 'btn-outline'"
            @click="toggle(opt.value)"
          >
            {{ opt.label }}
          </button>
        </div>
        <p class="kr-text-faded-xs">
          All four are selected. Tap any you don't want.
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
            class="kr-spinner-sm"
          />
          {{ analyzeLabel }}
        </button>

        <div v-if="store.state.message" class="kr-text-faded-sm text-center">
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
  { value: 'intonation', label: 'Pitch / intonation' },
  { value: 'timing', label: 'Timing / rhythm' },
  { value: 'dynamics', label: 'Dynamics' },
  { value: 'arrangement', label: 'Arrangement' },
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
    !!file.value &&
    selected.value.length > 0,
)

const analyzeLabel = computed(() => {
  if (store.state.status === 'extracting') return 'Listening…'
  if (store.state.status === 'thinking') return 'Thinking…'
  return 'Analyze recording'
})

function onFileChange(event: Event) {
  const target = event.target as HTMLInputElement
  const picked = target.files?.[0] ?? null
  store.reset()
  if (!picked) {
    file.value = null
    fileName.value = ''
    return
  }
  const sizeMb = picked.size / (1024 * 1024)
  if (sizeMb > MAX_MB) {
    file.value = null
    fileName.value = ''
    store.state.status = 'error'
    store.state.error = `That file is ${sizeMb.toFixed(0)} MB — please keep it under ${MAX_MB} MB (a shorter clip, or export just the audio).`
    return
  }
  file.value = picked
  fileName.value = picked.name
  fileSizeMb.value = sizeMb.toFixed(1)
}

function toggle(value: MentorDimension) {
  selected.value = selected.value.includes(value)
    ? selected.value.filter((v) => v !== value)
    : [...selected.value, value]
}

const featureRows = computed(() => {
  const f = store.state.features
  if (!f) return []
  const dash = (v: unknown) => (v === null || v === undefined ? '—' : String(v))
  return [
    { label: 'Duration', value: `${f.durationSec}s` },
    { label: 'Voiced', value: `${f.pitch.voicedPercent}%` },
    {
      label: 'Median pitch',
      value: f.pitch.medianNoteName
        ? `${f.pitch.medianNoteName} (${dash(f.pitch.medianPitchHz)} Hz)`
        : '—',
    },
    { label: 'Est. key', value: dash(f.pitch.estimatedKey) },
    {
      label: 'Intonation (avg off)',
      value:
        f.pitch.meanAbsCentsOff != null
          ? `${f.pitch.meanAbsCentsOff} cents`
          : '—',
    },
    {
      label: 'Vocal range',
      value:
        f.pitch.rangeSemitones != null
          ? `${f.pitch.rangeSemitones} semitones`
          : '—',
    },
    {
      label: 'Vibrato',
      value:
        f.pitch.vibratoRateHz != null ? `${f.pitch.vibratoRateHz} Hz` : '—',
    },
    {
      label: 'Tempo',
      value:
        f.timing.estimatedTempoBpm != null
          ? `${f.timing.estimatedTempoBpm} BPM`
          : '—',
    },
    {
      label: 'Tempo steadiness',
      value:
        f.timing.tempoStability != null
          ? `${Math.round(f.timing.tempoStability * 100)}%`
          : '—',
    },
    { label: 'Timing trend', value: dash(f.timing.rushDragTrend) },
    {
      label: 'Loudness range',
      value:
        f.dynamics.loudnessRangeDb != null
          ? `${f.dynamics.loudnessRangeDb} dB`
          : '—',
    },
    { label: 'Dynamic trend', value: dash(f.dynamics.overallTrend) },
    { label: 'Sections (approx)', value: dash(f.structure.approxSectionCount) },
  ]
})

async function run() {
  if (!canAnalyze.value || !file.value) return
  await store.analyze({
    file: file.value,
    setlist: setlist.value,
    dimensions: selected.value,
  })
}
</script>