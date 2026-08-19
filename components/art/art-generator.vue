<!-- /components/art/art-generator.vue -->
<template>
  <section class="min-h-full w-full">
    <div class="kr-container flex min-h-full flex-col gap-3 p-2 sm:p-4">
      <!-- ── Header: identity, one status line, one Generate ──────────── -->
      <header class="kr-panel-flat p-4">
        <div
          class="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between"
        >
          <div class="flex min-w-0 items-start gap-3">
            <span
              class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/15"
            >
              <Icon name="kind-icon:paintbrush" class="h-6 w-6 text-primary" />
            </span>
            <div class="min-w-0">
              <h1 class="text-2xl font-black text-primary">Image Generator</h1>
              <p class="mt-0.5 text-sm text-base-content/60">
                Recipe → prompt → pixels. Everything here renders on ComfyUI.
              </p>
            </div>
          </div>

          <div class="flex w-full shrink-0 flex-col gap-2 lg:w-80">
            <button
              type="button"
              class="btn btn-primary min-h-12 w-full rounded-2xl text-base font-black"
              :class="canGenerate ? 'shadow-lg shadow-primary/25' : ''"
              :disabled="!canGenerate"
              @click="handleGenerate"
            >
              <span
                v-if="artStore.isGenerating"
                class="flex items-center gap-2"
              >
                <span class="loading loading-dots loading-sm" />
                {{ busyLabel }}
              </span>
              <span v-else class="flex items-center gap-2">
                <Icon name="kind-icon:sparkles" class="h-5 w-5" />
                {{ canAfford ? 'Generate Image' : 'Out of mana, top up' }}
              </span>
            </button>

            <p class="text-center text-xs text-base-content/50">
              {{ readinessSummary }}
            </p>
          </div>
        </div>

        <div
          v-if="artStore.generationMessage"
          class="mt-3 flex items-start gap-2 rounded-2xl border p-3 text-sm font-semibold"
          :class="
            artStore.generationMessageTone === 'error'
              ? 'kr-note-error'
              : 'kr-note-success'
          "
          role="status"
        >
          <Icon
            :name="
              artStore.generationMessageTone === 'error'
                ? 'kind-icon:alert'
                : 'kind-icon:check'
            "
            class="mt-0.5 h-4 w-4 shrink-0"
          />
          {{ artStore.generationMessage }}
        </div>
      </header>

      <!-- ── The single maturity control for this whole surface ───────── -->
      <maturity-toggle
        variant="resource"
        label="Mature content"
        visible-text="Mature checkpoints, LoRAs, and Facets are available below."
        hidden-text="Mature checkpoints, LoRAs, and Facets are hidden below."
      />

      <div
        class="grid grid-cols-[repeat(auto-fit,minmax(min(100%,26rem),1fr))] gap-3"
      >
        <!-- ── Left column: recipe, prompt, facets ────────────────────── -->
        <div class="flex min-w-0 flex-col gap-3">
          <section class="kr-panel-flat p-4">
            <div class="flex flex-wrap items-start justify-between gap-2">
              <div class="min-w-0">
                <h2
                  class="flex items-center gap-2 text-base font-bold text-primary"
                >
                  <Icon name="kind-icon:settings" class="h-4 w-4" />
                  Recipe
                </h2>
                <p class="mt-0.5 text-xs text-base-content/55">
                  Picks the Comfy lane and its known-good numbers.
                </p>
              </div>
              <button
                v-if="hasDrifted"
                type="button"
                class="btn btn-ghost btn-xs rounded-xl"
                @click="applyPreset(presetId)"
              >
                Reset to {{ activePreset.label }}
              </button>
            </div>

            <div class="mt-3 flex flex-wrap gap-2">
              <button
                v-for="preset in presets"
                :key="preset.id"
                type="button"
                class="btn btn-sm rounded-xl"
                :class="preset.id === presetId ? 'btn-primary' : 'btn-outline'"
                :aria-pressed="preset.id === presetId"
                :title="preset.blurb"
                :disabled="artStore.isGenerating"
                @click="applyPreset(preset.id)"
              >
                {{ preset.label }}
              </button>
            </div>

            <p class="mt-3 text-xs text-base-content/60">
              <span class="font-semibold">{{ activeProfile.label }}</span>
              — {{ activeProfile.blurb }}
            </p>

            <p
              v-if="hasDrifted"
              class="mt-2 text-xs font-semibold text-warning"
            >
              Settings edited — rendering with your values, not
              {{ activePreset.label }}'s.
            </p>

            <p
              v-if="engineWarning"
              class="mt-2 text-xs font-semibold text-error"
              role="alert"
            >
              {{ engineWarning }}
            </p>
          </section>

          <section class="kr-panel-flat p-4">
            <label class="form-control">
              <span class="label">
                <span
                  class="label-text flex items-center gap-1.5 text-base font-bold text-primary"
                >
                  <Icon name="kind-icon:prompt" class="h-4 w-4" />
                  Prompt
                </span>
                <button
                  type="button"
                  class="btn btn-ghost btn-xs rounded-xl"
                  :disabled="artStore.isGenerating"
                  @click="clearPrompt"
                >
                  Clear
                </button>
              </span>
              <textarea
                v-model="promptStore.promptField"
                class="textarea textarea-bordered min-h-36 resize-none rounded-2xl bg-base-200 text-base leading-relaxed"
                placeholder="A clockwork fox knight guarding a neon greenhouse, cinematic lighting, richly detailed…"
                :disabled="artStore.isGenerating"
              />
            </label>

            <label
              v-if="activeProfile.supports.negativePrompt"
              class="form-control mt-2"
            >
              <span class="label">
                <span class="label-text font-bold text-base-content/70">
                  Negative prompt
                </span>
              </span>
              <textarea
                v-model="negativePrompt"
                class="textarea textarea-bordered min-h-20 resize-none rounded-2xl bg-base-200 text-sm"
                placeholder="blurry, low quality, bad hands, watermark, text…"
                :disabled="artStore.isGenerating"
              />
            </label>

            <div class="mt-3 flex flex-wrap items-center gap-2">
              <span class="text-xs font-bold text-base-content/55">
                🎲 Prompt seasoning
              </span>
              <button
                type="button"
                class="btn btn-secondary btn-xs rounded-xl"
                :disabled="artStore.isGenerating"
                @click="randomStore.applyMakePretty()"
              >
                Make pretty
              </button>
              <button
                type="button"
                class="btn btn-accent btn-xs rounded-xl"
                :disabled="artStore.isGenerating"
                @click="randomStore.applySurprise()"
              >
                Surprise me
              </button>
              <button
                type="button"
                class="btn btn-ghost btn-xs rounded-xl"
                :disabled="artStore.isGenerating"
                @click="randomStore.resetAll()"
              >
                Reset rolls
              </button>
            </div>

            <div v-if="activeRolls.length" class="mt-2 flex flex-wrap gap-1.5">
              <button
                v-for="roll in activeRolls"
                :key="roll.key"
                type="button"
                class="badge badge-outline h-auto min-h-6 gap-1 rounded-xl py-1"
                :title="`Remove ${roll.label}`"
                @click="randomStore.clearSelection(roll.key)"
              >
                {{ roll.label }} → {{ roll.value }}
                <span class="opacity-60">×</span>
              </button>
            </div>
          </section>

          <!-- The ONE facet surface. Selection is canonical Facet ids, which
               ride to the ArtJob and onto the finished ArtImage. -->
          <art-facet-selector v-model="facetIds" label="Creative Facets" />
        </div>

        <!-- ── Right column: model, settings, destination ─────────────── -->
        <div class="flex min-w-0 flex-col gap-3">
          <section class="kr-panel-flat p-4">
            <h2
              class="flex items-center gap-2 text-base font-bold text-primary"
            >
              <Icon name="kind-icon:checkpoint" class="h-4 w-4" />
              Model
            </h2>

            <template v-if="activeProfile.supports.checkpoint">
              <label class="form-control mt-2">
                <span class="label py-1">
                  <span class="label-text font-bold">Checkpoint</span>
                  <span class="label-text-alt text-base-content/50">
                    {{ checkpointFamilyLabel }}
                  </span>
                </span>
                <select
                  v-model="checkpointName"
                  class="select select-bordered w-full rounded-2xl bg-base-200"
                  :disabled="artStore.isGenerating"
                >
                  <option value="" disabled>Select checkpoint…</option>
                  <option
                    v-for="checkpoint in checkpointOptions"
                    :key="checkpoint.name || checkpoint.id"
                    :value="String(checkpoint.name || '').trim()"
                  >
                    {{ checkpointLabel(checkpoint) }}
                  </option>
                </select>
              </label>

              <p
                v-if="checkpointPresetMismatch"
                class="mt-2 flex flex-wrap items-center gap-2 text-xs text-base-content/60"
              >
                This checkpoint usually wants
                <button
                  type="button"
                  class="btn btn-outline btn-xs rounded-xl"
                  @click="applyPreset(recommendedPreset.id)"
                >
                  {{ recommendedPreset.label }}
                </button>
              </p>
            </template>

            <p v-else class="mt-2 text-xs text-base-content/60">
              {{ activeProfile.label }} loads its own model, so there is no
              checkpoint to choose. Pick an
              <span class="font-semibold">SDXL checkpoint</span> recipe to
              render a checkpoint of your own.
            </p>
          </section>

          <art-lora-picker
            v-model="loraResourceId"
            v-model:strength="loraStrength"
            :engine="activePreset.engine"
          />

          <section class="kr-panel-flat p-4">
            <h2
              class="flex items-center gap-2 text-base font-bold text-primary"
            >
              <Icon name="kind-icon:settings" class="h-4 w-4" />
              Settings
            </h2>

            <div
              class="mt-3 grid grid-cols-[repeat(auto-fit,minmax(min(100%,8rem),1fr))] gap-3"
            >
              <label class="form-control">
                <span class="label py-1">
                  <span class="label-text font-bold">Steps</span>
                </span>
                <input
                  v-model.number="steps"
                  class="input input-bordered rounded-2xl bg-base-100"
                  type="number"
                  min="1"
                  max="150"
                  :disabled="artStore.isGenerating"
                />
              </label>

              <label class="form-control">
                <span class="label py-1">
                  <span class="label-text font-bold">
                    {{ activeProfile.supports.guidance ? 'Guidance' : 'CFG' }}
                  </span>
                </span>
                <input
                  v-if="activeProfile.supports.guidance"
                  v-model.number="guidance"
                  class="input input-bordered rounded-2xl bg-base-100"
                  type="number"
                  min="0"
                  max="30"
                  step="0.1"
                  :disabled="artStore.isGenerating"
                />
                <input
                  v-else
                  v-model.number="cfg"
                  class="input input-bordered rounded-2xl bg-base-100"
                  type="number"
                  min="1"
                  max="30"
                  step="0.1"
                  :disabled="artStore.isGenerating"
                />
              </label>

              <label v-if="activeProfile.supports.sampler" class="form-control">
                <span class="label py-1">
                  <span class="label-text font-bold">Sampler</span>
                </span>
                <select
                  v-model="sampler"
                  class="select select-bordered rounded-2xl bg-base-100"
                  :disabled="artStore.isGenerating"
                >
                  <option
                    v-for="option in samplerOptions"
                    :key="option"
                    :value="option"
                  >
                    {{ option }}
                  </option>
                </select>
              </label>

              <label
                v-if="activeProfile.supports.scheduler"
                class="form-control"
              >
                <span class="label py-1">
                  <span class="label-text font-bold">Scheduler</span>
                </span>
                <select
                  v-model="scheduler"
                  class="select select-bordered rounded-2xl bg-base-100"
                  :disabled="artStore.isGenerating"
                >
                  <option
                    v-for="option in SCHEDULER_OPTIONS"
                    :key="option"
                    :value="option"
                  >
                    {{ option }}
                  </option>
                </select>
              </label>

              <template v-if="activeProfile.supports.size">
                <label class="form-control">
                  <span class="label py-1">
                    <span class="label-text font-bold">Width</span>
                  </span>
                  <input
                    v-model.number="width"
                    class="input input-bordered rounded-2xl bg-base-100"
                    type="number"
                    min="256"
                    max="2048"
                    step="64"
                    :disabled="artStore.isGenerating"
                  />
                </label>
                <label class="form-control">
                  <span class="label py-1">
                    <span class="label-text font-bold">Height</span>
                  </span>
                  <input
                    v-model.number="height"
                    class="input input-bordered rounded-2xl bg-base-100"
                    type="number"
                    min="256"
                    max="2048"
                    step="64"
                    :disabled="artStore.isGenerating"
                  />
                </label>
              </template>

              <label class="form-control col-span-full">
                <span class="label py-1">
                  <span class="label-text font-bold">Seed</span>
                  <span class="label-text-alt text-base-content/50">
                    blank = random
                  </span>
                </span>
                <input
                  v-model.number="seed"
                  class="input input-bordered rounded-2xl bg-base-100"
                  type="number"
                  placeholder="Random each run"
                  :disabled="artStore.isGenerating"
                />
              </label>
            </div>
          </section>

          <section class="kr-panel-flat p-4">
            <h2
              class="flex items-center gap-2 text-base font-bold text-primary"
            >
              <Icon name="kind-icon:server" class="h-4 w-4" />
              Destination
            </h2>

            <label class="form-control mt-2">
              <span class="label py-1">
                <span class="label-text font-bold">Comfy server</span>
              </span>
              <select
                v-model="serverChoice"
                class="select select-bordered w-full rounded-2xl bg-base-200"
                :disabled="artStore.isGenerating"
              >
                <option value="default">{{ defaultServerLabel }}</option>
                <option value="any">Whatever is available</option>
                <option
                  v-for="server in alternateServers"
                  :key="server.id"
                  :value="`server:${server.id}`"
                >
                  {{ serverLabel(server) }}
                </option>
              </select>
              <span class="label py-1">
                <span class="label-text-alt text-base-content/55">
                  {{ serverDetail }}
                </span>
              </span>
            </label>

            <label class="form-control mt-1">
              <span class="label py-1">
                <span class="label-text font-bold"
                  >Also save to collection</span
                >
              </span>
              <select
                v-model.number="collectionId"
                class="select select-bordered w-full rounded-2xl bg-base-200"
                :disabled="artStore.isGenerating"
              >
                <option :value="null">Generated images only</option>
                <option
                  v-for="collection in artStore.generationCollections"
                  :key="collection.id"
                  :value="collection.id"
                >
                  {{ collection.label || `Collection #${collection.id}` }}
                </option>
              </select>
            </label>

            <add-collection
              class="mt-2"
              :compact="true"
              :disabled="artStore.isGenerating"
              :show-flags="false"
              @created="handleCollectionSelected"
              @selected="handleCollectionSelected"
            />

            <!-- Publishing flags for the image this run produces. Distinct
                 from the maturity toggle at the top, which decides what the
                 pickers on this page are allowed to SHOW you. -->
            <content-visibility-controls
              v-model:is-mature="outputIsMature"
              v-model:is-public="outputIsPublic"
              class="mt-3"
              :disabled="artStore.isGenerating"
            />
          </section>
        </div>
      </div>

      <section class="kr-panel-flat p-4">
        <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div class="flex items-center gap-2">
            <Icon name="kind-icon:sparkles" class="h-5 w-5 text-primary" />
            <div>
              <h2 class="text-lg font-bold text-primary">Latest result</h2>
              <p class="text-sm text-base-content/55">
                Your newest render lands here.
              </p>
            </div>
          </div>
          <button
            type="button"
            class="btn btn-ghost btn-sm rounded-xl"
            @click="goToGallery"
          >
            <Icon name="kind-icon:gallery" class="h-4 w-4" />
            Gallery
          </button>
        </div>

        <image-card
          v-if="artStore.lastGeneratedArtImage"
          :art-image="artStore.lastGeneratedArtImage"
        />
        <div
          v-else
          class="flex min-h-40 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-base-300 bg-base-200/40 p-6 text-center"
        >
          <Icon name="kind-icon:image" class="h-8 w-8 text-base-content/25" />
          <p class="text-sm text-base-content/55">
            Nothing rendered yet this session.
          </p>
        </div>
      </section>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import type { Server } from '~/prisma/generated/prisma/client'
import type { ArtCollection } from '@/stores/helpers/collectionHelper'
import type { Resource } from '@/stores/resourceStore'
import { ErrorType, useErrorStore } from '@/stores/errorStore'
import { useArtFacetDraftStore } from '@/stores/artFacetDraftStore'
import { useArtStore, type GenerateArtData } from '@/stores/artStore'
import { useCheckpointStore } from '@/stores/checkpointStore'
import { useManaStore } from '@/stores/manaStore'
import { useNavStore } from '@/stores/navStore'
import { usePromptStore } from '@/stores/promptStore'
import { useRandomStore } from '@/stores/randomStore'
import { useResourceStore } from '@/stores/resourceStore'
import { useServerStore } from '@/stores/serverStore'
import { useUserStore } from '@/stores/userStore'
import {
  ART_GENERATOR_PRESETS,
  CHECKPOINT_FAMILY_LABELS,
  DEFAULT_ART_PRESET_ID,
  detectCheckpointFamily,
  engineProfile,
  getPreset,
  presetForCheckpoint,
  presetSettings,
} from '@/utils/artGeneratorPresets'

type ServerChoice = 'default' | 'any' | `server:${number}`

type CheckpointResource = Partial<Resource> & {
  id?: number
  name?: string | null
  customLabel?: string | null
  localPath?: string | null
  generation?: string | null
}

type GenerateOverrides = Partial<GenerateArtData> & {
  serverSelectionMode?: 'default' | 'any' | 'specific'
}

const SCHEDULER_OPTIONS = [
  'simple',
  'normal',
  'karras',
  'beta',
  'exponential',
  'sgm_uniform',
  'ddim_uniform',
]

// ComfyUI's sampler_name vocabulary. checkpointStore.allSamplers is the A1111
// spelling ("Euler a", "DPM++ 2M Karras"); every lane here is Comfy, so the
// picker offers Comfy names and stops sending A1111 strings a Comfy KSampler
// has to guess at.
const COMFY_SAMPLERS = [
  'euler',
  'euler_ancestral',
  'heun',
  'dpm_2',
  'dpm_2_ancestral',
  'lms',
  'dpm_fast',
  'dpm_adaptive',
  'dpmpp_2s_ancestral',
  'dpmpp_sde',
  'dpmpp_2m',
  'dpmpp_2m_sde',
  'dpmpp_3m_sde',
  'ddim',
  'uni_pc',
]

const artFacetDraft = useArtFacetDraftStore()
const artStore = useArtStore()
const checkpointStore = useCheckpointStore()
const errorStore = useErrorStore()
const manaStore = useManaStore()
const navStore = useNavStore()
const promptStore = usePromptStore()
const randomStore = useRandomStore()
const resourceStore = useResourceStore()
const serverStore = useServerStore()
const userStore = useUserStore()

const presets = ART_GENERATOR_PRESETS
const presetId = ref<string>(DEFAULT_ART_PRESET_ID)
const serverChoice = ref<ServerChoice>('default')

const activePreset = computed(() => getPreset(presetId.value))
const activeProfile = computed(() => engineProfile(activePreset.value.engine))

// ── artForm bindings ────────────────────────────────────────────────────────
// Every control writes straight into artStore.artForm, which is what
// buildGenerateArtData reads. There is no second copy of the settings to drift.

function formField<K extends keyof GenerateArtData>(
  key: K,
  fallback: GenerateArtData[K],
) {
  return computed<GenerateArtData[K]>({
    get: () => (artStore.artForm[key] ?? fallback) as GenerateArtData[K],
    set: (value) =>
      artStore.setArtForm({ [key]: value } as Partial<GenerateArtData>),
  })
}

const negativePrompt = formField('negativePrompt', '')
const steps = formField('steps', 8)
const cfg = formField('cfg', 1)
const guidance = formField('guidance', null)
const sampler = formField('sampler', 'euler')
const scheduler = formField('scheduler', 'simple')
const width = formField('width', 1024)
const height = formField('height', 1024)
// content-visibility-controls takes strict booleans, and artForm's flags are
// optional, so these two are spelled out rather than run through formField.
const outputIsMature = computed<boolean>({
  get: () => artStore.artForm.isMature ?? false,
  set: (value) => artStore.setArtForm({ isMature: value }),
})

const outputIsPublic = computed<boolean>({
  get: () => artStore.artForm.isPublic ?? true,
  set: (value) => artStore.setArtForm({ isPublic: value }),
})

const seed = computed<number | null>({
  get: () => artStore.artForm.seed ?? null,
  set: (value) =>
    artStore.setArtForm({
      seed: typeof value === 'number' && Number.isFinite(value) ? value : null,
    }),
})

const checkpointName = computed<string>({
  get: () => artStore.selectedCheckpointName,
  set: (name) => artStore.selectGenerationCheckpoint(name),
})

const collectionId = computed<number | null>({
  get: () => artStore.selectedGenerationCollectionId,
  set: (value) => artStore.selectGenerationCollection(value),
})

const facetIds = computed<number[]>({
  get: () => artFacetDraft.selectedIds,
  set: (ids) => artFacetDraft.setSelectedIds(ids),
})

// ── LoRA ────────────────────────────────────────────────────────────────────
// The picker speaks Resource ids; the enqueue route resolves an id to its
// localPath for the resource-aware lanes. The named-checkpoint lane is not
// resource-resolved, so loraName is written alongside the id and both travel.

const loraResourceId = computed<number | null>({
  get: () => artStore.artForm.loraResourceIds?.[0] ?? null,
  set: (resourceId) => {
    if (!resourceId) {
      artStore.setArtForm({
        loraResourceIds: null,
        loraName: null,
        loraStrength: null,
      })
      return
    }

    const resource = resourceStore.visibleLoras.find(
      (entry) => entry.id === resourceId,
    )

    artStore.setArtForm({
      loraResourceIds: [resourceId],
      loraName: resource?.localPath?.trim() || null,
      loraStrength: artStore.artForm.loraStrength ?? 1,
    })
  },
})

const loraStrength = computed<number>({
  get: () => artStore.artForm.loraStrength ?? 1,
  set: (value) => artStore.setArtForm({ loraStrength: value }),
})

// ── Checkpoints ─────────────────────────────────────────────────────────────

const checkpointOptions = computed<CheckpointResource[]>(() => {
  const checkpoints = checkpointStore.visibleCheckpoints
  if (!Array.isArray(checkpoints)) return []
  return (checkpoints as CheckpointResource[]).filter((checkpoint) =>
    Boolean(String(checkpoint.name || '').trim()),
  )
})

const selectedCheckpoint = computed<CheckpointResource | null>(() => {
  const name = checkpointName.value
  if (!name) return null
  return (
    checkpointOptions.value.find(
      (checkpoint) => String(checkpoint.name || '').trim() === name,
    ) ?? null
  )
})

const checkpointFamilyLabel = computed(() => {
  if (!selectedCheckpoint.value) return ''
  return CHECKPOINT_FAMILY_LABELS[
    detectCheckpointFamily(selectedCheckpoint.value)
  ]
})

const recommendedPreset = computed(() =>
  presetForCheckpoint(selectedCheckpoint.value),
)

const checkpointPresetMismatch = computed(() => {
  if (!activeProfile.value.supports.checkpoint) return false
  if (!selectedCheckpoint.value) return false
  return recommendedPreset.value.id !== presetId.value
})

const samplerOptions = computed(() => {
  const current = String(sampler.value || '').trim()
  return current && !COMFY_SAMPLERS.includes(current)
    ? [current, ...COMFY_SAMPLERS]
    : COMFY_SAMPLERS
})

// ── Preset drift ────────────────────────────────────────────────────────────

const hasDrifted = computed(() => {
  const settings = presetSettings(activePreset.value)
  const supports = activeProfile.value.supports

  if (Number(steps.value) !== settings.steps) return true
  if (supports.guidance) {
    if (Number(guidance.value ?? settings.guidance) !== settings.guidance) {
      return true
    }
  } else if (Number(cfg.value) !== settings.cfg) {
    return true
  }
  if (supports.sampler && sampler.value !== settings.sampler) return true
  if (supports.scheduler && scheduler.value !== settings.scheduler) return true
  if (supports.size) {
    if (Number(width.value) !== settings.width) return true
    if (Number(height.value) !== settings.height) return true
  }
  return false
})

function applyPreset(id: string): void {
  presetId.value = id
  const settings = presetSettings(getPreset(id))

  artStore.setArtForm({
    engine: settings.engine,
    steps: settings.steps,
    cfg: settings.cfg,
    sampler: settings.sampler ?? undefined,
    scheduler: settings.scheduler ?? undefined,
    width: settings.width,
    height: settings.height,
    guidance: settings.guidance,
    variant: settings.variant,
  })

  if (settings.sampler) checkpointStore.selectSamplerByName(settings.sampler)
}

// ── Servers: Comfy only ─────────────────────────────────────────────────────
// Silas, 2026-08-18: "use Comfy as the assumed base, no more switching to
// OpenAI images or others." OPENAI/A1111/ANTHROPIC rows stay in the database
// and stay reachable from their own surfaces; they are simply not offered here.

const comfyServers = computed<Server[]>(() => {
  const servers = Array.isArray(artStore.generationServers)
    ? (artStore.generationServers as Server[])
    : []
  return servers.filter((server) => server.serverType === 'COMFY')
})

const defaultServer = computed<Server | null>(() => {
  const active = serverStore.activeArtServer as Server | null
  return active && active.serverType === 'COMFY' ? active : null
})

const alternateServers = computed<Server[]>(() =>
  comfyServers.value.filter((server) => server.id !== defaultServer.value?.id),
)

const defaultServerLabel = computed(() =>
  defaultServer.value
    ? `Default: ${serverLabel(defaultServer.value)}`
    : 'Default Comfy server',
)

const specificServerId = computed<number | null>(() => {
  if (!serverChoice.value.startsWith('server:')) return null
  const id = Number(serverChoice.value.slice('server:'.length))
  return Number.isInteger(id) && id > 0 ? id : null
})

const specificServer = computed<Server | null>(() => {
  const id = specificServerId.value
  return id ? ((serverStore.getServerById(id) as Server | null) ?? null) : null
})

const serverDetail = computed(() => {
  if (serverChoice.value === 'any') {
    return 'The art store picks whichever compatible Comfy server is free.'
  }
  if (serverChoice.value === 'default') {
    return defaultServer.value
      ? 'Your preferred Comfy server. Change it in Server Connections.'
      : 'No preferred Comfy server saved — the queue will route this one.'
  }
  return 'Used for this generation only.'
})

// ── Mana and readiness ──────────────────────────────────────────────────────

const billingServer = computed<Server | null>(() => {
  if (serverChoice.value.startsWith('server:')) return specificServer.value
  return (
    defaultServer.value || (artStore.activeGenerationServer as Server | null)
  )
})

const usesOwnServer = computed(() => {
  const server = billingServer.value
  if (!server || !server.isActive) return false
  if (server.userId && server.userId === userStore.userId) return true
  return Boolean(server.isPublic && !server.isOfficial)
})

const canAfford = computed(() => {
  if (manaStore.isFamily) return true
  if (usesOwnServer.value) return true
  return manaStore.balance > 0
})

const canGenerate = computed(() =>
  Boolean(artStore.canGenerateArt && !artStore.isGenerating && canAfford.value),
)

// flux and kontext need their model family installed on the server; krea2,
// flux2, and the named-checkpoint lane run on any Comfy box. When the chosen
// recipe cannot run where this job is headed, the store silently substitutes
// another engine -- so say so here instead of rendering something the Recipe
// chip never described.
const engineWarning = computed(() => {
  const server = billingServer.value
  if (!server) return ''
  if (artStore.canServerRunEngine(server, activePreset.value.engine)) return ''
  return `${serverLabel(server)} cannot run ${activeProfile.value.label}. This job will be rerouted to whichever lane that server does support.`
})

const busyLabel = computed(() => {
  if (artStore.queueState === 'queued') return 'Queued…'
  if (artStore.queueState === 'rendering') return 'Rendering…'
  return 'Generating…'
})

const readinessSummary = computed(() => {
  if (!artStore.finalPromptString) return 'Write a prompt to begin.'
  if (!canAfford.value) return 'Your mana balance is empty.'
  const parts = [activePreset.value.label]
  if (activeProfile.value.supports.checkpoint && checkpointName.value) {
    parts.push(checkpointName.value)
  }
  if (loraResourceId.value) parts.push('+ LoRA')
  if (facetIds.value.length) parts.push(`${facetIds.value.length} Facets`)
  return parts.join(' · ')
})

const activeRolls = computed(() =>
  Object.entries(randomStore.randomSelections as Record<string, string>).map(
    ([key, value]) => ({
      key,
      value,
      label: key
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replaceAll('_', ' ')
        .replace(/^./, (letter) => letter.toUpperCase()),
    }),
  ),
)

// ── Lifecycle ───────────────────────────────────────────────────────────────

onMounted(async () => {
  const [result] = await Promise.all([
    artStore.prepareArtGenerator(),
    artFacetDraft.initialize(),
    randomStore.initialize(),
    resourceStore.hasLoaded ? Promise.resolve() : resourceStore.getResources(),
  ])

  applyPreset(presetId.value)

  if (artStore.artForm.serverId) {
    serverChoice.value = `server:${artStore.artForm.serverId}`
  }

  if (!result.success) {
    errorStore.addError(
      ErrorType.GENERAL_ERROR,
      result.message || 'Failed to load image generator.',
    )
  }
})

// A checkpoint that disappears from the list -- usually because the maturity
// toggle above was turned off -- must not stay selected on the form.
watch(checkpointOptions, (options) => {
  if (!activeProfile.value.supports.checkpoint) return
  const name = checkpointName.value
  if (!name && options.length) {
    checkpointName.value = String(options[0]?.name || '').trim()
    return
  }
  if (
    name &&
    !options.some((checkpoint) => String(checkpoint.name || '').trim() === name)
  ) {
    checkpointName.value = String(options[0]?.name || '').trim()
  }
})

watch(serverChoice, (choice) => {
  if (choice === 'default' || choice === 'any') {
    artStore.selectGenerationServer(null)
    return
  }
  artStore.selectGenerationServer(specificServerId.value)
})

// ── Actions ─────────────────────────────────────────────────────────────────

function serverLabel(server: Server): string {
  return server.label || server.title || `Server #${server.id}`
}

function checkpointLabel(checkpoint: CheckpointResource): string {
  return (
    String(checkpoint.customLabel || '').trim() ||
    String(checkpoint.name || '').trim() ||
    `Checkpoint #${checkpoint.id ?? 'unknown'}`
  )
}

function clearPrompt(): void {
  promptStore.promptField = ''
  artStore.setArtForm({ promptString: '', negativePrompt: '' })
  artStore.clearGenerationMessage()
}

function handleCollectionSelected(collection: ArtCollection): void {
  artStore.selectGenerationCollection(collection.id)
}

function goToGallery(): void {
  navStore.setDashboardTab('art', 'gallery', 'art generator result panel')
}

function buildOverrides(): GenerateOverrides {
  const base: GenerateOverrides =
    serverChoice.value === 'default'
      ? { serverId: null, serverName: null, serverSelectionMode: 'default' }
      : serverChoice.value === 'any'
        ? { serverId: null, serverName: null, serverSelectionMode: 'any' }
        : {
            serverId: specificServer.value?.id ?? null,
            serverName: specificServer.value
              ? serverLabel(specificServer.value)
              : null,
            serverSelectionMode: 'specific',
          }

  const basePrompt = String(
    artStore.finalPromptString || artStore.artForm.promptString || '',
  )

  return artFacetDraft.decorateGenerationData(
    base as Record<string, unknown>,
    basePrompt,
  ) as GenerateOverrides
}

async function handleGenerate(): Promise<void> {
  const result = await artStore.generateCurrentArt(buildOverrides())
  if (result.success) return

  const message = result.message || 'Generation failed.'
  errorStore.addError(
    /mana|⚡/i.test(message)
      ? ErrorType.INTERACTION_ERROR
      : ErrorType.GENERAL_ERROR,
    /mana|⚡/i.test(message)
      ? `${message} Visit your wallet to top up.`
      : message,
  )
}
</script>
