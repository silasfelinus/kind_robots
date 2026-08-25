<template>
  <main class="kr-surface h-full min-h-0 overflow-hidden">
    <div class="kr-scroll kr-container-wide space-y-5 p-4 md:p-6">
      <header class="kr-toolbar flex flex-wrap items-start justify-between gap-4">
        <div class="max-w-3xl">
          <p class="text-xs font-black uppercase tracking-widest text-primary">
            Admin production
          </p>
          <h1 class="mt-1 text-3xl font-black">Curation Studio</h1>
          <p class="mt-2 text-sm leading-6 text-base-content/65">
            Compare the idea, the prompt, and the art in one place. Cthulhuquarium keeps
            its fish canon separate from curation decisions; Coloring Book keeps writing
            back through its existing canonical Conductor workflow.
          </p>
        </div>
        <button
          type="button"
          class="btn btn-sm rounded-xl"
          :disabled="loading"
          @click="refresh"
        >
          <span v-if="loading" class="loading loading-spinner loading-xs" />
          Refresh
        </button>
      </header>

      <div v-if="!ready" class="grid min-h-60 place-items-center kr-panel">
        <span class="loading loading-spinner loading-lg text-primary" />
      </div>

      <div
        v-else-if="!userStore.isAdmin"
        class="rounded-2xl border border-error/40 bg-error/10 p-8 text-center"
      >
        <p class="text-xl font-black">Administrator access required</p>
        <p class="mt-2 text-sm text-base-content/60">
          This screen edits production prompts and can enqueue GPU work.
        </p>
      </div>

      <template v-else>
        <nav class="tabs tabs-boxed w-fit bg-base-200 p-1" aria-label="Curation project">
          <button
            type="button"
            class="tab font-black"
            :class="{ 'tab-active': project === 'cthulhuquarium' }"
            @click="project = 'cthulhuquarium'"
          >
            🐟 Cthulhuquarium
          </button>
          <button
            type="button"
            class="tab font-black"
            :class="{ 'tab-active': project === 'coloring-book' }"
            @click="project = 'coloring-book'"
          >
            ✏️ Coloring Book
          </button>
        </nav>

        <div
          v-if="notice"
          class="alert border border-info/25 bg-info/10 text-base-content"
          role="status"
        >
          <span>{{ notice }}</span>
          <button type="button" class="btn btn-ghost btn-xs" @click="notice = ''">Dismiss</button>
        </div>
        <div
          v-if="error"
          class="alert border border-error/25 bg-error/10 text-base-content"
          role="alert"
        >
          <span class="min-w-0 flex-1 break-words">{{ error }}</span>
          <button type="button" class="btn btn-ghost btn-xs" @click="error = ''">Dismiss</button>
        </div>

        <section v-if="project === 'cthulhuquarium'" class="space-y-4">
          <div class="kr-panel flex flex-wrap items-end gap-3 p-4">
            <label class="form-control min-w-56 flex-1 gap-1">
              <span class="text-xs font-bold text-base-content/55">Find a monster</span>
              <input
                v-model="cthSearch"
                type="search"
                class="input input-bordered input-sm rounded-xl"
                placeholder="name, species, lore..."
              />
            </label>
            <label class="flex cursor-pointer items-center gap-2 rounded-xl border border-base-300 px-3 py-2 text-sm font-bold">
              <input v-model="hideSettled" type="checkbox" class="checkbox checkbox-sm" />
              Hide settled designs
            </label>
            <div class="ml-auto text-right text-xs text-base-content/50">
              <p class="font-black text-base-content/80">{{ visibleFish.length }} shown</p>
              <p>{{ settledFishCount }} / {{ cthData?.fish.length || 0 }} designs settled</p>
            </div>
          </div>

          <div v-if="cthLoading" class="grid min-h-64 place-items-center kr-panel">
            <span class="loading loading-spinner loading-lg text-primary" />
          </div>

          <div
            v-else-if="!visibleFish.length"
            class="grid min-h-52 place-items-center rounded-2xl border border-dashed border-base-300 bg-base-100/50 p-8 text-center"
          >
            <p class="font-black">No fish match this view.</p>
          </div>

          <div v-else class="grid items-start gap-4 xl:grid-cols-2 3xl:grid-cols-3">
            <article
              v-for="fish in visibleFish"
              :key="fish.slug"
              class="kr-panel overflow-hidden"
            >
              <div class="border-b border-base-300 bg-base-200/60 p-4">
                <div class="flex items-start justify-between gap-3">
                  <div class="min-w-0">
                    <div class="flex flex-wrap items-center gap-2">
                      <h2 class="text-xl font-black">{{ fish.name }}</h2>
                      <span class="badge badge-sm badge-outline">{{ fish.rarity }}</span>
                    </div>
                    <p class="mt-1 text-xs italic text-base-content/50">{{ fish.species }}</p>
                  </div>
                  <a
                    :href="fish.sourceUrl"
                    target="_blank"
                    rel="noreferrer"
                    class="btn btn-ghost btn-xs"
                  >
                    YAML ↗
                  </a>
                </div>
                <div class="mt-3 rounded-xl border border-base-content/10 bg-base-100/70 p-3">
                  <p class="text-[11px] font-black uppercase tracking-wider text-primary">
                    Ichthyonomicon
                  </p>
                  <p class="mt-1 text-sm leading-6">{{ fish.fieldNote || 'Entry not written yet.' }}</p>
                </div>
              </div>

              <div class="space-y-4 p-4">
                <div class="grid grid-cols-3 gap-2">
                  <div class="space-y-1">
                    <p class="text-[10px] font-black uppercase tracking-wider text-base-content/45">
                      Inspiration
                    </p>
                    <div class="aspect-square overflow-hidden rounded-xl bg-base-200">
                      <img
                        v-if="fish.curation.inspirations[0]?.url"
                        :src="fish.curation.inspirations[0].url"
                        :alt="`${fish.name} inspiration`"
                        class="size-full object-cover"
                      />
                      <div v-else class="grid size-full place-items-center p-2 text-center text-xs text-base-content/35">
                        No reference yet
                      </div>
                    </div>
                    <p v-if="fish.curation.inspirations.length > 1" class="text-[10px] text-base-content/45">
                      +{{ fish.curation.inspirations.length - 1 }} more references
                    </p>
                  </div>

                  <div class="space-y-1">
                    <p class="text-[10px] font-black uppercase tracking-wider text-base-content/45">
                      Chosen design
                    </p>
                    <div class="aspect-square overflow-hidden rounded-xl bg-base-200">
                      <img
                        v-if="fish.curation.selectedDesignImageId"
                        :src="artImageUrl(fish.curation.selectedDesignImageId)"
                        :alt="`${fish.name} selected design`"
                        class="size-full object-cover"
                      />
                      <div v-else class="grid size-full place-items-center p-2 text-center text-xs text-base-content/35">
                        Still deciding
                      </div>
                    </div>
                  </div>

                  <div class="space-y-1">
                    <p class="text-[10px] font-black uppercase tracking-wider text-base-content/45">
                      Sprite
                    </p>
                    <div class="aspect-square overflow-hidden rounded-xl bg-base-200">
                      <img
                        v-if="fish.curation.spriteImageIds[0]"
                        :src="artImageUrl(fish.curation.spriteImageIds[0])"
                        :alt="`${fish.name} sprite`"
                        class="size-full object-contain p-1"
                      />
                      <div v-else class="grid size-full place-items-center p-2 text-center text-xs text-base-content/35">
                        No sprite yet
                      </div>
                    </div>
                    <p v-if="fish.curation.spriteImageIds.length > 1" class="text-[10px] text-base-content/45">
                      {{ fish.curation.spriteImageIds.length }} sprite frames / variants
                    </p>
                  </div>
                </div>

                <label class="form-control gap-1">
                  <span class="flex items-center justify-between gap-2 text-xs font-black">
                    Art prompt
                    <span v-if="fish.curation.promptOverride" class="badge badge-xs badge-warning">draft override</span>
                  </span>
                  <textarea
                    v-model="draftFor(fish.slug).prompt"
                    class="textarea textarea-bordered min-h-28 rounded-xl text-sm leading-5"
                    :placeholder="fish.artPrompt"
                  />
                  <span class="text-[11px] text-base-content/45">
                    Canon stays untouched while the fish-bible choice is unresolved. This draft is the prompt used for renders.
                  </span>
                </label>

                <div class="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
                  <input
                    v-model="draftFor(fish.slug).inspirationUrl"
                    type="url"
                    class="input input-bordered input-sm rounded-xl"
                    placeholder="Add inspiration image URL"
                  />
                  <button
                    type="button"
                    class="btn btn-sm rounded-xl"
                    :disabled="!draftFor(fish.slug).inspirationUrl.trim() || isSaving(fish.slug)"
                    @click="addInspiration(fish)"
                  >
                    Add reference
                  </button>
                </div>

                <details v-if="fish.curation.inspirations.length" class="rounded-xl border border-base-300 bg-base-100 p-3">
                  <summary class="cursor-pointer text-xs font-black">All inspiration art</summary>
                  <div class="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-5">
                    <div v-for="inspiration in fish.curation.inspirations" :key="inspiration.id" class="group relative">
                      <img :src="inspiration.url" :alt="inspiration.label" class="aspect-square w-full rounded-lg object-cover" />
                      <button
                        type="button"
                        class="btn btn-circle btn-error btn-xs absolute right-1 top-1 opacity-90"
                        aria-label="Remove inspiration"
                        @click="removeInspiration(fish, inspiration.id)"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                </details>

                <div class="rounded-xl border border-base-300 bg-base-100 p-3">
                  <div class="grid gap-3 sm:grid-cols-2">
                    <label class="form-control gap-1">
                      <span class="text-xs font-black">Render preset</span>
                      <select v-model="draftFor(fish.slug).presetId" class="select select-bordered select-sm rounded-xl">
                        <option v-for="preset in artPresets" :key="preset.id" :value="preset.id">
                          {{ preset.label }}
                        </option>
                      </select>
                    </label>
                    <label class="form-control gap-1">
                      <span class="text-xs font-black">Starting point</span>
                      <select v-model="draftFor(fish.slug).sourceMode" class="select select-bordered select-sm rounded-xl">
                        <option value="fresh">Fresh composition</option>
                        <option value="existing">Existing candidate art</option>
                      </select>
                    </label>
                  </div>

                  <div v-if="draftFor(fish.slug).sourceMode === 'existing'" class="mt-3 grid gap-3 sm:grid-cols-2">
                    <label class="form-control gap-1">
                      <span class="text-xs font-black">Source ArtImage</span>
                      <select v-model.number="draftFor(fish.slug).sourceImageId" class="select select-bordered select-sm rounded-xl">
                        <option :value="0">Choose candidate</option>
                        <option
                          v-if="fish.curation.selectedDesignImageId"
                          :value="fish.curation.selectedDesignImageId"
                        >
                          #{{ fish.curation.selectedDesignImageId }} · chosen design
                        </option>
                        <option v-for="id in fish.curation.candidateImageIds" :key="id" :value="id">
                          #{{ id }}
                        </option>
                      </select>
                    </label>
                    <label class="form-control gap-1">
                      <span class="text-xs font-black">SDXL checkpoint</span>
                      <select v-model="draftFor(fish.slug).checkpoint" class="select select-bordered select-sm rounded-xl">
                        <option value="">Choose checkpoint</option>
                        <option v-for="checkpoint in checkpoints" :key="String(checkpoint.id || checkpoint.name)" :value="checkpoint.name || ''">
                          {{ checkpoint.customLabel || checkpoint.name }}
                        </option>
                      </select>
                    </label>
                    <p class="sm:col-span-2 text-[11px] leading-5 text-base-content/45">
                      Existing-art revisions use the normal SDXL img2img queue so the source image is actually conditioning the render.
                    </p>
                  </div>

                  <div class="mt-3 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      class="btn btn-primary btn-sm rounded-xl"
                      :disabled="isGenerating(fish.slug) || !canGenerate(fish)"
                      @click="generateFish(fish)"
                    >
                      <span v-if="isGenerating(fish.slug)" class="loading loading-spinner loading-xs" />
                      {{ isGenerating(fish.slug) ? generationLabel(fish.slug) : 'Generate idea' }}
                    </button>
                    <button
                      type="button"
                      class="btn btn-ghost btn-sm rounded-xl"
                      :disabled="isSaving(fish.slug)"
                      @click="saveFish(fish)"
                    >
                      <span v-if="isSaving(fish.slug)" class="loading loading-spinner loading-xs" />
                      Save curation
                    </button>
                    <span v-if="draftFor(fish.slug).jobId" class="text-xs text-base-content/45">
                      ArtJob #{{ draftFor(fish.slug).jobId }}
                    </span>
                  </div>
                </div>

                <div v-if="fish.curation.candidateImageIds.length" class="space-y-2">
                  <p class="text-xs font-black uppercase tracking-wider text-base-content/45">Candidates</p>
                  <div class="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
                    <div v-for="id in fish.curation.candidateImageIds" :key="id" class="rounded-xl border border-base-300 bg-base-100 p-1.5">
                      <img :src="artImageUrl(id)" :alt="`${fish.name} candidate ${id}`" class="aspect-square w-full rounded-lg object-cover" />
                      <p class="mt-1 text-center text-[10px] font-bold">#{{ id }}</p>
                      <div class="mt-1 grid grid-cols-2 gap-1">
                        <button
                          type="button"
                          class="btn btn-xs h-auto min-h-7 px-1"
                          :class="fish.curation.selectedDesignImageId === id ? 'btn-success' : 'btn-ghost'"
                          @click="chooseDesign(fish, id)"
                        >
                          Design
                        </button>
                        <button
                          type="button"
                          class="btn btn-xs h-auto min-h-7 px-1"
                          :class="fish.curation.spriteImageIds.includes(id) ? 'btn-secondary' : 'btn-ghost'"
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

        <section v-else class="space-y-4">
          <div class="kr-panel flex flex-wrap items-end gap-3 p-4">
            <label class="form-control min-w-60 gap-1">
              <span class="text-xs font-bold text-base-content/55">Book</span>
              <select
                :value="coloringStore.selectedBookSlug"
                class="select select-bordered select-sm rounded-xl"
                @change="coloringStore.selectBook(eventValue($event))"
              >
                <option v-for="book in coloringStore.books" :key="book.slug" :value="book.slug">
                  {{ book.title }} · {{ book.counts.finalPairs }}/{{ book.counts.total }} final
                </option>
              </select>
            </label>
            <label class="form-control min-w-56 flex-1 gap-1">
              <span class="text-xs font-bold text-base-content/55">Find a page</span>
              <input v-model="colorSearch" type="search" class="input input-bordered input-sm rounded-xl" placeholder="title, prompt, notes..." />
            </label>
            <label class="flex cursor-pointer items-center gap-2 rounded-xl border border-base-300 px-3 py-2 text-sm font-bold">
              <input v-model="hideFinalColoring" type="checkbox" class="checkbox checkbox-sm" />
              Hide final pairs
            </label>
          </div>

          <div v-if="coloringStore.loading" class="grid min-h-64 place-items-center kr-panel">
            <span class="loading loading-spinner loading-lg text-primary" />
          </div>

          <div v-else class="grid items-start gap-4 xl:grid-cols-2 3xl:grid-cols-3">
            <article v-for="proposal in visibleProposals" :key="proposal.id" class="kr-panel overflow-hidden">
              <div class="border-b border-base-300 bg-base-200/60 p-4">
                <div class="flex items-start justify-between gap-3">
                  <div>
                    <p class="text-[11px] font-black uppercase tracking-wider text-primary">Slot {{ proposal.slot }}</p>
                    <h2 class="mt-1 text-xl font-black">{{ proposal.title }}</h2>
                  </div>
                  <span class="badge badge-sm" :class="proposal.final.color && proposal.final.bw ? 'badge-success' : 'badge-outline'">
                    {{ proposal.final.color && proposal.final.bw ? 'final' : proposal.queue.status }}
                  </span>
                </div>
                <p v-if="proposal.notes.length" class="mt-2 text-xs leading-5 text-base-content/55">
                  {{ proposal.notes.join(' · ') }}
                </p>
              </div>

              <div class="space-y-4 p-4">
                <div class="grid grid-cols-2 gap-2">
                  <figure class="overflow-hidden rounded-xl bg-base-200">
                    <div class="aspect-square">
                      <img v-if="proposal.colorUrl" :src="proposal.colorUrl" :alt="`${proposal.title} color candidate`" class="size-full object-cover" />
                      <div v-else class="grid size-full place-items-center text-xs text-base-content/35">No color candidate</div>
                    </div>
                    <figcaption class="flex items-center justify-between gap-2 p-2 text-[11px] font-black">
                      <span>COLOR</span>
                      <span class="opacity-50">{{ proposal.accepted.color ? 'accepted' : 'candidate' }}</span>
                    </figcaption>
                  </figure>
                  <figure class="overflow-hidden rounded-xl bg-base-200">
                    <div class="aspect-square">
                      <img v-if="proposal.bwUrl" :src="proposal.bwUrl" :alt="`${proposal.title} black and white candidate`" class="size-full object-cover" />
                      <div v-else class="grid size-full place-items-center text-xs text-base-content/35">No B&amp;W candidate</div>
                    </div>
                    <figcaption class="flex items-center justify-between gap-2 p-2 text-[11px] font-black">
                      <span>BLACK + WHITE</span>
                      <span class="opacity-50">{{ proposal.accepted.bw ? 'accepted' : 'candidate' }}</span>
                    </figcaption>
                  </figure>
                </div>

                <div v-if="proposal.inspirations.length" class="flex gap-2 overflow-x-auto pb-1">
                  <figure v-for="asset in proposal.inspirations" :key="asset.path" class="w-20 shrink-0">
                    <img v-if="asset.url" :src="asset.url" :alt="asset.kind" class="aspect-square w-full rounded-lg object-cover" />
                    <div v-else class="grid aspect-square w-full place-items-center rounded-lg bg-base-200 text-[10px] text-base-content/35">reference</div>
                  </figure>
                </div>

                <label class="form-control gap-1">
                  <span class="text-xs font-black">Pitch / art prompt</span>
                  <textarea
                    v-model="colorDraftFor(proposal.id)"
                    class="textarea textarea-bordered min-h-32 rounded-xl text-sm leading-5"
                  />
                </label>

                <div class="flex flex-wrap gap-2">
                  <button
                    type="button"
                    class="btn btn-primary btn-sm rounded-xl"
                    :disabled="coloringStore.savingPrompt"
                    @click="saveColorPrompt(proposal.id)"
                  >
                    Save prompt
                  </button>
                  <button
                    type="button"
                    class="btn btn-sm rounded-xl"
                    :disabled="coloringStore.requestingAction"
                    @click="colorAction(proposal.id, 'color')"
                  >
                    New color
                  </button>
                  <button
                    type="button"
                    class="btn btn-sm rounded-xl"
                    :disabled="coloringStore.requestingAction"
                    @click="colorAction(proposal.id, 'bw')"
                  >
                    New B&amp;W
                  </button>
                  <button
                    v-if="proposal.colorPath"
                    type="button"
                    class="btn btn-success btn-outline btn-sm rounded-xl"
                    :disabled="coloringStore.requestingAction"
                    @click="acceptColorCandidate(proposal.id, proposal.colorPath)"
                  >
                    Accept color
                  </button>
                  <button
                    v-if="proposal.bwPath"
                    type="button"
                    class="btn btn-success btn-outline btn-sm rounded-xl"
                    :disabled="coloringStore.requestingAction"
                    @click="acceptBwCandidate(proposal.id, proposal.bwPath)"
                  >
                    Accept B&amp;W
                  </button>
                  <button
                    v-if="proposal.accepted.color && proposal.accepted.bw && !(proposal.final.color && proposal.final.bw)"
                    type="button"
                    class="btn btn-success btn-sm rounded-xl"
                    :disabled="coloringStore.requestingAction"
                    @click="finalizeColorPair(proposal.id)"
                  >
                    Finalize pair
                  </button>
                </div>
              </div>
            </article>
          </div>
        </section>
      </template>
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import type { Resource } from '~/prisma/generated/prisma/client'
import type {
  CthulhuquariumCurationData,
  CthulhuquariumCurationEntry,
  CthulhuquariumCurationFish,
} from '~/types/curationStudio'
import type { ColoringBookProposal } from '~/types/coloringBookStudio'
import { useUserStore } from '@/stores/userStore'
import { useArtStore } from '@/stores/artStore'
import { useCheckpointStore } from '@/stores/checkpointStore'
import { useColoringBookStudioStore } from '@/stores/coloringBookStudioStore'
import { performFetch } from '@/stores/utils'
import {
  ART_GENERATOR_PRESETS,
  DEFAULT_ART_PRESET_ID,
  type ArtGeneratorPreset,
} from '@/utils/artGeneratorPresets'

const userStore = useUserStore()
const artStore = useArtStore()
const checkpointStore = useCheckpointStore()
const coloringStore = useColoringBookStudioStore()

const project = ref<'cthulhuquarium' | 'coloring-book'>('cthulhuquarium')
const ready = ref(false)
const cthLoading = ref(false)
const cthData = ref<CthulhuquariumCurationData | null>(null)
const cthSearch = ref('')
const hideSettled = ref(false)
const colorSearch = ref('')
const hideFinalColoring = ref(false)
const error = ref('')
const notice = ref('')
const savingSlugs = ref<string[]>([])
const generatingSlugs = ref<string[]>([])

const artPresets = ART_GENERATOR_PRESETS
const checkpoints = computed<Partial<Resource>[]>(() => checkpointStore.visibleCheckpoints)

type FishDraft = {
  prompt: string
  inspirationUrl: string
  presetId: string
  sourceMode: 'fresh' | 'existing'
  sourceImageId: number
  checkpoint: string
  jobId: number | null
  jobStatus: string
}

const fishDrafts = reactive<Record<string, FishDraft>>({})
const colorDrafts = reactive<Record<string, string>>({})

const loading = computed(() => cthLoading.value || coloringStore.loading)

const visibleFish = computed(() => {
  const query = cthSearch.value.trim().toLowerCase()
  return (cthData.value?.fish || []).filter((fish) => {
    if (hideSettled.value && fish.curation.selectedDesignImageId) return false
    if (!query) return true
    return [fish.name, fish.slug, fish.species, fish.fieldNote, fish.artPrompt]
      .join(' ')
      .toLowerCase()
      .includes(query)
  })
})

const settledFishCount = computed(
  () => cthData.value?.fish.filter((fish) => fish.curation.selectedDesignImageId).length || 0,
)

const visibleProposals = computed<ColoringBookProposal[]>(() => {
  const query = colorSearch.value.trim().toLowerCase()
  return (coloringStore.selectedBook?.proposals || []).filter((proposal) => {
    if (hideFinalColoring.value && proposal.final.color && proposal.final.bw) return false
    if (!query) return true
    return [proposal.title, proposal.id, proposal.prompt, ...proposal.notes]
      .join(' ')
      .toLowerCase()
      .includes(query)
  })
})

onMounted(async () => {
  await userStore.initialize()
  if (userStore.isAdmin) {
    checkpointStore.initialize()
    await refresh()
  }
  ready.value = true
})

async function refresh() {
  error.value = ''
  await Promise.all([loadCthulhuquarium(), coloringStore.fetchStudio()])
  syncColorDrafts()
}

async function loadCthulhuquarium() {
  cthLoading.value = true
  try {
    const response = await performFetch<CthulhuquariumCurationData>(
      '/api/admin/curation-studio/cthulhuquarium',
    )
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to load Cthulhuquarium curation data.')
    }
    cthData.value = response.data
    for (const fish of response.data.fish) {
      const existing = fishDrafts[fish.slug]
      fishDrafts[fish.slug] = {
        prompt: fish.curation.promptOverride || fish.artPrompt,
        inspirationUrl: existing?.inspirationUrl || '',
        presetId: existing?.presetId || DEFAULT_ART_PRESET_ID,
        sourceMode: existing?.sourceMode || 'fresh',
        sourceImageId:
          existing?.sourceImageId || fish.curation.selectedDesignImageId || fish.curation.candidateImageIds[0] || 0,
        checkpoint: existing?.checkpoint || String(checkpointStore.selectedCheckpoint?.name || ''),
        jobId: existing?.jobId || null,
        jobStatus: existing?.jobStatus || '',
      }
    }
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'Failed to load Cthulhuquarium.'
  } finally {
    cthLoading.value = false
  }
}

function syncColorDrafts() {
  for (const book of coloringStore.books) {
    for (const proposal of book.proposals) {
      if (!(proposal.id in colorDrafts)) colorDrafts[proposal.id] = proposal.prompt
    }
  }
}

function draftFor(slug: string): FishDraft {
  if (!fishDrafts[slug]) {
    fishDrafts[slug] = {
      prompt: '',
      inspirationUrl: '',
      presetId: DEFAULT_ART_PRESET_ID,
      sourceMode: 'fresh',
      sourceImageId: 0,
      checkpoint: '',
      jobId: null,
      jobStatus: '',
    }
  }
  return fishDrafts[slug]
}

function colorDraftFor(proposalId: string): string {
  return colorDrafts[proposalId] ?? ''
}

function eventValue(event: Event): string {
  return (event.target as HTMLSelectElement).value
}

function artImageUrl(id: number): string {
  return `/api/art/images/${id}/file`
}

function isSaving(slug: string): boolean {
  return savingSlugs.value.includes(slug)
}

function isGenerating(slug: string): boolean {
  return generatingSlugs.value.includes(slug)
}

function generationLabel(slug: string): string {
  return draftFor(slug).jobStatus === 'RUNNING' ? 'Rendering…' : 'Queued…'
}

function presetFor(slug: string): ArtGeneratorPreset {
  return artPresets.find((preset) => preset.id === draftFor(slug).presetId) || artPresets[0]!
}

function canGenerate(fish: CthulhuquariumCurationFish): boolean {
  const draft = draftFor(fish.slug)
  if (!draft.prompt.trim()) return false
  if (draft.sourceMode === 'existing') return Boolean(draft.sourceImageId && draft.checkpoint)
  const preset = presetFor(fish.slug)
  return preset.engine !== 'comfy' || Boolean(draft.checkpoint || checkpointStore.selectedCheckpoint?.name)
}

function replaceFishCuration(slug: string, entry: CthulhuquariumCurationEntry) {
  const fish = cthData.value?.fish.find((item) => item.slug === slug)
  if (fish) fish.curation = entry
}

async function persistFish(fish: CthulhuquariumCurationFish, entry: Partial<CthulhuquariumCurationEntry>) {
  if (isSaving(fish.slug)) return false
  savingSlugs.value = [...savingSlugs.value, fish.slug]
  error.value = ''
  try {
    const response = await performFetch<CthulhuquariumCurationEntry>(
      '/api/admin/curation-studio/cthulhuquarium',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: fish.slug, ...entry }),
      },
    )
    if (!response.success || !response.data) {
      throw new Error(response.message || `Failed to save ${fish.name}.`)
    }
    replaceFishCuration(fish.slug, response.data)
    return true
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : `Failed to save ${fish.name}.`
    return false
  } finally {
    savingSlugs.value = savingSlugs.value.filter((slug) => slug !== fish.slug)
  }
}

async function saveFish(fish: CthulhuquariumCurationFish) {
  if (await persistFish(fish, { promptOverride: draftFor(fish.slug).prompt.trim() })) {
    notice.value = `${fish.name} curation saved.`
  }
}

async function addInspiration(fish: CthulhuquariumCurationFish) {
  const draft = draftFor(fish.slug)
  const url = draft.inspirationUrl.trim()
  if (!/^https:\/\//i.test(url)) {
    error.value = 'Inspiration art must use an https:// URL.'
    return
  }
  const inspirations = [
    ...fish.curation.inspirations,
    { id: crypto.randomUUID(), label: `Reference ${fish.curation.inspirations.length + 1}`, url },
  ]
  if (await persistFish(fish, { inspirations })) draft.inspirationUrl = ''
}

async function removeInspiration(fish: CthulhuquariumCurationFish, id: string) {
  await persistFish(fish, {
    inspirations: fish.curation.inspirations.filter((item) => item.id !== id),
  })
}

async function chooseDesign(fish: CthulhuquariumCurationFish, id: number) {
  const selectedDesignImageId = fish.curation.selectedDesignImageId === id ? null : id
  if (await persistFish(fish, { selectedDesignImageId })) {
    draftFor(fish.slug).sourceImageId = selectedDesignImageId || id
  }
}

async function toggleSprite(fish: CthulhuquariumCurationFish, id: number) {
  const spriteImageIds = fish.curation.spriteImageIds.includes(id)
    ? fish.curation.spriteImageIds.filter((imageId) => imageId !== id)
    : [...fish.curation.spriteImageIds, id]
  await persistFish(fish, { spriteImageIds })
}

async function imageDataUrl(id: number): Promise<string> {
  const response = await fetch(artImageUrl(id))
  if (!response.ok) throw new Error(`Could not load source ArtImage #${id}.`)
  const blob = await response.blob()
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(new Error(`Could not read source ArtImage #${id}.`))
    reader.readAsDataURL(blob)
  })
}

async function generateFish(fish: CthulhuquariumCurationFish) {
  if (isGenerating(fish.slug) || !canGenerate(fish)) return
  generatingSlugs.value = [...generatingSlugs.value, fish.slug]
  error.value = ''
  const draft = draftFor(fish.slug)
  const preset = presetFor(fish.slug)
  try {
    let jobId = 0
    const checkpoint = draft.checkpoint || String(checkpointStore.selectedCheckpoint?.name || '')
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
      checkpoint: checkpoint || undefined,
      isPublic: false,
      isMature: false,
    }

    if (draft.sourceMode === 'existing') {
      const sourceImageBase64 = await imageDataUrl(draft.sourceImageId)
      const response = await performFetch<{ jobId: number; status: string }>(
        '/api/art/enqueue',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...base,
            engine: 'sdxl-img2img',
            sourceImageBase64,
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
      const enqueued = await artStore.enqueueArtGeneration({
        ...base,
        engine: preset.engine,
      })
      if (!enqueued.success || !enqueued.jobId) {
        throw new Error(enqueued.message || 'Failed to queue render.')
      }
      jobId = enqueued.jobId
    }

    draft.jobId = jobId
    draft.jobStatus = 'PENDING'
    let failures = 0
    while (true) {
      await new Promise((resolve) => setTimeout(resolve, 5_000))
      const job = await artStore.getArtJobStatus(jobId)
      if (!job) {
        failures += 1
        if (failures >= 6) throw new Error(`Lost track of ArtJob #${jobId}.`)
        continue
      }
      failures = 0
      draft.jobStatus = job.status
      if (job.status === 'PENDING' || job.status === 'RUNNING') continue
      if (job.status !== 'DONE' || !job.artImageId) {
        throw new Error(job.error || `ArtJob #${jobId} ${job.status.toLowerCase()}.`)
      }
      const candidateImageIds = [job.artImageId, ...fish.curation.candidateImageIds.filter((id) => id !== job.artImageId)]
      await persistFish(fish, {
        promptOverride: draft.prompt.trim(),
        candidateImageIds,
      })
      draft.sourceImageId = job.artImageId
      notice.value = `${fish.name} candidate #${job.artImageId} is ready.`
      break
    }
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : `Failed to generate ${fish.name}.`
  } finally {
    generatingSlugs.value = generatingSlugs.value.filter((slug) => slug !== fish.slug)
  }
}

function selectColorProposal(proposalId: string) {
  coloringStore.selectProposal(proposalId)
}

async function saveColorPrompt(proposalId: string) {
  selectColorProposal(proposalId)
  const prompt = colorDrafts[proposalId] || ''
  if (await coloringStore.savePrompt(prompt)) {
    syncColorDrafts()
    notice.value = coloringStore.message || 'Prompt saved.'
  } else if (coloringStore.error) error.value = coloringStore.error
}

async function colorAction(proposalId: string, variant: 'color' | 'bw') {
  selectColorProposal(proposalId)
  const ok = variant === 'color'
    ? await coloringStore.requestColorRender(true, 'Requested from Curation Studio')
    : await coloringStore.requestBw(true, 'Requested from Curation Studio')
  if (ok) notice.value = coloringStore.message || `${variant} render requested.`
  else if (coloringStore.error) error.value = coloringStore.error
}

async function acceptColorCandidate(proposalId: string, sourcePath: string) {
  selectColorProposal(proposalId)
  if (await coloringStore.acceptColor('Accepted from Curation Studio', sourcePath)) {
    notice.value = coloringStore.message || 'Color candidate accepted.'
  } else if (coloringStore.error) error.value = coloringStore.error
}

async function acceptBwCandidate(proposalId: string, sourcePath: string) {
  selectColorProposal(proposalId)
  if (await coloringStore.acceptBw('Accepted from Curation Studio', sourcePath)) {
    notice.value = coloringStore.message || 'B&W candidate accepted.'
  } else if (coloringStore.error) error.value = coloringStore.error
}

async function finalizeColorPair(proposalId: string) {
  selectColorProposal(proposalId)
  if (await coloringStore.finalizePair('Finalized from Curation Studio')) {
    notice.value = coloringStore.message || 'Pair finalized.'
  } else if (coloringStore.error) error.value = coloringStore.error
}
</script>
