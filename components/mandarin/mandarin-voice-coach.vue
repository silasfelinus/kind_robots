<template>
  <section class="border-t border-base-300 bg-base-100 p-5 sm:p-7">
    <div class="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
      <div class="max-w-2xl">
        <div class="flex flex-wrap items-center gap-2">
          <h3 class="text-lg font-bold">Say it</h3>
          <span class="badge badge-outline">voice coach</span>
        </div>
        <p class="mt-1 text-sm leading-relaxed opacity-70">
          Record the word. The speech recognizer reports what it heard without being told the target,
          while a separate on-device pitch check compares the broad tone shape.
        </p>
        <div class="mt-3 flex flex-wrap gap-2">
          <span
            v-for="tone in toneTargets"
            :key="`${tone.syllable}:${tone.spokenTone}`"
            class="badge badge-lg gap-2 bg-base-200"
            :title="tone.note || tone.label"
          >
            <span class="font-semibold">{{ tone.syllable }}</span>
            <span aria-hidden="true">{{ tone.arrow }}</span>
            <span class="text-xs opacity-65">T{{ tone.spokenTone }}</span>
          </span>
        </div>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <button
          v-if="!recording"
          type="button"
          class="btn btn-primary"
          :disabled="evaluating || !voiceSupported"
          @click="startRecording"
        >
          <span v-if="evaluating" class="loading loading-spinner loading-xs" />
          {{ evaluating ? 'Listening…' : transcript ? 'Try again' : 'Record me' }}
        </button>
        <button
          v-else
          type="button"
          class="btn btn-error"
          @click="stopRecording"
        >
          Stop & check
        </button>
        <span v-if="recording" class="flex items-center gap-2 text-sm font-semibold text-error" role="status">
          <span class="h-2.5 w-2.5 animate-pulse rounded-full bg-current" />
          Recording
        </span>
      </div>
    </div>

    <p v-if="!voiceSupported" class="mt-3 text-sm opacity-60">
      This browser does not expose microphone recording. The regular pronunciation playback still works.
    </p>
    <p v-if="error" class="mt-3 text-sm text-error" role="alert">{{ error }}</p>

    <div v-if="audioUrl" class="mt-4 rounded-2xl border border-base-300 bg-base-200/40 p-4">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p class="text-xs font-semibold uppercase tracking-wide opacity-55">Your recording</p>
          <p class="text-xs opacity-60">Not saved by Kind Robots. The clip is sent to the configured speech service only for transcription.</p>
        </div>
        <audio :src="audioUrl" controls class="h-10 max-w-full" />
      </div>
    </div>

    <div v-if="transcript || toneAnalysis" class="mt-4 grid gap-4 lg:grid-cols-2" aria-live="polite">
      <div class="rounded-2xl border border-base-300 bg-base-200/40 p-4">
        <p class="text-xs font-semibold uppercase tracking-wide opacity-55">What I heard</p>
        <p v-if="transcript" class="mt-2 text-2xl font-bold">{{ transcript }}</p>
        <p v-else class="mt-2 text-sm opacity-60">The transcript was unavailable.</p>
        <div v-if="comparison" class="mt-3 text-sm leading-relaxed">
          <span
            class="badge mr-2"
            :class="comparison.status === 'match' ? 'badge-success' : comparison.status === 'contains' ? 'badge-warning' : 'badge-error'"
          >
            {{ comparison.status === 'match' ? 'heard target' : comparison.status === 'contains' ? 'heard inside phrase' : 'heard differently' }}
          </span>
          {{ comparison.message }}
        </div>
        <p class="mt-3 text-xs opacity-55">
          Target: <span class="font-semibold">{{ card.simplified }}</span> · {{ card.pinyin }}
        </p>
      </div>

      <div class="rounded-2xl border border-base-300 bg-base-200/40 p-4">
        <p class="text-xs font-semibold uppercase tracking-wide opacity-55">Rough tone shape</p>
        <div v-if="toneAnalysis?.observations.length" class="mt-2 space-y-2">
          <div
            v-for="observation in toneAnalysis.observations"
            :key="`${observation.syllable}:${observation.expectedTone}`"
            class="rounded-xl border border-base-300 bg-base-100 p-3"
          >
            <div class="flex flex-wrap items-center gap-2">
              <span class="text-lg font-bold">{{ observation.syllable }}</span>
              <span class="badge badge-outline">{{ observation.expectedArrow }} T{{ observation.expectedTone }}</span>
              <span class="badge" :class="verdictClass(observation.verdict)">
                heard {{ observation.observedShape }}
              </span>
            </div>
            <p class="mt-1 text-sm leading-relaxed opacity-75">{{ observation.feedback }}</p>
          </div>
        </div>
        <p v-else class="mt-2 text-sm opacity-60">No stable pitch trace was available for this attempt.</p>
        <p v-if="toneAnalysis" class="mt-3 text-xs leading-relaxed opacity-55">
          {{ toneAnalysis.note }} Voiced frames: {{ toneAnalysis.voicedPercent }}%.
        </p>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { performFetch } from '@/stores/utils'
import { analyzeMandarinToneShapes, type MandarinToneAnalysis } from '@/stores/helpers/mandarinToneAnalysis'
import {
  compareMandarinTranscript,
  parsePinyinToneTargets,
} from '@/utils/mandarinPronunciation'
import type { MandarinCard } from '@/utils/mandarin'

const props = defineProps<{
  card: MandarinCard
}>()

type TranscriptionData = {
  transcript?: string
  model?: string
}

const recording = ref(false)
const evaluating = ref(false)
const error = ref<string | null>(null)
const transcript = ref('')
const toneAnalysis = ref<MandarinToneAnalysis | null>(null)
const audioUrl = ref<string | null>(null)

let mediaRecorder: MediaRecorder | null = null
let mediaStream: MediaStream | null = null
let chunks: Blob[] = []
let autoStopTimer: ReturnType<typeof setTimeout> | null = null
let recordingCardKey = ''
let recordingPinyin = ''
let disposed = false

const voiceSupported = computed(
  () =>
    import.meta.client &&
    typeof MediaRecorder !== 'undefined' &&
    Boolean(navigator.mediaDevices?.getUserMedia),
)

const toneTargets = computed(() => parsePinyinToneTargets(props.card.pinyin))
const comparison = computed(() =>
  transcript.value
    ? compareMandarinTranscript({
        transcript: transcript.value,
        simplified: props.card.simplified,
        traditional: props.card.traditional,
      })
    : null,
)

function clearTimer() {
  if (autoStopTimer) clearTimeout(autoStopTimer)
  autoStopTimer = null
}

function stopMediaStream() {
  mediaStream?.getTracks().forEach((track) => track.stop())
  mediaStream = null
}

function clearAttempt() {
  transcript.value = ''
  toneAnalysis.value = null
  error.value = null
  if (audioUrl.value) URL.revokeObjectURL(audioUrl.value)
  audioUrl.value = null
}

function preferredMimeType(): string | undefined {
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/mp4',
    'audio/webm',
    'audio/ogg;codecs=opus',
  ]
  return candidates.find((type) => MediaRecorder.isTypeSupported(type))
}

function extensionForMimeType(value: string): string {
  const type = value.split(';')[0]?.toLowerCase()
  if (type === 'audio/mp4') return 'm4a'
  if (type === 'audio/ogg') return 'ogg'
  if (type === 'audio/wav') return 'wav'
  return 'webm'
}

async function transcribe(file: File): Promise<string> {
  const form = new FormData()
  form.append('audio', file, file.name)
  const response = await performFetch<TranscriptionData>(
    '/api/mandarin/pronunciation',
    {
      method: 'POST',
      body: form,
    },
    1,
    45_000,
  )

  const heard = response.data?.transcript?.trim() || ''
  if (!response.success || !heard) {
    throw new Error(response.message || 'The speech recognizer did not return a transcript.')
  }
  return heard
}

async function evaluateRecording(blob: Blob, cardKey: string, pinyin: string) {
  if (disposed || props.card.key !== cardKey) return
  evaluating.value = true
  error.value = null
  const mimeType = blob.type || 'audio/webm'
  const extension = extensionForMimeType(mimeType)
  const file = new File([blob], `mandarin-${Date.now()}.${extension}`, {
    type: mimeType,
  })

  if (audioUrl.value) URL.revokeObjectURL(audioUrl.value)
  audioUrl.value = URL.createObjectURL(blob)

  const [transcriptionResult, toneResult] = await Promise.allSettled([
    transcribe(file),
    analyzeMandarinToneShapes(file, pinyin),
  ])

  if (disposed || props.card.key !== cardKey) {
    evaluating.value = false
    return
  }

  if (transcriptionResult.status === 'fulfilled') {
    transcript.value = transcriptionResult.value
  } else {
    error.value =
      transcriptionResult.reason instanceof Error
        ? transcriptionResult.reason.message
        : 'The speech recognizer could not evaluate this attempt.'
  }

  if (toneResult.status === 'fulfilled') {
    toneAnalysis.value = toneResult.value
  } else if (!error.value) {
    error.value =
      toneResult.reason instanceof Error
        ? toneResult.reason.message
        : 'Local tone analysis could not evaluate this attempt.'
  }

  evaluating.value = false
}

async function startRecording() {
  if (!voiceSupported.value || evaluating.value) return
  clearAttempt()

  try {
    mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    })
    chunks = []
    recordingCardKey = props.card.key
    recordingPinyin = props.card.pinyin
    const mimeType = preferredMimeType()
    mediaRecorder = mimeType
      ? new MediaRecorder(mediaStream, { mimeType })
      : new MediaRecorder(mediaStream)

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunks.push(event.data)
    }
    mediaRecorder.onstop = () => {
      const cardKey = recordingCardKey
      const pinyin = recordingPinyin
      const blob = new Blob(chunks, {
        type: mediaRecorder?.mimeType || mimeType || 'audio/webm',
      })
      chunks = []
      mediaRecorder = null
      stopMediaStream()
      if (disposed || props.card.key !== cardKey) return
      if (blob.size > 0) void evaluateRecording(blob, cardKey, pinyin)
      else error.value = 'The microphone recording was empty. Try again.'
    }

    mediaRecorder.start(250)
    recording.value = true
    autoStopTimer = setTimeout(() => stopRecording(), 12_000)
  } catch (cause) {
    stopMediaStream()
    error.value =
      cause instanceof Error
        ? `Microphone unavailable: ${cause.message}`
        : 'Microphone access was not available.'
  }
}

function stopRecording() {
  if (!recording.value) return
  recording.value = false
  clearTimer()
  if (mediaRecorder?.state !== 'inactive') mediaRecorder?.stop()
  else stopMediaStream()
}

function verdictClass(verdict: MandarinToneAnalysis['observations'][number]['verdict']): string {
  if (verdict === 'good') return 'badge-success'
  if (verdict === 'practice') return 'badge-warning'
  return 'badge-ghost'
}

watch(
  () => props.card.key,
  () => {
    if (recording.value) stopRecording()
    clearAttempt()
  },
)

onBeforeUnmount(() => {
  disposed = true
  clearTimer()
  if (mediaRecorder?.state !== 'inactive') mediaRecorder?.stop()
  stopMediaStream()
  if (audioUrl.value) URL.revokeObjectURL(audioUrl.value)
})
</script>
