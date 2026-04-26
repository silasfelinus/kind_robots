<!-- /components/navigation/footer/brainstorm-footer.vue -->
<!--
  Three states driven by displayStore.footerState:
  compact  — single row: active pitch badge · capture input · randomize · generate
  open     — two columns: pitch picker | pitch summary + capture + response preview
  priority — three zones: pitch browser | examples editor + AI candidates | LLM controls
-->
<template>
  <div
    v-if="footerState !== 'hidden'"
    class="flex h-full w-full min-h-0 overflow-hidden rounded-2xl border border-base-300 bg-base-200/80 p-2 shadow-inner md:p-3"
  >
    <!-- ════════════════════════════════════════════
         COMPACT — single tight row
         ════════════════════════════════════════════ -->
    <template v-if="isCompact">
      <div
        class="flex h-full w-full min-h-0 items-center gap-2 overflow-hidden"
      >
        <!-- Active pitch badge / picker trigger -->
        <button
          type="button"
          class="shrink-0 flex items-center gap-1.5 rounded-xl border border-base-300 bg-base-100 px-2.5 py-1.5 text-xs font-semibold transition hover:border-primary hover:text-primary"
          @click="cycleSelectedPitch"
        >
          <Icon name="mdi:brain" class="h-3.5 w-3.5 text-primary shrink-0" />
          <span class="max-w-30 truncate">{{ activePitchTitle }}</span>
          <Icon name="mdi:chevron-right" class="h-3 w-3 opacity-40 shrink-0" />
        </button>

        <!-- Capture input -->
        <div
          class="flex min-w-0 flex-1 items-stretch gap-2 overflow-hidden rounded-xl border border-base-300 bg-base-100 px-2"
        >
          <input
            ref="captureRef"
            v-model="captureText"
            class="min-w-0 flex-1 bg-transparent py-1.5 text-sm outline-none placeholder:text-base-content/30"
            placeholder="Capture an idea…"
            @keydown.enter.prevent="saveCapture"
          />
          <button
            v-if="captureText.trim()"
            type="button"
            class="btn btn-xs btn-ghost my-auto shrink-0 text-success"
            @click="saveCapture"
          >
            Save
          </button>
        </div>

        <!-- Randomize -->
        <button
          type="button"
          class="btn btn-xs btn-ghost shrink-0"
          :disabled="!hasActivePitch"
          title="Pull a random example"
          @click="randomize"
        >
          <Icon name="mdi:shuffle-variant" class="h-4 w-4" />
        </button>

        <!-- Generate -->
        <button
          type="button"
          class="btn btn-xs btn-primary shrink-0"
          :disabled="pitchStore.loading || !hasActivePitch"
          @click="generate"
        >
          <span
            v-if="pitchStore.loading"
            class="loading loading-spinner loading-xs"
          />
          <Icon v-else name="mdi:lightning-bolt" class="h-4 w-4" />
          {{ pitchStore.loading ? '…' : 'Generate' }}
        </button>
      </div>
    </template>

    <!-- ════════════════════════════════════════════
         OPEN — two columns
         ════════════════════════════════════════════ -->
    <template v-else-if="isOpen">
      <div
        class="grid h-full w-full min-h-0 grid-cols-1 gap-3 overflow-hidden lg:grid-cols-[200px_minmax(0,1fr)]"
      >
        <!-- LEFT: compact pitch picker -->
        <section
          class="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-base-300 bg-base-100"
        >
          <div class="shrink-0 border-b border-base-300 p-2">
            <input
              v-model="searchQuery"
              class="input input-xs input-bordered w-full rounded-xl"
              placeholder="Search…"
            />
          </div>
          <div class="min-h-0 flex-1 overflow-y-auto p-1.5 space-y-0.5">
            <button
              v-for="pitch in filteredPitches"
              :key="pitch.id"
              type="button"
              class="flex w-full items-start gap-2 rounded-xl px-2 py-1.5 text-left transition hover:bg-base-200"
              :class="
                activePitch?.id === pitch.id
                  ? 'bg-primary/10 text-primary'
                  : 'text-base-content'
              "
              @click="selectPitch(pitch.id)"
            >
              <div class="min-w-0 flex-1">
                <div class="truncate text-xs font-semibold">
                  {{ pitch.title || 'Untitled' }}
                </div>
                <div class="truncate text-[10px] opacity-50">
                  {{ pitch.PitchType }}
                </div>
              </div>
              <span
                v-if="activePitch?.id === pitch.id"
                class="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary"
              />
            </button>
          </div>
        </section>

        <!-- RIGHT: summary + capture + response preview + controls -->
        <section
          class="grid min-h-0 grid-rows-[auto_1fr_auto] gap-2 overflow-hidden"
        >
          <!-- Selected pitch summary -->
          <div
            class="flex shrink-0 items-center gap-3 rounded-2xl border border-base-300 bg-base-100 px-3 py-2"
          >
            <template v-if="activePitch">
              <div class="min-w-0 flex-1">
                <div class="truncate text-sm font-bold">
                  {{ activePitch.title }}
                </div>
                <div class="line-clamp-1 text-xs opacity-60">
                  {{ activePitch.description || activePitch.pitch }}
                </div>
              </div>
              <span class="badge badge-xs badge-outline shrink-0">
                {{ exampleCount }} examples
              </span>
            </template>
            <p v-else class="text-sm opacity-40">
              Select a pitch from the list.
            </p>
          </div>

          <!-- Response preview / examples preview -->
          <div
            class="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-base-300 bg-base-100"
          >
            <div
              class="flex shrink-0 items-center justify-between gap-2 border-b border-base-300 px-3 py-1.5"
            >
              <span
                class="text-xs font-semibold opacity-60 uppercase tracking-wider"
              >
                {{ apiLines.length ? 'Last response' : 'Examples' }}
              </span>
              <button
                v-if="apiLines.length"
                type="button"
                class="btn btn-xs btn-ghost"
                @click="clearResponse"
              >
                Clear
              </button>
            </div>

            <div class="min-h-0 flex-1 overflow-y-auto p-2 space-y-1">
              <template v-if="apiLines.length">
                <div
                  v-for="(line, i) in apiLines"
                  :key="`resp-${i}`"
                  class="flex items-start gap-2 rounded-xl border border-base-300 bg-base-200 px-2 py-1.5"
                >
                  <p class="flex-1 text-xs leading-relaxed">{{ line }}</p>
                  <button
                    type="button"
                    class="btn btn-xs btn-ghost text-success shrink-0"
                    @click="keepLine(line)"
                  >
                    Keep
                  </button>
                </div>
              </template>
              <template v-else>
                <p
                  v-for="(ex, i) in currentExamples.slice(0, 5)"
                  :key="`ex-${i}`"
                  class="text-xs opacity-60 px-1 py-0.5 line-clamp-1"
                >
                  {{ ex }}
                </p>
                <p
                  v-if="!currentExamples.length"
                  class="text-xs opacity-30 italic px-1"
                >
                  No examples yet.
                </p>
              </template>
            </div>
          </div>

          <!-- Capture row + controls -->
          <div
            class="flex shrink-0 items-center gap-2 rounded-2xl border border-base-300 bg-base-100 px-3 py-2"
          >
            <input
              v-model="captureText"
              class="input input-sm input-bordered flex-1 min-w-0"
              placeholder="Capture a new line…"
              :disabled="!hasActivePitch"
              @keydown.enter.prevent="saveCapture"
            />
            <button
              type="button"
              class="btn btn-sm btn-ghost shrink-0"
              :disabled="!hasActivePitch"
              title="Random example"
              @click="randomize"
            >
              <Icon name="mdi:shuffle-variant" class="h-4 w-4" />
            </button>
            <button
              type="button"
              class="btn btn-sm btn-success shrink-0"
              :disabled="!captureText.trim() || !hasActivePitch"
              @click="saveCapture"
            >
              Save
            </button>
            <button
              type="button"
              class="btn btn-sm btn-primary shrink-0"
              :disabled="pitchStore.loading || !hasActivePitch"
              @click="generate"
            >
              <span
                v-if="pitchStore.loading"
                class="loading loading-spinner loading-xs"
              />
              <Icon v-else name="mdi:lightning-bolt" class="h-4 w-4" />
              Generate
            </button>
          </div>
        </section>
      </div>
    </template>

    <!-- ════════════════════════════════════════════
         PRIORITY — full three-zone layout
         ════════════════════════════════════════════ -->
    <template v-else>
      <div
        class="grid h-full w-full min-h-0 grid-cols-1 gap-3 overflow-hidden xl:grid-cols-[240px_minmax(0,1fr)_220px]"
      >
        <!-- LEFT: pitch browser -->
        <section
          class="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-base-300 bg-base-100"
        >
          <div
            class="flex shrink-0 items-center justify-between gap-2 border-b border-base-300 px-3 py-2"
          >
            <span class="text-sm font-semibold">Pitches</span>
            <span class="badge badge-outline badge-xs">{{
              filteredPitches.length
            }}</span>
          </div>

          <div class="shrink-0 p-2 border-b border-base-300">
            <input
              v-model="searchQuery"
              class="input input-xs input-bordered w-full rounded-xl"
              placeholder="Search pitches…"
            />
          </div>

          <div class="min-h-0 flex-1 overflow-y-auto p-2 space-y-1">
            <button
              v-for="pitch in filteredPitches"
              :key="pitch.id"
              type="button"
              class="w-full rounded-xl border px-2.5 py-2 text-left transition"
              :class="
                activePitch?.id === pitch.id
                  ? 'border-primary bg-primary/10'
                  : 'border-transparent hover:bg-base-200'
              "
              @click="selectPitch(pitch.id)"
            >
              <div class="flex items-start justify-between gap-2">
                <span class="line-clamp-1 text-xs font-semibold">
                  {{ pitch.title || 'Untitled' }}
                </span>
                <span class="badge badge-xs shrink-0">{{
                  pitch.PitchType
                }}</span>
              </div>
              <p class="mt-0.5 line-clamp-1 text-[10px] opacity-50">
                {{ pitch.pitch }}
              </p>
            </button>
          </div>
        </section>

        <!-- CENTER: examples editor + AI candidates -->
        <section
          class="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-base-300 bg-base-100"
        >
          <!-- Pitch context bar -->
          <div
            class="flex shrink-0 items-center justify-between gap-2 border-b border-base-300 px-3 py-2"
          >
            <template v-if="activePitch">
              <div class="min-w-0 flex-1">
                <span class="text-sm font-bold truncate block">{{
                  activePitch.title
                }}</span>
                <span class="text-xs opacity-50 truncate block">
                  {{ activePitch.description || activePitch.pitch }}
                </span>
              </div>
              <span class="badge badge-neutral badge-xs shrink-0">
                {{ exampleCount }} examples
              </span>
            </template>
            <p v-else class="text-sm opacity-40">Select a pitch →</p>
          </div>

          <div class="min-h-0 flex-1 overflow-y-auto p-3 space-y-4">
            <!-- Examples editor -->
            <div>
              <div class="mb-2 flex items-center justify-between">
                <span
                  class="text-xs font-semibold uppercase tracking-wider opacity-50"
                >
                  Examples
                </span>
                <button
                  type="button"
                  class="btn btn-xs btn-ghost"
                  :disabled="!hasActivePitch"
                  @click="addBlankExample"
                >
                  <Icon name="mdi:plus" class="h-3 w-3" /> Add
                </button>
              </div>

              <transition-group name="ex-list" tag="div" class="space-y-1">
                <div
                  v-for="(_, i) in localExamples"
                  :key="`lex-${i}`"
                  class="group flex items-center gap-1.5"
                >
                  <span
                    class="w-4 shrink-0 text-right font-mono text-[10px] opacity-30"
                  >
                    {{ i + 1 }}
                  </span>
                  <input
                    v-model="localExamples[i]"
                    class="input input-xs input-bordered flex-1 font-mono text-xs"
                    :placeholder="`Example ${i + 1}`"
                    @blur="flushExamples"
                  />
                  <button
                    type="button"
                    class="btn btn-xs btn-ghost text-error opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                    @click="removeExample(i)"
                  >
                    <Icon name="mdi:close" class="h-3 w-3" />
                  </button>
                </div>
              </transition-group>
            </div>

            <!-- AI candidates -->
            <Transition name="fade-slide">
              <div v-if="apiLines.length">
                <div class="mb-2 flex items-center justify-between">
                  <span
                    class="text-xs font-semibold text-info uppercase tracking-wider"
                  >
                    <Icon name="mdi:brain" class="inline h-3 w-3 mr-1" />
                    AI candidates
                  </span>
                  <button
                    type="button"
                    class="btn btn-xs btn-info"
                    @click="keepAllLines"
                  >
                    Keep all
                  </button>
                </div>
                <div class="space-y-1">
                  <div
                    v-for="(line, i) in apiLines"
                    :key="`ai-${i}`"
                    class="flex items-start gap-2 rounded-xl border border-base-300 bg-base-200 px-2 py-1.5"
                  >
                    <p class="flex-1 text-xs leading-relaxed">{{ line }}</p>
                    <button
                      type="button"
                      class="btn btn-xs btn-primary shrink-0"
                      @click="keepLine(line)"
                    >
                      Keep
                    </button>
                  </div>
                </div>
              </div>
            </Transition>
          </div>

          <!-- Capture row at bottom -->
          <div
            class="flex shrink-0 items-center gap-2 border-t border-base-300 bg-base-200/60 px-3 py-2"
          >
            <input
              v-model="captureText"
              class="input input-sm input-bordered flex-1 min-w-0"
              placeholder="Capture a new line and save…"
              :disabled="!hasActivePitch"
              @keydown.enter.prevent="saveCapture"
            />
            <button
              type="button"
              class="btn btn-sm btn-success shrink-0"
              :disabled="!captureText.trim() || !hasActivePitch"
              @click="saveCapture"
            >
              <Icon name="mdi:plus" class="h-4 w-4" />
              Save
            </button>
          </div>
        </section>

        <!-- RIGHT: LLM controls + generate -->
        <section
          class="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-base-300 bg-base-100"
        >
          <div class="shrink-0 border-b border-base-300 px-3 py-2">
            <span class="text-sm font-semibold">Generator</span>
          </div>

          <div class="min-h-0 flex-1 overflow-y-auto p-3 space-y-3">
            <label class="form-control">
              <div class="label py-0.5">
                <span class="label-text text-xs">Requests</span>
              </div>
              <input
                v-model.number="pitchStore.numberOfRequests"
                type="number"
                min="1"
                max="10"
                class="input input-sm input-bordered rounded-xl"
              />
            </label>

            <label class="form-control">
              <div class="label py-0.5">
                <span class="label-text text-xs">Temperature</span>
                <span class="label-text-alt font-mono text-xs font-bold">
                  {{ pitchStore.temperature.toFixed(1) }}
                </span>
              </div>
              <input
                v-model.number="pitchStore.temperature"
                type="range"
                min="0.1"
                max="1.5"
                step="0.1"
                class="range range-sm range-primary"
              />
            </label>

            <label class="form-control">
              <div class="label py-0.5">
                <span class="label-text text-xs">Max tokens</span>
              </div>
              <input
                v-model.number="pitchStore.maxTokens"
                type="number"
                min="100"
                max="2000"
                step="100"
                class="input input-sm input-bordered rounded-xl"
              />
            </label>

            <div class="divider my-0" />

            <button
              type="button"
              class="btn btn-info w-full rounded-xl"
              :disabled="pitchStore.loading || !hasActivePitch"
              @click="generate"
            >
              <span
                v-if="pitchStore.loading"
                class="loading loading-spinner loading-sm"
              />
              <Icon v-else name="mdi:lightning-bolt" class="h-4 w-4" />
              {{ pitchStore.loading ? 'Generating…' : 'Generate lines' }}
            </button>

            <button
              type="button"
              class="btn btn-ghost w-full rounded-xl"
              :disabled="!hasActivePitch"
              @click="randomize"
            >
              <Icon name="mdi:shuffle-variant" class="h-4 w-4" />
              Randomize example
            </button>

            <Transition name="fade-slide">
              <div
                v-if="statusMessage"
                class="rounded-xl border border-base-300 bg-base-200 p-2 text-xs"
              >
                {{ statusMessage }}
              </div>
            </Transition>
          </div>

          <!-- Random result preview -->
          <Transition name="fade-slide">
            <div
              v-if="randomResult"
              class="shrink-0 border-t border-base-300 bg-base-200/60 p-3"
            >
              <div
                class="mb-1 text-[10px] font-semibold uppercase tracking-wider opacity-50"
              >
                Random
              </div>
              <p class="text-xs leading-relaxed">{{ randomResult }}</p>
              <button
                type="button"
                class="btn btn-xs btn-ghost mt-1.5 text-success"
                @click="captureText = randomResult"
              >
                Use this →
              </button>
            </div>
          </Transition>
        </section>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
// /components/navigation/footer/brainstorm-footer.vue
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { Pitch } from '~/prisma/generated/prisma/client'
import { usePitchStore } from '@/stores/pitchStore'
import { useDisplayStore } from '@/stores/displayStore'

const pitchStore = usePitchStore()
const displayStore = useDisplayStore()

// ── Footer state ──────────────────────────────────────────────────────────────
const footerState = computed(() => displayStore.footerState)
const isCompact = computed(() => footerState.value === 'compact')
const isOpen = computed(() => footerState.value === 'open')

// ── Active pitch ──────────────────────────────────────────────────────────────
const activePitch = computed<Pitch | null>(
  () => pitchStore.selectedTitle as Pitch | null,
)
const hasActivePitch = computed(() => !!activePitch.value)
const activePitchTitle = computed(
  () => activePitch.value?.title ?? 'Pick a pitch',
)

// ── Pitch list ────────────────────────────────────────────────────────────────
const searchQuery = ref('')

const filteredPitches = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  const list = pitchStore.pitches
  if (!q) return list
  return list.filter(
    (p) =>
      p.title?.toLowerCase().includes(q) ||
      p.pitch?.toLowerCase().includes(q) ||
      p.description?.toLowerCase().includes(q),
  )
})

function selectPitch(pitchId: number) {
  pitchStore.setSelectedTitle(pitchId)
  pitchStore.setSelectedPitch(pitchId)
  syncLocalExamples()
}

// Cycle through available pitches (useful in compact mode)
function cycleSelectedPitch() {
  const list = pitchStore.pitches
  if (!list.length) return
  const currentId = activePitch.value?.id ?? -1
  const idx = list.findIndex((p) => p.id === currentId)
  const next = list[(idx + 1) % list.length]
  if (next) selectPitch(next.id)
}

// ── Examples ──────────────────────────────────────────────────────────────────
const localExamples = ref<string[]>([])
const savingExamples = ref(false)

const currentExamples = computed(() =>
  parseExamples(activePitch.value?.examples),
)
const exampleCount = computed(() => currentExamples.value.length)

function parseExamples(raw?: string | null): string[] {
  return (raw || '')
    .split('|')
    .map((s) => s.trim())
    .filter(Boolean)
}

function syncLocalExamples() {
  localExamples.value = parseExamples(activePitch.value?.examples)
  pitchStore.exampleString = localExamples.value.join(' | ')
}

function addBlankExample() {
  localExamples.value.push('')
}

function removeExample(index: number) {
  localExamples.value.splice(index, 1)
  if (!localExamples.value.length) localExamples.value.push('')
  flushExamples()
}

async function flushExamples() {
  if (!activePitch.value || savingExamples.value) return
  savingExamples.value = true
  const filtered = localExamples.value.filter((e) => e.trim())
  await pitchStore.updatePitchExamples(activePitch.value.id, filtered)
  pitchStore.exampleString = filtered.join(' | ')
  savingExamples.value = false
}

watch(activePitch, () => syncLocalExamples())

// ── Capture ───────────────────────────────────────────────────────────────────
const captureText = ref('')
const statusMessage = ref('')

async function saveCapture() {
  const text = captureText.value.trim()
  if (!text || !activePitch.value) return

  localExamples.value.push(text)
  await flushExamples()

  captureText.value = ''
  flash('✓ Example saved.')
}

function flash(msg: string, ms = 2500) {
  statusMessage.value = msg
  setTimeout(() => {
    statusMessage.value = ''
  }, ms)
}

// ── Randomize ─────────────────────────────────────────────────────────────────
const randomResult = ref('')

function randomize() {
  const examples = currentExamples.value
  if (!examples.length) return
  const pick = examples[Math.floor(Math.random() * examples.length)]
  randomResult.value = pick
  captureText.value = pick
}

// ── Generate ──────────────────────────────────────────────────────────────────
async function generate() {
  if (!activePitch.value) return
  pitchStore.exampleString = localExamples.value.filter(Boolean).join(' | ')
  await pitchStore.fetchBrainstormPitches()
}

// ── AI response handling ──────────────────────────────────────────────────────
const apiLines = computed(() =>
  (pitchStore.apiResponse || '')
    .split('\n')
    .map((line) => line.replace(/^[-*\d.)\s]+/, '').trim())
    .filter(Boolean),
)

function keepLine(line: string) {
  localExamples.value.push(line)
  flushExamples()
}

function keepAllLines() {
  apiLines.value.forEach((line) => localExamples.value.push(line))
  flushExamples()
}

function clearResponse() {
  pitchStore.apiResponse = ' '
}

// ── Init ──────────────────────────────────────────────────────────────────────
onMounted(async () => {
  await pitchStore.initialize()
  syncLocalExamples()
})
</script>

<style scoped>
.ex-list-enter-active,
.ex-list-leave-active {
  transition: all 0.15s ease;
}
.ex-list-enter-from,
.ex-list-leave-to {
  opacity: 0;
  transform: translateX(-4px);
}

.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.2s ease;
}
.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(4px);
}
</style>
