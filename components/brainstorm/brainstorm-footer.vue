<!-- /components/navigation/footer/brainstorm-footer.vue -->
<template>
  <div
    v-if="footerState !== 'hidden'"
    class="flex h-full min-h-0 w-full overflow-hidden rounded-2xl border border-base-300 bg-base-200/80 shadow-inner"
    :class="isCompact ? 'p-2' : 'p-2 md:p-3'"
  >
    <template v-if="isCompact">
      <div
        class="grid h-full min-h-0 w-full grid-cols-[auto_minmax(0,1fr)_auto_auto] items-stretch gap-2 overflow-hidden"
      >
        <button
          type="button"
          class="flex min-w-0 max-w-36 shrink-0 items-center gap-1.5 rounded-2xl border border-base-300 bg-base-100 px-2.5 py-1.5 text-xs font-semibold transition hover:border-primary hover:text-primary"
          @click="cycleSelectedPitch"
        >
          <Icon name="kind-icon:brain" class="h-4 w-4 shrink-0 text-primary" />
          <span class="truncate">
            {{ activePitchTitle }}
          </span>
        </button>

        <textarea
          ref="captureRef"
          v-model="captureText"
          class="textarea textarea-bordered h-full min-h-0 min-w-0 resize-none overflow-y-auto rounded-2xl bg-base-100 px-3 py-2 text-sm leading-snug"
          placeholder="Capture a prompt, pitch seed, or tiny idea goblin..."
          @input="queuePromptOffsetRefresh"
          @keydown.enter.exact.prevent="saveCapture"
        />

        <button
          type="button"
          class="btn btn-sm btn-secondary h-full shrink-0 rounded-2xl"
          :disabled="!hasActivePitch"
          @click="randomize"
        >
          <Icon name="kind-icon:dice" class="h-4 w-4" />
        </button>

        <button
          type="button"
          class="btn btn-sm btn-primary h-full shrink-0 rounded-2xl text-white"
          :disabled="pitchStore.loading || !hasActivePitch"
          @click="generate"
        >
          <span
            v-if="pitchStore.loading"
            class="loading loading-spinner loading-xs"
          />
          <span v-else>Generate</span>
        </button>
      </div>
    </template>

    <template v-else-if="isOpen">
      <div
        class="grid h-full min-h-0 w-full grid-cols-1 gap-3 overflow-hidden lg:grid-cols-[220px_minmax(0,1fr)]"
      >
        <section
          class="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-base-300 bg-base-100"
        >
          <div class="shrink-0 border-b border-base-300 p-2">
            <input
              v-model="searchQuery"
              class="input input-bordered input-sm w-full rounded-xl bg-base-200"
              placeholder="Search pitches..."
            />
          </div>

          <div class="min-h-0 flex-1 overflow-y-auto p-2">
            <button
              v-for="pitch in filteredPitches"
              :key="pitch.id"
              type="button"
              class="mb-1 flex w-full items-start gap-2 rounded-xl border px-2.5 py-2 text-left transition"
              :class="
                activePitch?.id === pitch.id
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-transparent hover:bg-base-200'
              "
              @click="selectPitch(pitch.id)"
            >
              <Icon
                :name="pitch.icon || 'kind-icon:idea'"
                class="mt-0.5 h-4 w-4 shrink-0"
              />

              <div class="min-w-0 flex-1">
                <div class="truncate text-xs font-bold">
                  {{ pitch.title || 'Untitled Pitch' }}
                </div>

                <div class="truncate text-[11px] text-base-content/50">
                  {{ pitch.PitchType || 'PITCH' }}
                </div>
              </div>
            </button>
          </div>
        </section>

        <section
          class="grid min-h-0 grid-rows-[auto_minmax(0,1fr)_auto] gap-2 overflow-hidden"
        >
          <div
            class="flex shrink-0 items-center gap-3 rounded-2xl border border-base-300 bg-base-100 px-3 py-2"
          >
            <template v-if="activePitch">
              <Icon
                :name="activePitch.icon || 'kind-icon:idea'"
                class="h-7 w-7 shrink-0 text-primary"
              />

              <div class="min-w-0 flex-1">
                <div class="truncate text-sm font-bold">
                  {{ activePitch.title || 'Untitled Pitch' }}
                </div>

                <div class="line-clamp-1 text-xs text-base-content/60">
                  {{ activePitch.description || activePitch.pitch }}
                </div>
              </div>

              <span class="badge badge-outline badge-sm shrink-0">
                {{ exampleCount }} examples
              </span>
            </template>

            <p v-else class="text-sm text-base-content/45">
              Select a pitch to start brainstorming.
            </p>
          </div>

          <div
            class="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-base-300 bg-base-100"
          >
            <div
              class="flex shrink-0 items-center justify-between gap-2 border-b border-base-300 px-3 py-2"
            >
              <span
                class="text-xs font-bold uppercase tracking-wide text-base-content/50"
              >
                {{ responseLines.length ? 'Generated Candidates' : 'Examples' }}
              </span>

              <button
                v-if="responseLines.length"
                type="button"
                class="btn btn-xs btn-ghost rounded-xl"
                @click="clearResponse"
              >
                Clear
              </button>
            </div>

            <div class="min-h-0 flex-1 overflow-y-auto p-2">
              <template v-if="responseLines.length">
                <div
                  v-for="line in responseLines"
                  :key="line"
                  class="mb-2 flex items-start gap-2 rounded-2xl border border-base-300 bg-base-200 px-3 py-2"
                >
                  <button
                    type="button"
                    class="min-w-0 flex-1 text-left text-xs leading-relaxed text-base-content/75"
                    @click="useLine(line)"
                  >
                    {{ line }}
                  </button>

                  <button
                    type="button"
                    class="btn btn-xs btn-success rounded-xl"
                    @click="keepLine(line)"
                  >
                    Keep
                  </button>
                </div>
              </template>

              <template v-else>
                <button
                  v-for="example in visibleExamples"
                  :key="example"
                  type="button"
                  class="mb-1 block w-full truncate rounded-xl px-2 py-1.5 text-left text-xs text-base-content/65 transition hover:bg-base-200"
                  @click="useLine(example)"
                >
                  {{ example }}
                </button>

                <p
                  v-if="!visibleExamples.length"
                  class="rounded-2xl border border-base-300 bg-base-200 p-4 text-center text-xs text-base-content/45"
                >
                  No examples yet. The idea basket contains one heroic
                  tumbleweed.
                </p>
              </template>
            </div>
          </div>

          <div
            class="grid shrink-0 grid-cols-1 gap-2 rounded-2xl border border-base-300 bg-base-100 p-2 sm:grid-cols-[minmax(0,1fr)_auto_auto_auto]"
          >
            <input
              v-model="captureText"
              class="input input-bordered input-sm min-w-0 rounded-xl bg-base-200"
              placeholder="Capture a line..."
              :disabled="!hasActivePitch"
              @keydown.enter.prevent="saveCapture"
            />

            <button
              type="button"
              class="btn btn-sm btn-secondary rounded-xl"
              :disabled="!hasActivePitch"
              @click="randomize"
            >
              <Icon name="kind-icon:dice" class="h-4 w-4" />
              Random
            </button>

            <button
              type="button"
              class="btn btn-sm btn-success rounded-xl"
              :disabled="!captureText.trim() || !hasActivePitch"
              @click="saveCapture"
            >
              Save
            </button>

            <button
              type="button"
              class="btn btn-sm btn-primary rounded-xl text-white"
              :disabled="pitchStore.loading || !hasActivePitch"
              @click="generate"
            >
              <span
                v-if="pitchStore.loading"
                class="loading loading-spinner loading-xs"
              />
              Generate
            </button>
          </div>
        </section>
      </div>
    </template>

    <template v-else>
      <div
        class="grid h-full min-h-0 w-full grid-cols-1 gap-3 overflow-hidden xl:grid-cols-[260px_minmax(0,1fr)_240px]"
      >
        <section
          class="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-base-300 bg-base-100"
        >
          <div
            class="flex shrink-0 items-center justify-between gap-2 border-b border-base-300 px-3 py-2"
          >
            <div>
              <h2 class="text-sm font-bold">Pitches</h2>
              <p class="text-xs text-base-content/50">Pick the big idea.</p>
            </div>

            <span class="badge badge-outline badge-sm">
              {{ filteredPitches.length }}
            </span>
          </div>

          <div class="shrink-0 border-b border-base-300 p-2">
            <input
              v-model="searchQuery"
              class="input input-bordered input-sm w-full rounded-xl bg-base-200"
              placeholder="Search pitches..."
            />
          </div>

          <div class="min-h-0 flex-1 overflow-y-auto p-2">
            <button
              v-for="pitch in filteredPitches"
              :key="pitch.id"
              type="button"
              class="mb-1.5 w-full rounded-2xl border px-3 py-2 text-left transition"
              :class="
                activePitch?.id === pitch.id
                  ? 'border-primary bg-primary/10'
                  : 'border-transparent hover:bg-base-200'
              "
              @click="selectPitch(pitch.id)"
            >
              <div class="flex items-start justify-between gap-2">
                <div class="min-w-0 flex-1">
                  <div class="truncate text-sm font-bold">
                    {{ pitch.title || 'Untitled Pitch' }}
                  </div>

                  <div class="line-clamp-2 text-xs text-base-content/55">
                    {{ pitch.pitch }}
                  </div>
                </div>

                <span class="badge badge-xs shrink-0">
                  {{ pitch.PitchType }}
                </span>
              </div>
            </button>
          </div>
        </section>

        <section
          class="grid min-h-0 grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden rounded-2xl border border-base-300 bg-base-100"
        >
          <div
            class="flex shrink-0 items-center justify-between gap-3 border-b border-base-300 px-4 py-3"
          >
            <template v-if="activePitch">
              <div class="min-w-0 flex-1">
                <div class="truncate text-lg font-black text-primary">
                  {{ activePitch.title || 'Untitled Pitch' }}
                </div>

                <p class="line-clamp-2 text-sm text-base-content/65">
                  {{ activePitch.description || activePitch.pitch }}
                </p>
              </div>

              <button
                type="button"
                class="btn btn-sm btn-ghost rounded-xl"
                @click="clearPitch"
              >
                Clear
              </button>
            </template>

            <p v-else class="text-sm text-base-content/45">
              Select a pitch from the left.
            </p>
          </div>

          <div class="min-h-0 overflow-y-auto p-4">
            <div class="grid gap-4">
              <section>
                <div class="mb-2 flex items-center justify-between gap-2">
                  <h3
                    class="text-xs font-bold uppercase tracking-wide text-base-content/50"
                  >
                    Examples
                  </h3>

                  <button
                    type="button"
                    class="btn btn-xs btn-ghost rounded-xl"
                    :disabled="!hasActivePitch"
                    @click="addBlankExample"
                  >
                    <Icon name="kind-icon:plus" class="h-4 w-4" />
                    Add
                  </button>
                </div>

                <div v-if="localExamples.length" class="grid gap-2">
                  <div
                    v-for="(_, index) in localExamples"
                    :key="`example-${index}`"
                    class="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2"
                  >
                    <span class="w-6 text-right font-mono text-xs opacity-40">
                      {{ index + 1 }}
                    </span>

                    <input
                      v-model="localExamples[index]"
                      class="input input-bordered input-sm rounded-xl bg-base-200 font-mono text-xs"
                      :placeholder="`Example ${index + 1}`"
                      @blur="flushExamples"
                      @keydown.enter.prevent="flushExamples"
                    />

                    <button
                      type="button"
                      class="btn btn-xs btn-ghost rounded-xl text-error"
                      @click="removeExample(index)"
                    >
                      <Icon name="kind-icon:x" class="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div
                  v-else
                  class="rounded-2xl border border-base-300 bg-base-200 p-4 text-sm text-base-content/50"
                >
                  No examples yet. Add one, or let the generator hallucinate
                  responsibly.
                </div>
              </section>

              <section v-if="responseLines.length">
                <div class="mb-2 flex items-center justify-between gap-2">
                  <h3
                    class="text-xs font-bold uppercase tracking-wide text-info"
                  >
                    AI Candidates
                  </h3>

                  <button
                    type="button"
                    class="btn btn-xs btn-info rounded-xl"
                    @click="keepAllLines"
                  >
                    Keep All
                  </button>
                </div>

                <div class="grid gap-2">
                  <div
                    v-for="line in responseLines"
                    :key="line"
                    class="flex items-start gap-2 rounded-2xl border border-base-300 bg-base-200 p-3"
                  >
                    <button
                      type="button"
                      class="min-w-0 flex-1 text-left text-sm leading-relaxed text-base-content/75"
                      @click="useLine(line)"
                    >
                      {{ line }}
                    </button>

                    <button
                      type="button"
                      class="btn btn-xs btn-primary rounded-xl"
                      @click="keepLine(line)"
                    >
                      Keep
                    </button>
                  </div>
                </div>
              </section>
            </div>
          </div>

          <div
            class="grid shrink-0 grid-cols-1 gap-2 border-t border-base-300 bg-base-200/60 p-3 sm:grid-cols-[minmax(0,1fr)_auto_auto]"
          >
            <input
              v-model="captureText"
              class="input input-bordered input-sm min-w-0 rounded-xl bg-base-100"
              placeholder="Capture a new example..."
              :disabled="!hasActivePitch"
              @keydown.enter.prevent="saveCapture"
            />

            <button
              type="button"
              class="btn btn-sm btn-success rounded-xl"
              :disabled="!captureText.trim() || !hasActivePitch"
              @click="saveCapture"
            >
              Save
            </button>

            <button
              type="button"
              class="btn btn-sm btn-primary rounded-xl text-white"
              :disabled="pitchStore.loading || !hasActivePitch"
              @click="generate"
            >
              <span
                v-if="pitchStore.loading"
                class="loading loading-spinner loading-xs"
              />
              Generate Lines
            </button>
          </div>
        </section>

        <section
          class="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-base-300 bg-base-100"
        >
          <div class="shrink-0 border-b border-base-300 px-3 py-2">
            <h2 class="text-sm font-bold">Generator</h2>
            <p class="text-xs text-base-content/50">
              Tune the little idea furnace.
            </p>
          </div>

          <div class="min-h-0 flex-1 overflow-y-auto p-3">
            <div class="grid gap-3">
              <label class="form-control">
                <span class="label">
                  <span class="label-text text-xs font-bold">Requests</span>
                </span>

                <input
                  v-model.number="pitchStore.numberOfRequests"
                  type="number"
                  min="1"
                  max="20"
                  class="input input-bordered input-sm rounded-xl bg-base-200"
                />
              </label>

              <label class="form-control">
                <div class="mb-1 flex items-center justify-between">
                  <span class="text-xs font-bold">Temperature</span>

                  <span class="font-mono text-xs font-bold text-primary">
                    {{ pitchStore.temperature.toFixed(1) }}
                  </span>
                </div>

                <input
                  v-model.number="pitchStore.temperature"
                  type="range"
                  min="0.1"
                  max="1.5"
                  step="0.1"
                  class="range range-primary range-sm"
                />
              </label>

              <label class="form-control">
                <span class="label">
                  <span class="label-text text-xs font-bold">Max Tokens</span>
                </span>

                <input
                  v-model.number="pitchStore.maxTokens"
                  type="number"
                  min="100"
                  max="4000"
                  step="100"
                  class="input input-bordered input-sm rounded-xl bg-base-200"
                />
              </label>

              <div class="divider my-0" />

              <button
                type="button"
                class="btn btn-info w-full rounded-xl"
                :disabled="!hasActivePitch"
                @click="randomize"
              >
                <Icon name="kind-icon:dice" class="h-4 w-4" />
                Random Example
              </button>

              <button
                type="button"
                class="btn btn-primary w-full rounded-xl text-white"
                :disabled="pitchStore.loading || !hasActivePitch"
                @click="generate"
              >
                <span
                  v-if="pitchStore.loading"
                  class="loading loading-spinner loading-sm"
                />
                Generate
              </button>

              <button
                type="button"
                class="btn btn-ghost w-full rounded-xl"
                :disabled="!captureText.trim()"
                @click="useCaptureAsPrompt"
              >
                Use Capture as Prompt
              </button>
            </div>

            <div
              v-if="statusMessage"
              class="mt-3 rounded-2xl border p-3 text-xs"
              :class="
                statusTone === 'error'
                  ? 'border-error/40 bg-error/10 text-error'
                  : 'border-success/40 bg-success/10 text-success'
              "
            >
              {{ statusMessage }}
            </div>
          </div>

          <div
            v-if="randomResult"
            class="shrink-0 border-t border-base-300 bg-base-200/60 p-3"
          >
            <div
              class="mb-1 text-xs font-bold uppercase tracking-wide text-base-content/40"
            >
              Random
            </div>

            <p class="text-xs leading-relaxed text-base-content/70">
              {{ randomResult }}
            </p>

            <button
              type="button"
              class="btn btn-xs btn-ghost mt-2 rounded-xl text-success"
              @click="captureText = randomResult"
            >
              Use this
            </button>
          </div>
        </section>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { Pitch } from '~/prisma/generated/prisma/client'
import { useDisplayStore } from '@/stores/displayStore'
import { usePitchStore } from '@/stores/pitchStore'
import { usePromptStore } from '@/stores/promptStore'

const pitchStore = usePitchStore()
const promptStore = usePromptStore()
const displayStore = useDisplayStore()

const footerOffsetKey = 'brainstorm'

const footerState = computed(() => displayStore.footerState)
const isCompact = computed(() => footerState.value === 'compact')
const isOpen = computed(() => footerState.value === 'open')

const captureRef = ref<HTMLTextAreaElement | null>(null)
let captureResizeObserver: ResizeObserver | null = null

const searchQuery = ref('')
const captureText = ref('')
const localExamples = ref<string[]>([])
const randomResult = ref('')
const statusMessage = ref('')
const statusTone = ref<'success' | 'error'>('success')
const savingExamples = ref(false)

const activePitch = computed<Pitch | null>(() => {
  return pitchStore.selectedPitch || pitchStore.selectedTitle || null
})

const hasActivePitch = computed(() => Boolean(activePitch.value))

const activePitchTitle = computed(() => {
  return activePitch.value?.title || activePitch.value?.pitch || 'Pick a pitch'
})

const filteredPitches = computed<Pitch[]>(() => {
  const query = searchQuery.value.trim().toLowerCase()
  const base = pitchStore.visiblePitches?.length
    ? pitchStore.visiblePitches
    : pitchStore.publicPitches?.length
      ? pitchStore.publicPitches
      : pitchStore.pitches

  if (!query) return base

  return base.filter((pitch) => {
    const haystack = [
      pitch.title,
      pitch.pitch,
      pitch.description,
      pitch.flavorText,
      pitch.PitchType,
      pitch.designer,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()

    return haystack.includes(query)
  })
})

const currentExamples = computed(() => {
  return parseExamples(activePitch.value?.examples)
})

const visibleExamples = computed(() => {
  return currentExamples.value.slice(0, 8)
})

const exampleCount = computed(() => {
  return currentExamples.value.length
})

const responseLines = computed(() => {
  return (pitchStore.apiResponse || '')
    .split('\n')
    .map((line) => line.replace(/^[-*\d.)\s]+/, '').trim())
    .filter(Boolean)
})

onMounted(async () => {
  await Promise.all([
    pitchStore.initialize({
      fetchRemote: true,
      createBlankForm: true,
    }),
    promptStore.initialize({
      fetchRemote: true,
      createBlankForm: true,
    }),
  ])

  syncLocalExamples()
  queuePromptOffsetRefresh()

  captureResizeObserver = new ResizeObserver(() => {
    refreshPromptOffset()
  })

  if (captureRef.value) {
    captureResizeObserver.observe(captureRef.value)
  }
})

onBeforeUnmount(() => {
  captureResizeObserver?.disconnect()
  captureResizeObserver = null
  displayStore.clearPromptOffset(footerOffsetKey)
})

watch(
  () => activePitch.value?.id,
  () => {
    syncLocalExamples()
  },
)

watch(
  () => [
    footerState.value,
    displayStore.footerComponent,
    captureText.value,
    pitchStore.apiResponse,
  ],
  () => {
    queuePromptOffsetRefresh()
  },
)

function parseExamples(raw?: string | null): string[] {
  return String(raw || '')
    .split(/\||\n|;/)
    .map((entry) => entry.trim())
    .filter(Boolean)
}

function setStatus(message: string, tone: 'success' | 'error' = 'success') {
  statusMessage.value = message
  statusTone.value = tone

  window.setTimeout(() => {
    statusMessage.value = ''
  }, 2400)
}

function syncLocalExamples() {
  localExamples.value = parseExamples(activePitch.value?.examples)
  pitchStore.exampleString = localExamples.value.join(' | ')
}

function selectPitch(pitchId: number) {
  pitchStore.setSelectedPitch(pitchId)
  pitchStore.setSelectedTitle(pitchId)
  syncLocalExamples()
}

function clearPitch() {
  pitchStore.selectedPitch = null
  pitchStore.selectedTitle = null
  localExamples.value = []
  randomResult.value = ''
  captureText.value = ''
}

function cycleSelectedPitch() {
  const list = filteredPitches.value

  if (!list.length) return

  const currentId = activePitch.value?.id ?? -1
  const currentIndex = list.findIndex((pitch) => pitch.id === currentId)
  const nextPitch = list[(currentIndex + 1) % list.length]

  if (nextPitch) {
    selectPitch(nextPitch.id)
  }
}

function addBlankExample() {
  if (!hasActivePitch.value) return

  localExamples.value.push('')
  queuePromptOffsetRefresh()
}

function removeExample(index: number) {
  localExamples.value.splice(index, 1)
  void flushExamples()
}

async function flushExamples() {
  if (!activePitch.value || savingExamples.value) return

  savingExamples.value = true

  try {
    const nextExamples = localExamples.value
      .map((entry) => entry.trim())
      .filter(Boolean)

    const result = await pitchStore.updatePitchExamples(
      activePitch.value.id,
      nextExamples,
    )

    if (!result.success) {
      throw new Error(result.message || 'Failed to save examples.')
    }

    pitchStore.exampleString = nextExamples.join(' | ')
    setStatus('Examples saved.')
  } catch (error) {
    setStatus(
      error instanceof Error ? error.message : 'Failed to save examples.',
      'error',
    )
  } finally {
    savingExamples.value = false
  }
}

async function saveCapture() {
  const text = captureText.value.trim()

  if (!text || !activePitch.value) return

  localExamples.value.push(text)
  captureText.value = ''

  await flushExamples()
  queuePromptOffsetRefresh()
}

function randomize() {
  const examples = currentExamples.value

  if (!examples.length) {
    setStatus('No examples available to randomize.', 'error')
    return
  }

  const selected = examples[Math.floor(Math.random() * examples.length)]

  if (!selected) return

  randomResult.value = selected
  captureText.value = selected
}

function useLine(line: string) {
  promptStore.promptField = line
  promptStore.currentPrompt = line
  promptStore.syncToLocalStorage()
  setStatus('Line sent to prompt field.')
}

function useCaptureAsPrompt() {
  const text = captureText.value.trim()

  if (!text) return

  useLine(text)
}

async function keepLine(line: string) {
  if (!line.trim() || !activePitch.value) return

  localExamples.value.push(line.trim())
  await flushExamples()
}

async function keepAllLines() {
  if (!responseLines.value.length || !activePitch.value) return

  localExamples.value.push(...responseLines.value)
  await flushExamples()
}

function clearResponse() {
  pitchStore.apiResponse = ''
  pitchStore.saveStateToLocalStorage()
}

async function generate() {
  if (!activePitch.value) {
    setStatus('Select a pitch first.', 'error')
    return
  }

  pitchStore.selectedTitle = activePitch.value
  pitchStore.selectedPitch = activePitch.value
  pitchStore.exampleString = localExamples.value
    .map((entry) => entry.trim())
    .filter(Boolean)
    .join(' | ')

  const result = await pitchStore.fetchBrainstormPitches()

  if (!result.success) {
    setStatus(result.message || 'Brainstorm failed.', 'error')
    return
  }

  setStatus('Brainstorm generated.')
}

function refreshPromptOffset() {
  if (displayStore.footerComponent !== footerOffsetKey) {
    displayStore.clearPromptOffset(footerOffsetKey)
    return
  }

  if (footerState.value === 'hidden' || footerState.value === 'priority') {
    displayStore.clearPromptOffset(footerOffsetKey)
    return
  }

  const el = captureRef.value

  if (!el) {
    displayStore.clearPromptOffset(footerOffsetKey)
    return
  }

  displayStore.refreshPromptOffset(
    footerOffsetKey,
    el.scrollHeight,
    el.clientHeight,
    footerState.value === 'compact' ? 1.5 : 2.5,
  )
}

function queuePromptOffsetRefresh() {
  nextTick(() => {
    refreshPromptOffset()
  })
}
</script>
