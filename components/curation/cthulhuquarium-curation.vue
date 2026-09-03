<template>
  <section class="space-y-4">
    <div class="kr-panel flex flex-wrap items-end gap-3 p-4">
      <label class="form-control min-w-56 flex-1 gap-1">
        <span class="text-xs font-bold text-base-content/55"
          >Find a monster</span
        >
        <input
          v-model="search"
          type="search"
          class="input input-bordered input-sm rounded-xl"
          placeholder="name, species, lore..."
        />
      </label>

      <label
        class="flex cursor-pointer items-center gap-2 rounded-xl border border-base-300 px-3 py-2 text-sm font-bold"
      >
        <input
          v-model="hideSettled"
          type="checkbox"
          class="checkbox checkbox-sm"
        />
        Hide settled designs
      </label>

      <div class="ml-auto text-right text-xs text-base-content/50">
        <p class="font-black text-base-content/80">
          {{ visibleRows.length }} shown
        </p>
        <p>{{ settledCount }} / {{ data?.fish.length || 0 }} designs settled</p>
      </div>

      <button class="kr-btn" type="button" :disabled="loading" @click="load">
        <span v-if="loading" class="loading loading-spinner loading-xs" />
        Refresh
      </button>
    </div>

    <div v-if="notice" class="alert border border-info/25 bg-info/10">
      <span>{{ notice }}</span>
      <button class="kr-btn-ghost-xs-plain" type="button" @click="notice = ''">
        Dismiss
      </button>
    </div>
    <div v-if="error" class="alert border border-error/25 bg-error/10">
      <span class="min-w-0 flex-1 break-words">{{ error }}</span>
      <button class="kr-btn-ghost-xs-plain" type="button" @click="error = ''">
        Dismiss
      </button>
    </div>

    <div v-if="loading" class="grid min-h-64 place-items-center kr-panel">
      <span class="loading loading-spinner loading-lg text-primary" />
    </div>

    <div
      v-else-if="!visibleRows.length"
      class="grid min-h-52 place-items-center kr-panel-flat border-dashed bg-base-100/50 p-8 text-center"
    >
      <p class="font-black">No monsters match this view.</p>
    </div>

    <div v-else class="flex flex-wrap items-start gap-4">
      <article
        v-for="{ fish, draft } in visibleRows"
        :key="fish.slug"
        class="kr-panel min-w-0 flex-[1_1_30rem] overflow-hidden"
      >
        <div class="border-b border-base-300 bg-base-200/60 p-4">
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <div class="flex flex-wrap items-center gap-2">
                <h2 class="text-xl font-black">{{ fish.name }}</h2>
                <span class="badge badge-sm badge-outline">{{
                  fish.rarity
                }}</span>
              </div>
              <p class="mt-1 text-xs italic text-base-content/50">
                {{ fish.species }}
              </p>
            </div>
            <a
              :href="fish.sourceUrl"
              target="_blank"
              rel="noreferrer"
              class="kr-btn-ghost-xs-plain"
            >
              YAML ↗
            </a>
          </div>

          <div
            class="mt-3 rounded-xl border border-base-content/10 bg-base-100/70 p-3"
          >
            <p
              class="text-[11px] font-black uppercase tracking-wider text-primary"
            >
              Ichthyonomicon
            </p>
            <p class="mt-1 text-sm leading-6">
              {{ fish.fieldNote || 'Entry not written yet.' }}
            </p>
          </div>
        </div>

        <div class="space-y-4 p-4">
          <div class="grid grid-cols-3 gap-2">
            <ArtSlot
              label="Inspiration"
              :src="fish.curation.inspirations[0]?.url || ''"
              empty="No reference yet"
            />
            <ArtSlot
              label="Chosen design"
              :src="
                fish.curation.selectedDesignImageId
                  ? artImageUrl(fish.curation.selectedDesignImageId)
                  : ''
              "
              empty="Still deciding"
            />
            <ArtSlot
              label="Sprite"
              :src="
                fish.curation.spriteImageIds[0]
                  ? artImageUrl(fish.curation.spriteImageIds[0])
                  : ''
              "
              empty="No sprite yet"
              contain
            />
          </div>

          <p
            v-if="
              fish.curation.inspirations.length > 1 ||
              fish.curation.spriteImageIds.length > 1
            "
            class="text-[11px] text-base-content/45"
          >
            {{ fish.curation.inspirations.length }} inspiration{{
              fish.curation.inspirations.length === 1 ? '' : 's'
            }}
            · {{ fish.curation.spriteImageIds.length }} sprite{{
              fish.curation.spriteImageIds.length === 1 ? '' : 's'
            }}
          </p>

          <label class="form-control gap-1">
            <span
              class="flex items-center justify-between gap-2 text-xs font-black"
            >
              Art prompt
              <span
                v-if="fish.curation.promptOverride"
                class="badge badge-xs badge-warning"
                >draft override</span
              >
            </span>
            <textarea
              v-model="draft.prompt"
              class="textarea textarea-bordered min-h-28 rounded-xl text-sm leading-5"
              :placeholder="fish.artPrompt"
            />
            <span class="text-[11px] text-base-content/45">
              The curation draft is production state; the merged YAML bible
              remains the portable Monster canon until the seed bridge lands.
            </span>
          </label>

          <div class="flex flex-wrap gap-2">
            <input
              v-model="draft.inspirationUrl"
              type="url"
              class="input input-bordered input-sm min-w-56 flex-1 rounded-xl"
              placeholder="Add inspiration image URL"
            />
            <button
              type="button"
              class="btn btn-sm shrink-0 rounded-xl"
              :disabled="!draft.inspirationUrl.trim() || isSaving(fish.slug)"
              @click="addInspiration(fish)"
            >
              Add reference
            </button>
          </div>

          <details
            v-if="fish.curation.inspirations.length"
            class="rounded-xl border border-base-300 bg-base-100 p-3"
          >
            <summary class="cursor-pointer text-xs font-black">
              All inspiration art
            </summary>
            <div class="mt-3 flex gap-2 overflow-x-auto pb-1">
              <div
                v-for="inspiration in fish.curation.inspirations"
                :key="inspiration.id"
                class="relative w-20 shrink-0"
              >
                <img
                  :src="inspiration.url"
                  :alt="inspiration.label"
                  class="aspect-square w-full rounded-lg object-cover"
                />
                <button
                  type="button"
                  class="btn btn-circle btn-error btn-xs absolute right-1 top-1"
                  aria-label="Remove inspiration"
                  @click="removeInspiration(fish, inspiration.id)"
                >
                  ×
                </button>
              </div>
            </div>
          </details>

          <div class="rounded-xl border border-base-300 bg-base-100 p-3">
            <div class="flex flex-wrap gap-3">
              <label class="form-control min-w-52 flex-1 gap-1">
                <span class="text-xs font-black">Render preset</span>
                <select
                  v-model="draft.presetId"
                  class="select select-bordered select-sm rounded-xl"
                >
                  <option
                    v-for="preset in presets"
                    :key="preset.id"
                    :value="preset.id"
                  >
                    {{ preset.label }}
                  </option>
                </select>
                <span class="text-[11px] leading-5 text-base-content/45">
                  FLUX schnell remains the proven Cthulhuquarium default; Krea2
                  is restored and FLUX.2's model configuration is repaired, so
                  every house preset stays selectable.
                </span>
              </label>

              <label class="form-control min-w-52 flex-1 gap-1">
                <span class="text-xs font-black">Starting point</span>
                <select
                  v-model="draft.sourceMode"
                  class="select select-bordered select-sm rounded-xl"
                >
                  <option value="fresh">Fresh composition</option>
                  <option value="existing">Existing candidate art</option>
                </select>
              </label>
            </div>

            <label
              v-if="
                selectedPreset(fish.slug).engine === 'comfy' ||
                draft.sourceMode === 'existing'
              "
              class="form-control mt-3 gap-1"
            >
              <span class="text-xs font-black">SDXL checkpoint</span>
              <select
                v-model="draft.checkpoint"
                class="select select-bordered select-sm rounded-xl"
              >
                <option value="">Choose checkpoint</option>
                <option
                  v-for="checkpoint in checkpoints"
                  :key="String(checkpoint.id || checkpoint.name)"
                  :value="checkpoint.name || ''"
                >
                  {{ checkpoint.customLabel || checkpoint.name }}
                </option>
              </select>
            </label>

            <label
              v-if="draft.sourceMode === 'existing'"
              class="form-control mt-3 gap-1"
            >
              <span class="text-xs font-black">Source ArtImage</span>
              <select
                v-model.number="draft.sourceImageId"
                class="select select-bordered select-sm rounded-xl"
              >
                <option :value="0">Choose candidate</option>
                <option
                  v-if="fish.curation.selectedDesignImageId"
                  :value="fish.curation.selectedDesignImageId"
                >
                  #{{ fish.curation.selectedDesignImageId }} · chosen design
                </option>
                <option
                  v-for="id in fish.curation.candidateImageIds"
                  :key="id"
                  :value="id"
                >
                  #{{ id }}
                </option>
              </select>
              <span class="text-[11px] leading-5 text-base-content/45">
                Existing-art revisions run through the normal SDXL img2img queue
                with this candidate as the conditioning image.
              </span>
            </label>

            <div class="mt-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                class="kr-btn-primary"
                :disabled="isGenerating(fish.slug) || !canGenerate(fish)"
                @click="generate(fish)"
              >
                <span
                  v-if="isGenerating(fish.slug)"
                  class="loading loading-spinner loading-xs"
                />
                {{
                  isGenerating(fish.slug)
                    ? generationLabel(fish.slug)
                    : 'Generate idea'
                }}
              </button>
              <button
                type="button"
                class="kr-btn-ghost"
                :disabled="isSaving(fish.slug)"
                @click="save(fish)"
              >
                <span
                  v-if="isSaving(fish.slug)"
                  class="loading loading-spinner loading-xs"
                />
                Save curation
              </button>
              <span v-if="draft.jobId" class="text-xs text-base-content/45">
                ArtJob #{{ draft.jobId }}
              </span>
            </div>
          </div>

          <div v-if="fish.curation.candidateImageIds.length" class="space-y-2">
            <p
              class="text-xs font-black uppercase tracking-wider text-base-content/45"
            >
              Candidates
            </p>
            <div class="flex flex-wrap gap-2">
              <div
                v-for="id in fish.curation.candidateImageIds"
                :key="id"
                class="w-24 shrink-0 rounded-xl border border-base-300 bg-base-100 p-1.5"
              >
                <img
                  :src="artImageUrl(id)"
                  :alt="`${fish.name} candidate ${id}`"
                  class="aspect-square w-full rounded-lg object-cover"
                />
                <p class="mt-1 text-center text-[10px] font-bold">#{{ id }}</p>
                <div class="mt-1 grid grid-cols-2 gap-1">
                  <button
                    type="button"
                    class="btn btn-xs h-auto min-h-7 px-1"
                    :class="
                      fish.curation.selectedDesignImageId === id
                        ? 'btn-success'
                        : 'btn-ghost'
                    "
                    @click="chooseDesign(fish, id)"
                  >
                    Design
                  </button>
                  <button
                    type="button"
                    class="btn btn-xs h-auto min-h-7 px-1"
                    :class="
                      fish.curation.spriteImageIds.includes(id)
                        ? 'btn-secondary'
                        : 'btn-ghost'
                    "
                    @click="toggleSprite(fish, id)"
                  >
                    Sprite
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, onMounted, reactive, ref } from 'vue'
import type { Resource } from '~/prisma/generated/prisma/client'
import type {
  CthulhuquariumCurationData,
  CthulhuquariumCurationEntry,
  CthulhuquariumCurationMonster,
} from '~/types/curationStudio'
import { useArtStore } from '@/stores/artStore'
import { useCheckpointStore } from '@/stores/checkpointStore'
import { performFetch } from '@/stores/utils'
import {
  ART_GENERATOR_PRESETS,
  type ArtGeneratorPreset,
} from '@/utils/artGeneratorPresets'

const artStore = useArtStore()
const checkpointStore = useCheckpointStore()
const presets = ART_GENERATOR_PRESETS
const CTH_DEFAULT_PRESET_ID = 'flux-schnell'

const data = ref<CthulhuquariumCurationData | null>(null)
const loading = ref(false)
const search = ref('')
const hideSettled = ref(false)
const error = ref('')
const notice = ref('')
const saving = ref<string[]>([])
const generating = ref<string[]>([])

type MonsterDraft = {
  prompt: string
  inspirationUrl: string
  presetId: string
  sourceMode: 'fresh' | 'existing'
  sourceImageId: number
  checkpoint: string
  jobId: number | null
  jobStatus: string
}

type MonsterRow = {
  fish: CthulhuquariumCurationMonster
  draft: MonsterDraft
}

const drafts = reactive<Record<string, MonsterDraft>>({})
const checkpoints = computed<Partial<Resource>[]>(
  () => checkpointStore.visibleCheckpoints,
)

function makeDraft(
  fish: CthulhuquariumCurationMonster,
  previous?: MonsterDraft,
): MonsterDraft {
  return {
    prompt: fish.curation.promptOverride || fish.artPrompt,
    inspirationUrl: previous?.inspirationUrl || '',
    presetId: previous?.presetId || CTH_DEFAULT_PRESET_ID,
    sourceMode: previous?.sourceMode || 'fresh',
    sourceImageId:
      previous?.sourceImageId ||
      fish.curation.selectedDesignImageId ||
      fish.curation.candidateImageIds[0] ||
      0,
    checkpoint:
      previous?.checkpoint ||
      String(checkpointStore.selectedCheckpoint?.name || ''),
    jobId: previous?.jobId || null,
    jobStatus: previous?.jobStatus || '',
  }
}

function draftFor(fish: CthulhuquariumCurationMonster): MonsterDraft {
  const existing = drafts[fish.slug]
  if (existing) return existing
  const created = makeDraft(fish)
  drafts[fish.slug] = created
  return created
}

const visibleRows = computed<MonsterRow[]>(() => {
  const query = search.value.trim().toLowerCase()
  return (data.value?.fish || [])
    .filter((fish) => {
      if (hideSettled.value && fish.curation.selectedDesignImageId) return false
      if (!query) return true
      return [
        fish.name,
        fish.slug,
        fish.species,
        fish.fieldNote,
        fish.artPrompt,
      ]
        .join(' ')
        .toLowerCase()
        .includes(query)
    })
    .map((fish) => ({ fish, draft: draftFor(fish) }))
})

const settledCount = computed(
  () =>
    data.value?.fish.filter((fish) => fish.curation.selectedDesignImageId)
      .length || 0,
)

const ArtSlot = defineComponent({
  props: {
    label: { type: String, required: true },
    src: { type: String, default: '' },
    empty: { type: String, default: 'No art yet' },
    contain: { type: Boolean, default: false },
  },
  setup(props) {
    return () =>
      h('div', { class: 'space-y-1' }, [
        h(
          'p',
          {
            class:
              'text-[10px] font-black uppercase tracking-wider text-base-content/45',
          },
          props.label,
        ),
        h(
          'div',
          { class: 'aspect-square overflow-hidden rounded-xl bg-base-200' },
          [
            props.src
              ? h('img', {
                  src: props.src,
                  alt: props.label,
                  class: props.contain
                    ? 'size-full object-contain p-1'
                    : 'size-full object-cover',
                })
              : h(
                  'div',
                  {
                    class:
                      'grid size-full place-items-center p-2 text-center text-xs text-base-content/35',
                  },
                  props.empty,
                ),
          ],
        ),
      ])
  },
})

onMounted(async () => {
  checkpointStore.initialize()
  await load()
})

async function load() {
  loading.value = true
  error.value = ''
  try {
    const response = await performFetch<CthulhuquariumCurationData>(
      '/api/admin/curation-studio/cthulhuquarium',
    )
    if (!response.success || !response.data) {
      throw new Error(
        response.message || 'Failed to load Cthulhuquarium curation data.',
      )
    }
    data.value = response.data
    for (const fish of response.data.fish) {
      drafts[fish.slug] = makeDraft(fish, drafts[fish.slug])
    }
  } catch (cause) {
    error.value =
      cause instanceof Error ? cause.message : 'Failed to load Cthulhuquarium.'
  } finally {
    loading.value = false
  }
}

function artImageUrl(id: number): string {
  return `/api/art/images/${id}/file`
}

function isSaving(slug: string): boolean {
  return saving.value.includes(slug)
}

function isGenerating(slug: string): boolean {
  return generating.value.includes(slug)
}

function generationLabel(slug: string): string {
  const draft = drafts[slug]
  return draft?.jobStatus === 'RUNNING' ? 'Rendering…' : 'Queued…'
}

function selectedPreset(slug: string): ArtGeneratorPreset {
  const draft = drafts[slug]
  return presets.find((preset) => preset.id === draft?.presetId) || presets[0]!
}

function canGenerate(fish: CthulhuquariumCurationMonster): boolean {
  const draft = draftFor(fish)
  if (!draft.prompt.trim()) return false
  if (draft.sourceMode === 'existing')
    return Boolean(draft.sourceImageId && draft.checkpoint)
  return (
    selectedPreset(fish.slug).engine !== 'comfy' || Boolean(draft.checkpoint)
  )
}

function replaceCuration(slug: string, entry: CthulhuquariumCurationEntry) {
  const fish = data.value?.fish.find((item) => item.slug === slug)
  if (fish) fish.curation = entry
}

async function persist(
  fish: CthulhuquariumCurationMonster,
  patch: Partial<CthulhuquariumCurationEntry>,
) {
  if (isSaving(fish.slug)) return false
  saving.value = [...saving.value, fish.slug]
  error.value = ''
  try {
    const response = await performFetch<CthulhuquariumCurationEntry>(
      '/api/admin/curation-studio/cthulhuquarium',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: fish.slug, ...patch }),
      },
    )
    if (!response.success || !response.data) {
      throw new Error(response.message || `Failed to save ${fish.name}.`)
    }
    replaceCuration(fish.slug, response.data)
    return true
  } catch (cause) {
    error.value =
      cause instanceof Error ? cause.message : `Failed to save ${fish.name}.`
    return false
  } finally {
    saving.value = saving.value.filter((slug) => slug !== fish.slug)
  }
}

async function save(fish: CthulhuquariumCurationMonster) {
  const draft = draftFor(fish)
  if (await persist(fish, { promptOverride: draft.prompt.trim() })) {
    notice.value = `${fish.name} curation saved.`
  }
}

async function addInspiration(fish: CthulhuquariumCurationMonster) {
  const draft = draftFor(fish)
  const url = draft.inspirationUrl.trim()
  if (!/^https:\/\//i.test(url)) {
    error.value = 'Inspiration art must use an https:// URL.'
    return
  }
  const inspirations = [
    ...fish.curation.inspirations,
    {
      id: crypto.randomUUID(),
      label: `Reference ${fish.curation.inspirations.length + 1}`,
      url,
    },
  ]
  if (await persist(fish, { inspirations })) draft.inspirationUrl = ''
}

async function removeInspiration(
  fish: CthulhuquariumCurationMonster,
  id: string,
) {
  await persist(fish, {
    inspirations: fish.curation.inspirations.filter((item) => item.id !== id),
  })
}

async function chooseDesign(fish: CthulhuquariumCurationMonster, id: number) {
  const selectedDesignImageId =
    fish.curation.selectedDesignImageId === id ? null : id
  if (await persist(fish, { selectedDesignImageId })) {
    draftFor(fish).sourceImageId = selectedDesignImageId || id
  }
}

async function toggleSprite(fish: CthulhuquariumCurationMonster, id: number) {
  const spriteImageIds = fish.curation.spriteImageIds.includes(id)
    ? fish.curation.spriteImageIds.filter((imageId) => imageId !== id)
    : [...fish.curation.spriteImageIds, id]
  await persist(fish, { spriteImageIds })
}

async function sourceImageDataUrl(id: number): Promise<string> {
  const response = await fetch(artImageUrl(id))
  if (!response.ok) throw new Error(`Could not load source ArtImage #${id}.`)
  const blob = await response.blob()
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () =>
      reject(new Error(`Could not read source ArtImage #${id}.`))
    reader.readAsDataURL(blob)
  })
}

async function generate(fish: CthulhuquariumCurationMonster) {
  if (isGenerating(fish.slug) || !canGenerate(fish)) return
  generating.value = [...generating.value, fish.slug]
  error.value = ''
  const draft = draftFor(fish)
  const preset = selectedPreset(fish.slug)

  try {
    const base = {
      promptString: draft.prompt.trim(),
      projectSlug: 'cthulhuquarium',
      presetId: preset.id,
      steps: preset.steps,
      cfg: preset.cfg,
      sampler: preset.sampler || undefined,
      scheduler: preset.scheduler || undefined,
      width: preset.width,
      height: preset.height,
      guidance: preset.guidance ?? undefined,
      variant: preset.variant ?? undefined,
      checkpoint: draft.checkpoint || undefined,
      isPublic: false,
      isMature: false,
    }

    let jobId = 0
    if (draft.sourceMode === 'existing') {
      const response = await performFetch<{ jobId: number; status: string }>(
        '/api/art/enqueue',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...base,
            engine: 'sdxl-img2img',
            sourceImageBase64: await sourceImageDataUrl(draft.sourceImageId),
            denoise: 0.62,
          }),
        },
        2,
        60_000,
      )
      if (!response.success || !response.data?.jobId) {
        throw new Error(response.message || 'Failed to queue img2img render.')
      }
      jobId = response.data.jobId
    } else {
      const queued = await artStore.enqueueArtGeneration({
        ...base,
        engine: preset.engine,
      })
      if (!queued.success || !queued.jobId) {
        throw new Error(queued.message || 'Failed to queue render.')
      }
      jobId = queued.jobId
    }

    draft.jobId = jobId
    draft.jobStatus = 'PENDING'
    let pollFailures = 0
    while (true) {
      await new Promise((resolve) => setTimeout(resolve, 5_000))
      const job = await artStore.getArtJobStatus(jobId)
      if (!job) {
        pollFailures += 1
        if (pollFailures >= 6)
          throw new Error(`Lost track of ArtJob #${jobId}.`)
        continue
      }
      pollFailures = 0
      draft.jobStatus = job.status
      if (job.status === 'PENDING' || job.status === 'RUNNING') continue
      if (job.status !== 'DONE' || !job.artImageId) {
        throw new Error(
          job.error || `ArtJob #${jobId} ${job.status.toLowerCase()}.`,
        )
      }

      const candidateImageIds = [
        job.artImageId,
        ...fish.curation.candidateImageIds.filter(
          (id) => id !== job.artImageId,
        ),
      ]
      await persist(fish, {
        promptOverride: draft.prompt.trim(),
        candidateImageIds,
      })
      draft.sourceImageId = job.artImageId
      notice.value = `${fish.name} candidate #${job.artImageId} is ready.`
      break
    }
  } catch (cause) {
    error.value =
      cause instanceof Error
        ? cause.message
        : `Failed to generate ${fish.name}.`
  } finally {
    generating.value = generating.value.filter((slug) => slug !== fish.slug)
  }
}
</script>
