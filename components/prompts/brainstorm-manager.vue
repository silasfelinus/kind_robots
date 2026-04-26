<!-- /components/content/prompts/brainstorm-manager.vue -->
<!--
  Brainstorm Manager — synthesized from brainstorm-game, brainstorm-view, and two manager iterations.
  CreationSource enum (HUMAN | AI | HYBRID | UPLOAD | UNKNOWN) is now live in schema.
  Wire it: remove the `(pitch as any)` casts once `prisma generate` has been run.
-->
<template>
  <section
    class="flex h-full min-h-0 w-full flex-col overflow-hidden rounded-2xl border border-base-300 bg-base-200 p-3 text-base-content"
  >
    <!-- ════ HEADER ════ -->
    <header
      class="mb-3 flex shrink-0 flex-wrap items-center justify-between gap-2 rounded-2xl border border-base-300 bg-base-100 px-4 py-3"
    >
      <div class="flex flex-wrap items-center gap-2">
        <Icon name="mdi:brain" class="h-5 w-5 text-primary" />
        <h1 class="text-xl font-bold">Brainstorm Manager</h1>
        <span
          v-if="selectedPitch"
          class="badge badge-primary max-w-45 truncate"
        >
          {{ selectedPitch.title }}
        </span>
        <span class="badge badge-outline"
          >{{ filteredPitches.length }} pitches</span
        >
      </div>

      <!-- CreationSource selector inline in header -->
      <div class="flex items-center gap-2">
        <span class="text-xs opacity-50">source:</span>
        <button
          v-for="src in creationSources"
          :key="src"
          type="button"
          class="btn btn-xs"
          :class="
            creationSource === src
              ? sourceBtnClass(src)
              : 'btn-ghost opacity-40'
          "
          @click="creationSource = src"
        >
          {{ src }}
        </button>
      </div>
    </header>

    <!-- ════ THREE-COLUMN GRID ════ -->
    <div
      class="grid min-h-0 flex-1 grid-cols-1 gap-3 overflow-hidden xl:grid-cols-[300px_1fr_300px]"
    >
      <!-- ── LEFT: Pitch Browser ── -->
      <aside
        class="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-base-300 bg-base-100"
      >
        <div class="shrink-0 space-y-2 border-b border-base-300 p-3">
          <input
            v-model="searchQuery"
            class="input input-sm input-bordered w-full rounded-2xl"
            placeholder="Search pitches…"
          />
          <select
            v-model="selectedType"
            class="select select-sm select-bordered w-full rounded-2xl"
          >
            <option value="">All types</option>
            <option
              v-for="type in pitchStore.pitchTypes"
              :key="type"
              :value="type"
            >
              {{ type }}
            </option>
          </select>
          <button
            type="button"
            class="btn btn-sm btn-secondary w-full rounded-2xl"
            @click="startFreshPitch"
          >
            <Icon name="mdi:plus" class="h-4 w-4" />
            New Pitch
          </button>
        </div>

        <div class="min-h-0 flex-1 space-y-1.5 overflow-y-auto p-3">
          <button
            v-for="pitch in filteredPitches"
            :key="pitch.id"
            type="button"
            class="w-full rounded-2xl border p-3 text-left transition hover:border-primary hover:bg-base-200"
            :class="
              selectedPitch?.id === pitch.id
                ? 'border-primary bg-primary/10'
                : 'border-base-300 bg-base-100'
            "
            @click="selectPitch(pitch.id)"
          >
            <div class="flex items-start justify-between gap-2">
              <h2 class="line-clamp-1 text-sm font-bold">
                {{ pitch.title || 'Untitled' }}
              </h2>
              <span class="badge badge-xs shrink-0">{{ pitch.PitchType }}</span>
            </div>
            <p class="mt-0.5 line-clamp-2 text-xs opacity-70">
              {{ pitch.pitch }}
            </p>
            <div class="mt-1.5 flex flex-wrap gap-1">
              <span :class="sourceBadgeClass(getPitchSource(pitch))">
                {{ getPitchSource(pitch) }}
              </span>
              <span v-if="pitch.isPublic" class="badge badge-success badge-xs"
                >public</span
              >
              <span v-else class="badge badge-warning badge-xs">private</span>
            </div>
          </button>
        </div>
      </aside>

      <!-- ── CENTER: Editor ── -->
      <main
        class="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-base-300 bg-base-100"
      >
        <!-- Title / Type row -->
        <div class="shrink-0 border-b border-base-300 p-3">
          <div class="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_180px]">
            <input
              v-model="pitchForm.title"
              class="input input-bordered rounded-2xl text-base font-bold"
              placeholder="Vanderbuilt Lacrosse"
            />
            <select
              v-model="pitchForm.PitchType"
              class="select select-bordered rounded-2xl"
            >
              <option
                v-for="type in pitchStore.pitchTypes"
                :key="type"
                :value="type"
              >
                {{ type }}
              </option>
            </select>
          </div>
        </div>

        <!-- Scrollable editor body -->
        <div class="min-h-0 flex-1 space-y-3 overflow-y-auto p-3">
          <!-- Core fields -->
          <div class="grid grid-cols-1 gap-3 lg:grid-cols-2">
            <label class="form-control">
              <div class="label py-1">
                <span class="label-text font-semibold">Core pitch</span>
              </div>
              <textarea
                v-model="pitchForm.pitch"
                class="textarea textarea-bordered min-h-28 rounded-2xl"
                placeholder="A wildly specific idea worth expanding…"
              />
            </label>
            <label class="form-control">
              <div class="label py-1">
                <span class="label-text font-semibold"
                  >Generator instructions</span
                >
              </div>
              <textarea
                v-model="pitchForm.description"
                class="textarea textarea-bordered min-h-28 rounded-2xl"
                placeholder="Tone, rules, vibe, crimes against comedy to avoid…"
              />
            </label>
          </div>

          <div class="grid grid-cols-1 gap-3 lg:grid-cols-2">
            <label class="form-control">
              <div class="label py-1">
                <span class="label-text font-semibold">Image prompt</span>
              </div>
              <textarea
                v-model="pitchForm.imagePrompt"
                class="textarea textarea-bordered min-h-20 rounded-2xl"
                placeholder="Optional art prompt…"
              />
            </label>
            <label class="form-control">
              <div class="label py-1">
                <span class="label-text font-semibold">Flavor text</span>
              </div>
              <textarea
                v-model="pitchForm.flavorText"
                class="textarea textarea-bordered min-h-20 rounded-2xl"
                placeholder="A little card sparkle…"
              />
            </label>
          </div>

          <!-- Examples section -->
          <section class="rounded-2xl border border-base-300 bg-base-200 p-3">
            <div class="mb-2 flex flex-wrap items-center justify-between gap-2">
              <h2 class="font-bold">
                Example lines
                <span class="badge badge-neutral badge-sm ml-1">{{
                  examples.length
                }}</span>
              </h2>
              <button
                type="button"
                class="btn btn-xs btn-outline rounded-2xl"
                @click="addExample"
              >
                <Icon name="mdi:plus" class="h-3 w-3" />
                Add
              </button>
            </div>

            <transition-group name="example-list" tag="div" class="space-y-1.5">
              <div
                v-for="(_, index) in examples"
                :key="`ex-${index}`"
                class="group grid grid-cols-[auto_1fr_auto] items-center gap-2"
              >
                <span class="w-5 text-right font-mono text-xs opacity-30">{{
                  index + 1
                }}</span>
                <input
                  v-model="examples[index]"
                  class="input input-sm input-bordered rounded-xl font-mono text-xs"
                  :placeholder="`Example ${index + 1}`"
                />
                <button
                  type="button"
                  class="btn btn-xs btn-square btn-ghost rounded-xl text-error opacity-0 transition-opacity group-hover:opacity-100"
                  @click="removeExample(index)"
                >
                  <Icon name="mdi:close" class="h-3 w-3" />
                </button>
              </div>
            </transition-group>

            <p
              v-if="!examples.length"
              class="py-3 text-center text-xs italic opacity-40"
            >
              No examples yet — add one above.
            </p>
          </section>

          <!-- AI Candidates -->
          <Transition name="fade-slide">
            <section
              v-if="apiLines.length"
              class="rounded-2xl border border-info bg-info/10 p-3"
            >
              <div
                class="mb-2 flex flex-wrap items-center justify-between gap-2"
              >
                <h2 class="font-bold text-info">
                  <Icon name="mdi:brain" class="mr-1 inline h-4 w-4" />
                  AI candidates
                  <span class="badge badge-info badge-sm ml-1">{{
                    apiLines.length
                  }}</span>
                </h2>
                <button
                  type="button"
                  class="btn btn-xs btn-info rounded-2xl"
                  @click="acceptAllLines"
                >
                  Accept all
                </button>
              </div>
              <div class="space-y-1.5">
                <div
                  v-for="(line, index) in apiLines"
                  :key="`ai-${index}`"
                  class="grid grid-cols-[1fr_auto] gap-2 rounded-xl border border-base-300 bg-base-100 p-2"
                >
                  <p class="text-sm">{{ line }}</p>
                  <button
                    type="button"
                    class="btn btn-xs btn-primary rounded-xl"
                    @click="acceptLine(line)"
                  >
                    Keep
                  </button>
                </div>
              </div>
            </section>
          </Transition>
        </div>
      </main>

      <!-- ── RIGHT: Image + Controls ── -->
      <aside
        class="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-base-300 bg-base-100"
      >
        <!-- Brainstorm image — full-width, top of panel, prominent hero -->
        <div class="shrink-0 overflow-hidden rounded-t-2xl">
          <brainstorm-image class="w-full" />
        </div>

        <!-- Generator controls -->
        <div class="min-h-0 flex-1 space-y-3 overflow-y-auto p-3">
          <p class="text-xs font-semibold uppercase tracking-wider opacity-50">
            Generator
          </p>

          <label class="form-control">
            <div class="label py-0.5">
              <span class="label-text text-xs">Requests</span>
            </div>
            <input
              v-model.number="pitchStore.numberOfRequests"
              type="number"
              min="1"
              max="10"
              class="input input-sm input-bordered rounded-2xl"
            />
          </label>

          <label class="form-control">
            <div class="label py-0.5">
              <span class="label-text text-xs">Temperature</span>
              <span class="label-text-alt font-mono font-bold">
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
              class="input input-sm input-bordered rounded-2xl"
            />
          </label>

          <div class="grid grid-cols-2 gap-2">
            <label
              class="label cursor-pointer justify-start gap-2 rounded-2xl border border-base-300 bg-base-200 px-3 py-2"
            >
              <input
                v-model="pitchForm.isPublic"
                type="checkbox"
                class="checkbox checkbox-primary checkbox-sm"
              />
              <span class="label-text text-sm">Public</span>
            </label>
            <label
              class="label cursor-pointer justify-start gap-2 rounded-2xl border border-base-300 bg-base-200 px-3 py-2"
            >
              <input
                v-model="pitchForm.isMature"
                type="checkbox"
                class="checkbox checkbox-warning checkbox-sm"
              />
              <span class="label-text text-sm">Mature</span>
            </label>
          </div>

          <div class="divider my-0" />

          <button
            type="button"
            class="btn btn-info w-full rounded-2xl"
            :disabled="pitchStore.loading || !canGenerate"
            @click="generateBrainstorm"
          >
            <span
              v-if="pitchStore.loading"
              class="loading loading-spinner loading-sm"
            />
            <Icon v-else name="mdi:brain" class="h-4 w-4" />
            {{ pitchStore.loading ? 'Generating…' : 'Generate lines' }}
          </button>

          <button
            type="button"
            class="btn btn-primary w-full rounded-2xl"
            :disabled="isSaving || !canSave"
            @click="savePitch"
          >
            <span v-if="isSaving" class="loading loading-spinner loading-sm" />
            <Icon v-else name="mdi:content-save" class="h-4 w-4" />
            {{ selectedPitch ? 'Update pitch' : 'Create pitch' }}
          </button>

          <button
            v-if="selectedPitch"
            type="button"
            class="btn btn-error btn-outline w-full rounded-2xl"
            :disabled="isSaving"
            @click="deleteSelectedPitch"
          >
            <Icon name="mdi:trash-can-outline" class="h-4 w-4" />
            Delete pitch
          </button>

          <Transition name="fade-slide">
            <div
              v-if="statusMessage"
              class="rounded-2xl border border-base-300 bg-base-200 p-3 text-sm"
            >
              {{ statusMessage }}
            </div>
          </Transition>
        </div>
      </aside>
    </div>
  </section>
</template>

<script setup lang="ts">
// /components/content/prompts/brainstorm-manager.vue
import { computed, onMounted, reactive, ref, watch } from 'vue'
import type { Pitch } from '~/prisma/generated/prisma/client'
import { usePitchStore, PitchType } from '@/stores/pitchStore'
import { useUserStore } from '@/stores/userStore'

// ── Types ──────────────────────────────────────────────────────────────────────
// CreationSource matches the new Prisma enum.
// TODO: Once `prisma generate` has run, import CreationSource from the generated
// client and replace this string union with that enum type.
type CreationSourceType = 'HUMAN' | 'AI' | 'HYBRID' | 'UPLOAD' | 'UNKNOWN'
const creationSources: CreationSourceType[] = [
  'HUMAN',
  'AI',
  'HYBRID',
  'UPLOAD',
  'UNKNOWN',
]

// ── Stores ─────────────────────────────────────────────────────────────────────
const pitchStore = usePitchStore()
const userStore = useUserStore()

// ── UI state ──────────────────────────────────────────────────────────────────
const searchQuery = ref('')
const selectedType = ref<string>('')
const creationSource = ref<CreationSourceType>('HUMAN')
const examples = ref<string[]>(defaultExamples())
const isSaving = ref(false)
const statusMessage = ref('')

// ── Pitch form ────────────────────────────────────────────────────────────────
const pitchForm = reactive<Partial<Pitch>>({
  title: 'Vanderbuilt Lacrosse',
  pitch:
    'Vanderbuilt Lacrosse is an absurdly wealthy person completely disconnected from reality and normal human experience.',
  description:
    "Create short one-liner humor bits describing Vanderbuilt Lacrosse's life. Keep them punchy, specific, surreal, and easy to edit.",
  flavorText: '',
  imagePrompt: '',
  PitchType: PitchType.TITLE,
  isPublic: true,
  isMature: false,
})

// ── Computed ──────────────────────────────────────────────────────────────────
const selectedPitch = computed(() => pitchStore.selectedPitch as Pitch | null)

const filteredPitches = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  return pitchStore.pitches.filter((pitch) => {
    const matchesType = selectedType.value
      ? pitch.PitchType === selectedType.value
      : true
    if (!matchesType) return false
    if (!query) return true
    const hay = [
      pitch.title,
      pitch.pitch,
      pitch.description,
      pitch.examples,
      pitch.flavorText,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
    return hay.includes(query)
  })
})

// Parse LLM response into individual lines, stripping markdown bullet prefixes.
const apiLines = computed(() =>
  (pitchStore.apiResponse || '')
    .split('\n')
    .map((line) => line.replace(/^[-*\d.)\s]+/, '').trim())
    .filter(Boolean),
)

const canSave = computed(() =>
  Boolean(pitchForm.pitch?.trim() && pitchForm.title?.trim()),
)

const canGenerate = computed(() =>
  Boolean(pitchForm.title?.trim() && pitchForm.pitch?.trim()),
)

// ── Sync selected pitch → form ────────────────────────────────────────────────
watch(
  selectedPitch,
  (pitch) => {
    if (!pitch) return
    pitchForm.title = pitch.title ?? ''
    pitchForm.pitch = pitch.pitch ?? ''
    pitchForm.description = pitch.description ?? ''
    pitchForm.flavorText = pitch.flavorText ?? ''
    pitchForm.imagePrompt = pitch.imagePrompt ?? ''
    pitchForm.PitchType = pitch.PitchType
    pitchForm.isPublic = pitch.isPublic
    pitchForm.isMature = pitch.isMature
    // TODO: remove `as any` once prisma generate has run with the new enum
    creationSource.value = (pitch as any).creationSource ?? 'UNKNOWN'
    examples.value = splitExamples(pitch.examples)
  },
  { immediate: true },
)

// ── Init ──────────────────────────────────────────────────────────────────────
onMounted(async () => {
  await pitchStore.initialize()
})

// ── Pitch list actions ────────────────────────────────────────────────────────
function selectPitch(pitchId: number) {
  pitchStore.setSelectedPitch(pitchId)
  pitchStore.setSelectedTitle(pitchId)
}

function startFreshPitch() {
  pitchStore.selectedPitch = null
  Object.assign(pitchForm, {
    title: 'Vanderbuilt Lacrosse',
    pitch:
      'Vanderbuilt Lacrosse is an absurdly wealthy person completely disconnected from reality and normal human experience.',
    description:
      "Create short one-liner humor bits describing Vanderbuilt Lacrosse's life.",
    flavorText: '',
    imagePrompt: '',
    PitchType: PitchType.TITLE,
    isPublic: true,
    isMature: false,
  })
  creationSource.value = 'HUMAN'
  examples.value = defaultExamples()
  pitchStore.apiResponse = ' '
  statusMessage.value = ''
}

// ── Example line actions ──────────────────────────────────────────────────────
function addExample() {
  examples.value.push('')
}

function removeExample(index: number) {
  examples.value.splice(index, 1)
  if (!examples.value.length) examples.value.push('')
}

function acceptLine(line: string) {
  examples.value.push(line)
  // A human-authored pitch that absorbs AI candidates becomes hybrid.
  if (creationSource.value === 'HUMAN') creationSource.value = 'HYBRID'
}

function acceptAllLines() {
  apiLines.value.forEach(acceptLine)
}

// ── Generate ──────────────────────────────────────────────────────────────────
async function generateBrainstorm() {
  if (!canGenerate.value) return

  // Build a Pitch-shaped context object for fetchBrainstormPitches,
  // which reads from pitchStore.selectedTitle + pitchStore.exampleString.
  pitchStore.selectedTitle = {
    ...(selectedPitch.value ?? {}),
    id: selectedPitch.value?.id ?? 0,
    title: pitchForm.title ?? '',
    pitch: pitchForm.pitch ?? '',
    description: pitchForm.description ?? '',
    examples: joinExamples(examples.value),
    PitchType: pitchForm.PitchType ?? PitchType.TITLE,
    createdAt: new Date(),
    updatedAt: new Date(),
    isPublic: pitchForm.isPublic ?? true,
    isMature: pitchForm.isMature ?? false,
    userId: userStore.userId,
  } as Pitch

  pitchStore.exampleString = joinExamples(examples.value)
  await pitchStore.fetchBrainstormPitches()

  if ((pitchStore.apiResponse || '').trim()) {
    if (creationSource.value === 'HUMAN') creationSource.value = 'HYBRID'
  }
}

// ── Save / Update / Delete ────────────────────────────────────────────────────
async function savePitch() {
  if (!canSave.value) return
  isSaving.value = true
  statusMessage.value = ''

  const payload = {
    title: pitchForm.title?.trim(),
    pitch: pitchForm.pitch?.trim(),
    description: pitchForm.description?.trim() || undefined,
    flavorText: pitchForm.flavorText?.trim() || undefined,
    imagePrompt: pitchForm.imagePrompt?.trim() || undefined,
    PitchType: pitchForm.PitchType ?? PitchType.TITLE,
    isPublic: pitchForm.isPublic ?? true,
    isMature: pitchForm.isMature ?? false,
    userId: userStore.userId,
    examples: joinExamples(examples.value) || undefined,
    creationSource: creationSource.value,
  } as Partial<Pitch>

  const result = selectedPitch.value
    ? await pitchStore.updatePitch(selectedPitch.value.id, payload)
    : await pitchStore.createPitch(payload)

  if (result.success) {
    statusMessage.value = selectedPitch.value
      ? '✓ Pitch updated.'
      : '✓ Pitch created.'
    await pitchStore.fetchPitches(true)
    if (!selectedPitch.value && 'data' in result && result.data?.id) {
      pitchStore.setSelectedPitch(result.data.id)
    }
  } else {
    statusMessage.value = (result as any).message || '✗ Save failed.'
  }

  isSaving.value = false
  setTimeout(() => {
    statusMessage.value = ''
  }, 3000)
}

async function deleteSelectedPitch() {
  if (!selectedPitch.value) return
  isSaving.value = true
  const result = await pitchStore.deletePitch(selectedPitch.value.id)
  statusMessage.value = result.message
  if (result.success) startFreshPitch()
  isSaving.value = false
}

// ── Utilities ─────────────────────────────────────────────────────────────────
function splitExamples(value?: string | null): string[] {
  const parsed = (value || '')
    .split('|')
    .map((s) => s.trim())
    .filter(Boolean)
  return parsed.length ? parsed : defaultExamples()
}

function joinExamples(arr: string[]): string {
  return arr
    .map((s) => s.trim())
    .filter(Boolean)
    .join(' | ')
}

function defaultExamples(): string[] {
  return [
    'Vanderbuilt Lacrosse got back 2 million dollars on his last income tax.',
    'Vanderbuilt Lacrosse owns three planets.',
    'Vanderbuilt Lacrosse has personally killed 12 dinosaurs.',
    "When Vanderbuilt Lacrosse's money gets dirty, he throws it away.",
  ]
}

function getPitchSource(pitch: Pitch): CreationSourceType {
  // TODO: remove `as any` once prisma generate has been run
  return (pitch as any).creationSource ?? 'UNKNOWN'
}

function sourceBadgeClass(source: CreationSourceType): string {
  return (
    {
      HUMAN: 'badge badge-success badge-xs',
      AI: 'badge badge-info badge-xs',
      HYBRID: 'badge badge-warning badge-xs',
      UPLOAD: 'badge badge-secondary badge-xs',
      UNKNOWN: 'badge badge-ghost badge-xs',
    }[source] ?? 'badge badge-ghost badge-xs'
  )
}

function sourceBtnClass(source: CreationSourceType): string {
  return (
    {
      HUMAN: 'btn-success',
      AI: 'btn-info',
      HYBRID: 'btn-warning',
      UPLOAD: 'btn-secondary',
      UNKNOWN: 'btn-ghost',
    }[source] ?? 'btn-ghost'
  )
}
</script>

<style scoped>
.example-list-enter-active,
.example-list-leave-active {
  transition: all 0.15s ease;
}
.example-list-enter-from,
.example-list-leave-to {
  opacity: 0;
  transform: translateX(-6px);
}

.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.2s ease;
}
.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(6px);
}
</style>
